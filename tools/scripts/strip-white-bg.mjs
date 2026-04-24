// Remove the white background from apps/desktop/src-tauri/icons/app-icon.png.
// The logo is a rounded-square tile on a white canvas; we want the outer
// white pixels transparent while keeping the tile intact.
//
// Strategy: flood-fill from the four corners. Any pixel reachable from a
// corner whose RGB is "near white" (>= 240/255 per channel) is considered
// background and set to fully transparent. This preserves any white pixels
// *inside* the tile (e.g. the clock face dial marks).

import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const target = process.argv[2];
if (!target) {
  console.error('Usage: node strip-white-bg.mjs <file.png>');
  process.exit(1);
}

const png = PNG.sync.read(readFileSync(target));
const { width, height, data } = png;

const NEAR_WHITE = 240;
const idx = (x, y) => (y * width + x) * 4;
const isBg = (x, y) => {
  const i = idx(x, y);
  if (data[i + 3] === 0) return false; // already transparent, skip
  return data[i] >= NEAR_WHITE && data[i + 1] >= NEAR_WHITE && data[i + 2] >= NEAR_WHITE;
};

const visited = new Uint8Array(width * height);
const stack = [];
const seed = (x, y) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const key = y * width + x;
  if (visited[key]) return;
  if (!isBg(x, y)) return;
  visited[key] = 1;
  stack.push(x, y);
};

seed(0, 0);
seed(width - 1, 0);
seed(0, height - 1);
seed(width - 1, height - 1);

while (stack.length) {
  const y = stack.pop();
  const x = stack.pop();
  const i = idx(x, y);
  data[i + 3] = 0; // make transparent
  seed(x + 1, y);
  seed(x - 1, y);
  seed(x, y + 1);
  seed(x, y - 1);
}

writeFileSync(target, PNG.sync.write(png));
const transparentCount = (() => {
  let n = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] === 0) n++;
  return n;
})();
console.log(
  `wrote ${target}: ${width}x${height}, ${transparentCount} transparent pixels (${(
    (transparentCount / (width * height)) *
    100
  ).toFixed(1)}%)`,
);
