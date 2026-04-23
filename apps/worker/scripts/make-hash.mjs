import { scrypt } from '@noble/hashes/scrypt';
import { bytesToHex, randomBytes } from '@noble/hashes/utils';

const pw = process.argv[2] ?? 'Kairo12345';
const salt = randomBytes(16);
const h = scrypt(new TextEncoder().encode(pw.normalize('NFKC')), salt, {
  N: 32768,
  r: 8,
  p: 1,
  dkLen: 32,
});
const encoded = ['scrypt', '32768', '8', '1', bytesToHex(salt), bytesToHex(h)].join('$');
console.log(encoded);
