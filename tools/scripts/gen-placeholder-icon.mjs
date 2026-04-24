// Generate a 1024x1024 solid-color PNG (Kairo brand purple #6366F1)
// using only Node's zlib — no external deps.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZE = 1024;
const R = 0x63,
  G = 0x66,
  B = 0xf1,
  A = 0xff;

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// IHDR: 1024x1024, 8-bit RGBA
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

// IDAT: one scanline per row, filter byte 0 then RGBA
const row = Buffer.alloc(1 + SIZE * 4);
row[0] = 0;
for (let x = 0; x < SIZE; x++) {
  row[1 + x * 4 + 0] = R;
  row[1 + x * 4 + 1] = G;
  row[1 + x * 4 + 2] = B;
  row[1 + x * 4 + 3] = A;
}
const raw = Buffer.concat(Array.from({ length: SIZE }, () => row));
const idat = deflateSync(raw);

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

const __filename = fileURLToPath(import.meta.url);
const here = dirname(__filename);
const out = resolve(here, '..', '..', 'apps', 'desktop', 'src-tauri', 'icons', 'app-icon.png');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes, ${SIZE}x${SIZE})`);
