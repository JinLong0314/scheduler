import { newId } from '@kairo/shared';
import { loginInputSchema, registerInputSchema, SESSION_TTL_SECONDS } from '@kairo/shared';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import type { Env, Variables } from '../env.js';
import { hashPassword, newToken, sha256Hex, verifyPassword } from '../lib/crypto.js';
import { users, sessions, loginAttempts } from '../db/schema.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { requireAuth } from '../middleware/auth.js';

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

authRoutes.post(
  '/register',
  rateLimit({ scope: 'register', limit: 10, windowSec: 60 }),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = registerInputSchema.safeParse(body);
    if (!parsed.success)
      return c.json({ error: 'INVALID_INPUT', details: parsed.error.flatten() }, 400);

    const db = drizzle(c.env.DB);

    // TODO: verify Turnstile token with TURNSTILE_SECRET

    const exists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsed.data.email.toLowerCase()))
      .get();
    if (exists) return c.json({ error: 'EMAIL_TAKEN' }, 409);

    // First registered user becomes admin.
    const count = await db.select({ id: users.id }).from(users).limit(1).all();
    const isFirst = count.length === 0;
    const role: 'admin' | 'user' = isFirst ? 'admin' : 'user';

    // Registration policy check for non-first users.
    if (!isFirst) {
      const configStr = await c.env.KV.get('admin:config');
      const cfg = configStr ? (JSON.parse(configStr) as { allowRegistration?: boolean }) : {};
      const allowReg = cfg.allowRegistration ?? false;

      if (!allowReg) {
        // Require a valid invite token supplied in the request body.
        const inviteToken =
          typeof body === 'object' && body !== null
            ? (body as Record<string, unknown>).inviteToken
            : undefined;
        if (typeof inviteToken !== 'string' || !inviteToken) {
          return c.json({ error: 'REGISTRATION_CLOSED' }, 403);
        }
        const inviteData = await c.env.KV.get(`invite:${inviteToken}`);
        if (!inviteData) {
          return c.json({ error: 'INVALID_INVITE_TOKEN' }, 403);
        }
        // Single-use: consume the token
        await c.env.KV.delete(`invite:${inviteToken}`);
      }
    }

    const id = newId();
    const passwordHash = await hashPassword(parsed.data.password);
    const now = new Date().toISOString();

    await db.insert(users).values({
      id,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      displayName: parsed.data.displayName,
      role,
      themeId: 'warm-japandi',
      timezone: 'Asia/Shanghai',
      locale: 'zh-CN',
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    return c.json({ id, role }, 201);
  },
);

authRoutes.post('/login', rateLimit({ scope: 'login', limit: 10, windowSec: 60 }), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginInputSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'INVALID_INPUT' }, 400);

  const db = drizzle(c.env.DB);
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .get();

  const ipHash = await sha256Hex(c.req.header('cf-connecting-ip') ?? '');

  if (!user || !user.passwordHash) {
    await db.insert(loginAttempts).values({
      id: newId(),
      emailLower: parsed.data.email.toLowerCase(),
      ipHash,
      success: false,
    });
    return c.json({ error: 'INVALID_CREDENTIALS' }, 401);
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  await db.insert(loginAttempts).values({
    id: newId(),
    emailLower: parsed.data.email.toLowerCase(),
    ipHash,
    success: ok,
  });
  if (!ok) return c.json({ error: 'INVALID_CREDENTIALS' }, 401);

  const token = newToken();
  const tokenHash = await sha256Hex(token);
  const sessionId = newId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    tokenHash,
    ipHash,
    createdAt: new Date().toISOString(),
    expiresAt,
  });

  await c.env.KV.put(
    `sess:${tokenHash}`,
    JSON.stringify({ userId: user.id, role: user.role, expiresAt }),
    { expirationTtl: SESSION_TTL_SECONDS },
  );

  return c.json({
    token,
    expiresAt,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      themeId: user.themeId,
      timezone: user.timezone,
      locale: user.locale,
    },
  });
});

authRoutes.post('/logout', async (c) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.json({ ok: true });
  const token = auth.slice(7).trim();
  const tokenHash = await sha256Hex(token);
  await c.env.KV.delete(`sess:${tokenHash}`);
  const db = drizzle(c.env.DB);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  return c.json({ ok: true });
});

authRoutes.get('/me', async (c) => {
  const ctx = requireAuth(c);
  if (ctx instanceof Response) return ctx;
  const db = drizzle(c.env.DB);
  const user = await db.select().from(users).where(eq(users.id, ctx.userId)).get();
  if (!user) return c.json({ error: 'NOT_FOUND' }, 404);
  return c.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    themeId: user.themeId,
    timezone: user.timezone,
    locale: user.locale,
    version: user.version,
  });
});
