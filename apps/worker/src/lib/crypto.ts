/**
 * Password hashing.
 *
 * NOTE: Cloudflare Workers cannot run native argon2id in the main isolate.
 * We use scrypt (from @noble/hashes), which is memory-hard and acceptable.
 * Spec requires argon2id; swap to a WASM argon2 package in a future iteration.
 */

import { scrypt } from '@noble/hashes/scrypt';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils';

const N = 2 ** 15; // CPU/memory cost
const r = 8;
const p = 1;
const dkLen = 32;

const enc = new TextEncoder();

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = scrypt(enc.encode(password.normalize('NFKC')), salt, { N, r, p, dkLen });
  return `scrypt$${N}$${r}$${p}$${bytesToHex(salt)}$${bytesToHex(hash)}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const saltHex = parts[4]!;
  const hashHex = parts[5]!;
  const salt = hexToBytes(saltHex);
  const expected = hexToBytes(hashHex);
  const actual = scrypt(enc.encode(password.normalize('NFKC')), salt, {
    N: Number(parts[1]),
    r: Number(parts[2]),
    p: Number(parts[3]),
    dkLen: expected.length,
  });
  return timingSafeEqual(actual, expected);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/** Generate a cryptographically-random session token (32 bytes, base64url). */
export function newToken(): string {
  const bytes = randomBytes(32);
  return base64url(bytes);
}

/** SHA-256 hex digest. Used to index tokens in DB without storing plaintext. */
export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return bytesToHex(new Uint8Array(buf));
}

function base64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
