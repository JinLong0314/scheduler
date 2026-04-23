import { newId, todoCreateSchema, todoUpdateSchema } from '@kairo/shared';
import { and, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import type { Env, Variables } from '../env.js';
import { todos } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

export const todoRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

todoRoutes.get('/', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const db = drizzle(c.env.DB);
  const date = c.req.query('date');
  const rows = date
    ? await db
        .select()
        .from(todos)
        .where(and(eq(todos.userId, ctx.userId), eq(todos.scheduledDate, date)))
        .orderBy(desc(todos.createdAt))
        .all()
    : await db
        .select()
        .from(todos)
        .where(eq(todos.userId, ctx.userId))
        .orderBy(desc(todos.createdAt))
        .all();
  return c.json({ items: rows });
});

todoRoutes.post('/', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const body = await c.req.json().catch(() => null);
  const parsed = todoCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'INVALID_INPUT', details: parsed.error.flatten() }, 400);

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

  // If marking complete, ensure all children are complete (requirement from user).
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
  await db
    .update(todos)
    .set({
      title: parsed.data.title ?? existing.title,
      description: parsed.data.description ?? existing.description,
      parentId: parsed.data.parentId ?? existing.parentId,
      rollover: parsed.data.rollover ?? existing.rollover,
      linkedEventId: parsed.data.linkedEventId ?? existing.linkedEventId,
      scheduledDate: parsed.data.scheduledDate ?? existing.scheduledDate,
      completed: parsed.data.completed ?? existing.completed,
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
  const row = await db.select().from(todos).where(eq(todos.id, id)).get();
  return c.json(row);
});

todoRoutes.delete('/:id', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const id = c.req.param('id');
  const db = drizzle(c.env.DB);
  const existing = await db.select().from(todos).where(eq(todos.id, id)).get();
  if (!existing || existing.userId !== ctx.userId) return c.json({ error: 'NOT_FOUND' }, 404);
  await db.delete(todos).where(eq(todos.id, id));
  return c.json({ ok: true });
});
