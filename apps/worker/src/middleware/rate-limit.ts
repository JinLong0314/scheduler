import type { MiddlewareHandler } from 'hono';
import type { Env } from '../env.js';

/**
 * Sliding-window rate limit using KV counters.
 * Keyed by IP (from cf-connecting-ip) + scope.
 */
export function rateLimit(opts: { scope: string; limit: number; windowSec: number }): MiddlewareHandler<{
  Bindings: Env;
}> {
  return async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
    const key = `rl:${opts.scope}:${ip}`;
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / opts.windowSec);
    const kvKey = `${key}:${bucket}`;

    const current = Number((await c.env.KV.get(kvKey)) ?? '0');
    if (current >= opts.limit) {
      return c.json({ error: 'RATE_LIMITED' }, 429);
    }
    // Best-effort increment; races acceptable for rough limiting.
    await c.env.KV.put(kvKey, String(current + 1), { expirationTtl: opts.windowSec + 10 });
    return next();
  };
}
