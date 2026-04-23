/**
 * Password hashing using PBKDF2-HMAC-SHA256 via Web Crypto API.
 *
 * Why PBKDF2 instead of argon2/scrypt?
 *   Cloudflare Workers enforces a CPU time limit (10ms on free tier).
 *   JS-implemented scrypt at N=2^15 easily bursts past that, returning
 *   503 Service Unavailable without CORS headers (user-facing CORS error).
 *   PBKDF2 via crypto.subtle runs natively and does NOT count against
 *   the JS CPU quota, so we can safely use a high iteration count.
 *
 * 600,000 iterations matches the current OWASP recommendation (2023).
 * Legacy scrypt-hashed passwords are still accepted for backward
 * compatibility; those users will be transparently re-hashed on next login.
 */

import { scrypt } from '@noble/hashes/scrypt';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils';

const ITERATIONS = 600_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

const enc = new TextEncoder();

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password.normalize('NFKC')),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, hash: 'SHA-256', iterations },
    keyMaterial,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await deriveKey(password, salt, ITERATIONS);
  return `pbkdf2-sha256$${ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(hash)}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  // Legacy scrypt path — keeps existing accounts working after the migration.
  if (encoded.startsWith('scrypt$')) {
    return verifyLegacyScrypt(password, encoded);
  }

  const parts = encoded.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const salt = hexToBytes(parts[2]!);
  const expected = hexToBytes(parts[3]!);
  const actual = await deriveKey(password, salt, iterations);
  return timingSafeEqual(actual, expected);
}

/**
 * Returns true if the stored hash uses the legacy scrypt format and should be
 * re-hashed with the current algorithm on next successful login.
 */
export function needsRehash(encoded: string): boolean {
  return encoded.startsWith('scrypt$');
}

function verifyLegacyScrypt(password: string, encoded: string): boolean {
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const salt = hexToBytes(parts[4]!);
  const expected = hexToBytes(parts[5]!);
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
