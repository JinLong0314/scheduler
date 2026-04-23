import { eventCreateSchema, eventUpdateSchema, newId } from '@kairo/shared';
import { and, eq, gte, lte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import type { Env, Variables } from '../env.js';
import { events, todos } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

export const eventRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

eventRoutes.get('/', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const db = drizzle(c.env.DB);
  const from = c.req.query('from');
  const to = c.req.query('to');
  const base = [eq(events.userId, ctx.userId)];
  if (from) base.push(gte(events.startAt, from));
  if (to) base.push(lte(events.startAt, to));
  const rows = await db
    .select()
    .from(events)
    .where(and(...base))
    .all();
  return c.json({ items: rows });
});

eventRoutes.post('/', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const body = await c.req.json().catch(() => null);
  const parsed = eventCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'INVALID_INPUT', details: parsed.error.flatten() }, 400);

  const db = drizzle(c.env.DB);
  const id = newId();
  const now = new Date().toISOString();

  let linkedTodoId: string | null = null;
  if (parsed.data.createLinkedTodo) {
    linkedTodoId = newId();
    await db.insert(todos).values({
      id: linkedTodoId,
      userId: ctx.userId,
      parentId: null,
      title: parsed.data.title,
      completed: false,
      rollover: false,
      linkedEventId: id,
      scheduledDate: parsed.data.startAt.slice(0, 10),
      orderIndex: 0,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.insert(events).values({
    id,
    userId: ctx.userId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    startAt: parsed.data.startAt,
    endAt: parsed.data.endAt,
    allDay: parsed.data.allDay,
    timezone: parsed.data.timezone,
    locationJson: parsed.data.location ? JSON.stringify(parsed.data.location) : null,
    remindersJson: JSON.stringify(parsed.data.reminders),
    rrule: parsed.data.rrule,
    colorKey: parsed.data.colorKey,
    linkedTodoId,
    version: 1,
    createdAt: now,
    updatedAt: now,
  });
  const row = await db.select().from(events).where(eq(events.id, id)).get();
  return c.json(row, 201);
});

eventRoutes.patch('/:id', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const parsed = eventUpdateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'INVALID_INPUT' }, 400);

  const db = drizzle(c.env.DB);
  const existing = await db.select().from(events).where(eq(events.id, id)).get();
  if (!existing || existing.userId !== ctx.userId) return c.json({ error: 'NOT_FOUND' }, 404);
  if (existing.version !== parsed.data.version) {
    return c.json({ error: 'CONFLICT', remote: existing }, 409);
  }

  const p = parsed.data.patch;
  const now = new Date().toISOString();
  await db
    .update(events)
    .set({
      title: p.title ?? existing.title,
      description: p.description ?? existing.description,
      startAt: p.startAt ?? existing.startAt,
      endAt: p.endAt ?? existing.endAt,
      allDay: p.allDay ?? existing.allDay,
      timezone: p.timezone ?? existing.timezone,
      locationJson: p.location ? JSON.stringify(p.location) : existing.locationJson,
      remindersJson: p.reminders ? JSON.stringify(p.reminders) : existing.remindersJson,
      rrule: p.rrule ?? existing.rrule,
      colorKey: p.colorKey ?? existing.colorKey,
      version: existing.version + 1,
      updatedAt: now,
    })
    .where(eq(events.id, id));
  const row = await db.select().from(events).where(eq(events.id, id)).get();
  return c.json(row);
});

eventRoutes.delete('/:id', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const id = c.req.param('id');
  const db = drizzle(c.env.DB);
  const existing = await db.select().from(events).where(eq(events.id, id)).get();
  if (!existing || existing.userId !== ctx.userId) return c.json({ error: 'NOT_FOUND' }, 404);
  await db.delete(events).where(and(eq(events.id, id), eq(events.userId, ctx.userId)));
  return c.json({ ok: true });
});
