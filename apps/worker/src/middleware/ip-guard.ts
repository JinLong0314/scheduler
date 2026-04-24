import type { MiddlewareHandler } from 'hono';
import type { Env } from '../env.js';

/**
 * IP/country allow-block lists from admin config.
 * Fails closed on config fetch errors.
 */
export const ipCountryGuard: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  // cacheTtl lets each Cloudflare POP serve this from local cache for 60s,
  // avoiding a central KV roundtrip on every request.
  const raw = await c.env.KV.get('admin:config', { type: 'json', cacheTtl: 60 });
  if (!raw) return next();
  const cfg = raw as {
    ipAllowlist?: string[];
    ipBlocklist?: string[];
    countryAllowlist?: string[];
    countryBlocklist?: string[];
  };

  const ip = c.req.header('cf-connecting-ip') ?? '';
  const country =
    (c.req.raw as Request & { cf?: { country?: string } }).cf?.country ??
    c.req.header('cf-ipcountry') ??
    '';

  if (cfg.ipBlocklist?.some((cidr) => ipMatches(ip, cidr))) {
    return c.json({ error: 'FORBIDDEN' }, 403);
  }
  if (cfg.ipAllowlist?.length && !cfg.ipAllowlist.some((cidr) => ipMatches(ip, cidr))) {
    return c.json({ error: 'FORBIDDEN' }, 403);
  }
  if (country && cfg.countryBlocklist?.includes(country)) {
    return c.json({ error: 'FORBIDDEN' }, 403);
  }
  if (country && cfg.countryAllowlist?.length && !cfg.countryAllowlist.includes(country)) {
    return c.json({ error: 'FORBIDDEN' }, 403);
  }
  return next();
};

/** Minimal IP match supporting exact IPv4 and `/CIDR` for v4 only. v6 falls back to exact. */
function ipMatches(ip: string, pattern: string): boolean {
  if (!ip || !pattern) return false;
  if (!pattern.includes('/')) return ip === pattern;
  const [base, bitsStr] = pattern.split('/');
  const bits = Number(bitsStr);
  if (!base || Number.isNaN(bits) || !ip.includes('.') || !base.includes('.')) return false;
  const a = ipv4ToInt(ip);
  const b = ipv4ToInt(base);
  if (a === null || b === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (a & mask) === (b & mask);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const x = Number(p);
    if (!Number.isInteger(x) || x < 0 || x > 255) return null;
    n = (n << 8) | x;
  }
  return n >>> 0;
}
