import type { Context, MiddlewareHandler } from 'hono';
import type { Env, Variables } from '../env.js';
import { sha256Hex } from '../lib/crypto.js';

/**
 * Parse Bearer token, look up session in KV.
 * Sets c.var.userId and c.var.userRole when valid.
 * Missing token is allowed — use `requireAuth` to enforce.
 */
export const attachSession: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (
  c,
  next,
) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return next();

  const token = auth.slice('Bearer '.length).trim();
  if (!token) return next();

  const tokenHash = await sha256Hex(token);
  // cacheTtl=60 lets each POP cache the session lookup locally; sessions
  // are effectively immutable for their lifetime so stale reads are safe.
  const raw = await c.env.KV.get(`sess:${tokenHash}`, { type: 'json', cacheTtl: 60 });
  if (!raw) return next();

  const { userId, role, expiresAt } = raw as {
    userId: string;
    role: 'admin' | 'user';
    expiresAt: string;
  };
  if (new Date(expiresAt).getTime() < Date.now()) return next();

  c.set('userId', userId);
  c.set('userRole', role);
  return next();
};

export function requireAuth(
  c: Context<{ Bindings: Env; Variables: Variables }>,
): { userId: string; role: 'admin' | 'user' } | Response {
  const userId = c.get('userId');
  const role = c.get('userRole');
  if (!userId || !role) return c.json({ error: 'UNAUTHORIZED' }, 401);
  return { userId, role };
}

export function requireAdmin(
  c: Context<{ Bindings: Env; Variables: Variables }>,
): { userId: string; role: 'admin' } | Response {
  const res = requireAuth(c);
  if (res instanceof Response) return res;
  if (res.role !== 'admin') return c.json({ error: 'FORBIDDEN' }, 403);
  return { userId: res.userId, role: 'admin' };
}
