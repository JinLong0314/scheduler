import { adminConfigUpdateSchema } from '@kairo/shared';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import type { Env, Variables } from '../env.js';
import { adminConfig } from '../db/schema.js';
import { requireAdmin } from '../middleware/auth.js';

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const DEFAULT_CONFIG = {
  siteName: 'Kairo',
  allowRegistration: false,
  enabledLoginMethods: ['password'],
  mapProvider: 'osm',
  ipAllowlist: [] as string[],
  ipBlocklist: [] as string[],
  countryAllowlist: [] as string[],
  countryBlocklist: [] as string[],
  updatedAt: new Date(0).toISOString(),
};

adminRoutes.get('/config', async (c) => {
  const ctx = requireAdmin(c);
  if (ctx instanceof Response) return ctx;
  const db = drizzle(c.env.DB);
  const row = await db.select().from(adminConfig).where(eq(adminConfig.id, 'singleton')).get();
  if (!row) return c.json(DEFAULT_CONFIG);
  return c.json(JSON.parse(row.configJson));
});

adminRoutes.patch('/config', async (c) => {
  const ctx = requireAdmin(c);
  if (ctx instanceof Response) return ctx;
  const body = await c.req.json().catch(() => null);
  const parsed = adminConfigUpdateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'INVALID_INPUT', details: parsed.error.flatten() }, 400);

  const db = drizzle(c.env.DB);
  const row = await db.select().from(adminConfig).where(eq(adminConfig.id, 'singleton')).get();
  const current = row ? JSON.parse(row.configJson) : DEFAULT_CONFIG;
  const next = { ...current, ...parsed.data, updatedAt: new Date().toISOString() };

  if (row) {
    await db
      .update(adminConfig)
      .set({ configJson: JSON.stringify(next), updatedAt: next.updatedAt })
      .where(eq(adminConfig.id, 'singleton'));
  } else {
    await db.insert(adminConfig).values({
      id: 'singleton',
      configJson: JSON.stringify(next),
      updatedAt: next.updatedAt,
    });
  }

  // Mirror to KV for edge-fast reads by ip-guard middleware.
  await c.env.KV.put('admin:config', JSON.stringify(next));

  return c.json(next);
});
