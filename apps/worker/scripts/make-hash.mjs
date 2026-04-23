/**
 * Usage: node scripts/make-hash.mjs <password>
 * Generates a PBKDF2-SHA256 hash (600k iter) via Node's native crypto.subtle.
 * Prints the hash + ready-to-run wrangler d1 execute commands.
 */
import crypto from 'node:crypto';

const pw = process.argv[2];
if (!pw) {
  console.error('Usage: node scripts/make-hash.mjs <your-password>');
  process.exit(1);
}

const ITERATIONS = 600_000;
const salt = crypto.randomBytes(16);
const hex = (b) => Buffer.from(b).toString('hex');
const enc = new TextEncoder();
const km = await crypto.subtle.importKey(
  'raw',
  enc.encode(pw.normalize('NFKC')),
  { name: 'PBKDF2' },
  false,
  ['deriveBits'],
);
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, hash: 'SHA-256', iterations: ITERATIONS },
  km,
  256,
);
const encoded = `pbkdf2-sha256$${ITERATIONS}$${hex(salt)}$${hex(new Uint8Array(bits))}`;

console.log('\n[ Hash ]');
console.log(encoded);
console.log('\n[ Wrangler command — replace EMAIL with yours ]');
console.log(
  `npx wrangler d1 execute kairo_db --remote --command "UPDATE users SET password_hash = '${encoded}' WHERE email = 'YOUR_EMAIL@example.com';"`,
);
