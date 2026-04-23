import { newId, todoCreateSchema, todoUpdateSchema } from '@kairo/shared';
import { and, asc, desc, eq, gte, isNull, lt, lte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import type { Env, Variables } from '../env.js';
import { events, todos } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

export const todoRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

todoRoutes.get('/', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const db = drizzle(c.env.DB);
  const date = c.req.query('date');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const now = new Date().toISOString();

  // Inline rollover: when the client queries today's todos, roll over past-due rollover todos.
  // This ensures rollover works even without a scheduled cron in local dev.
  if (date) {
    const today = new Date().toISOString().slice(0, 10);
    if (date === today) {
      // 1) Roll over root todos (rollover=true, uncompleted, past-dated)
      await db
        .update(todos)
        .set({ scheduledDate: today, updatedAt: now })
        .where(
          and(
            eq(todos.userId, ctx.userId),
            eq(todos.completed, false),
            eq(todos.rollover, true),
            lt(todos.scheduledDate, today),
            isNull(todos.parentId),
          ),
        );

      // 2) Cascade to children of any root todo now scheduled for today
      const rootsToday = await db
        .select({ id: todos.id })
        .from(todos)
        .where(
          and(
            eq(todos.userId, ctx.userId),
            eq(todos.scheduledDate, today),
            isNull(todos.parentId),
            eq(todos.completed, false),
          ),
        )
        .all();

      for (const parent of rootsToday) {
        await db
          .update(todos)
          .set({ scheduledDate: today, updatedAt: now })
          .where(
            and(
              eq(todos.userId, ctx.userId),
              eq(todos.completed, false),
              lt(todos.scheduledDate, today),
              eq(todos.parentId, parent.id),
            ),
          );
      }
    }
  }

  // Return all todos for the day across all nesting levels; client builds tree.
  let rows;
  if (date) {
    rows = await db
      .select()
      .from(todos)
      .where(and(eq(todos.userId, ctx.userId), eq(todos.scheduledDate, date)))
      .orderBy(asc(todos.orderIndex), asc(todos.createdAt))
      .all();
  } else if (from && to) {
    // Range query for calendar views
    rows = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.userId, ctx.userId),
          gte(todos.scheduledDate, from.slice(0, 10)),
          lte(todos.scheduledDate, to.slice(0, 10)),
        ),
      )
      .orderBy(asc(todos.scheduledDate), asc(todos.orderIndex), asc(todos.createdAt))
      .all();
  } else {
    rows = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, ctx.userId))
      .orderBy(desc(todos.createdAt))
      .all();
  }
  return c.json({ items: rows });
});

todoRoutes.post('/', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const body = await c.req.json().catch(() => null);
  const parsed = todoCreateSchema.safeParse(body);
  if (!parsed.success)
    return c.json({ error: 'INVALID_INPUT', details: parsed.error.flatten() }, 400);

  const db = drizzle(c.env.DB);
  const id = newId();
  const now = new Date().toISOString();
  await db.insert(todos).values({
    id,
    userId: ctx.userId,
    parentId: parsed.data.parentId ?? null,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    completed: false,
    rollover: parsed.data.rollover,
    linkedEventId: parsed.data.linkedEventId ?? null,
    scheduledDate: parsed.data.scheduledDate,
    orderIndex: 0,
    version: 1,
    createdAt: now,
    updatedAt: now,
  });
  const row = await db.select().from(todos).where(eq(todos.id, id)).get();
  return c.json(row, 201);
});

todoRoutes.patch('/:id', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const parsed = todoUpdateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'INVALID_INPUT' }, 400);

  const db = drizzle(c.env.DB);
  const existing = await db.select().from(todos).where(eq(todos.id, id)).get();
  if (!existing || existing.userId !== ctx.userId) return c.json({ error: 'NOT_FOUND' }, 404);

  if (existing.version !== parsed.data.version) {
    return c.json({ error: 'CONFLICT', remote: existing }, 409);
  }

  // If marking complete, ensure all direct children are complete.
  if (parsed.data.completed === true) {
    const children = await db
      .select({ id: todos.id, completed: todos.completed })
      .from(todos)
      .where(eq(todos.parentId, id))
      .all();
    if (children.some((ch) => !ch.completed)) {
      return c.json({ error: 'CHILDREN_INCOMPLETE' }, 400);
    }
  }

  const now = new Date().toISOString();
  const nextCompleted = parsed.data.completed ?? existing.completed;
  await db
    .update(todos)
    .set({
      title: parsed.data.title ?? existing.title,
      description: parsed.data.description ?? existing.description,
      parentId: parsed.data.parentId ?? existing.parentId,
      rollover: parsed.data.rollover ?? existing.rollover,
      linkedEventId: parsed.data.linkedEventId ?? existing.linkedEventId,
      scheduledDate: parsed.data.scheduledDate ?? existing.scheduledDate,
      completed: nextCompleted,
      completedAt:
        parsed.data.completed === true
          ? now
          : parsed.data.completed === false
            ? null
            : existing.completedAt,
      version: existing.version + 1,
      updatedAt: now,
    })
    .where(eq(todos.id, id));

  // Cascade: if parent todo is now uncompleted but had a completed parent, that's fine.
  // If we just completed a child, check whether all siblings are done and auto-suggest
  // parent completion (we surface this via the returned row; client decides).

  const row = await db.select().from(todos).where(eq(todos.id, id)).get();
  // Compute whether parent is now completable (all siblings completed too).
  let parentCompletable = false;
  if (row?.parentId && nextCompleted) {
    const siblings = await db
      .select({ completed: todos.completed })
      .from(todos)
      .where(eq(todos.parentId, row.parentId))
      .all();
    parentCompletable = siblings.every((s) => s.completed);
  }
  return c.json({ ...row, parentCompletable });
});

todoRoutes.delete('/:id', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const id = c.req.param('id');
  const db = drizzle(c.env.DB);
  const existing = await db.select().from(todos).where(eq(todos.id, id)).get();
  if (!existing || existing.userId !== ctx.userId) return c.json({ error: 'NOT_FOUND' }, 404);
  // Delete cascades to children via FK if DB supports it,
  // but SQLite doesn't enforce FK by default — delete children manually.
  await db.delete(todos).where(eq(todos.parentId, id));
  await db.delete(todos).where(eq(todos.id, id));
  // If this todo was linked to an event, unlink it (don't delete the event).
  if (existing.linkedEventId) {
    await db
      .update(events)
      .set({ linkedTodoId: null, updatedAt: new Date().toISOString() })
      .where(eq(events.id, existing.linkedEventId));
  }
  return c.json({ ok: true });
});
