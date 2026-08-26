import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'assets', 'images');
mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(w, h, rgba) {
  const rows = [];
  for (let y = 0; y < h; y += 1) {
    rows.push(Buffer.from([0]));
    rows.push(rgba.subarray(y * w * 4, (y + 1) * w * 4));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function paint(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const bg = [11, 13, 18];
  const card = [19, 23, 34];
  const emerald = [16, 185, 129];
  const violet = [139, 92, 246];
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const rMark = size * 0.28;
  const rInner = size * 0.12;
  const rCard = size * 0.38;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ang = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2);
      let col = bg;
      if (dist < rCard) col = card;
      const ring = Math.abs(dist - rMark);
      if (ring < size * 0.045) col = mix(emerald, violet, ang);
      if (dist < rInner) col = mix(emerald, [59, 130, 246], 0.45);
      const i = (y * size + x) * 4;
      rgba[i] = col[0];
      rgba[i + 1] = col[1];
      rgba[i + 2] = col[2];
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

function paintTinted(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const rMark = size * 0.28;
  const rInner = size * 0.12;
  const ringW = size * 0.05;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let v = 0;
      if (Math.abs(dist - rMark) < ringW) v = 255;
      if (dist < rInner) v = 255;
      const i = (y * size + x) * 4;
      rgba[i] = v;
      rgba[i + 1] = v;
      rgba[i + 2] = v;
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

function write(name, size, painter = paint) {
  writeFileSync(join(outDir, name), encodePng(size, size, painter(size)));
}

write('icon.png', 1024);
write('splash-icon.png', 512);
write('favicon.png', 48);
write('android-icon-foreground.png', 432);
write('android-icon-background.png', 432);
write('android-icon-monochrome.png', 432);
write('ios-tinted.png', 1024, paintTinted);
console.log('icons written');
