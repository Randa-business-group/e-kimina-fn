// Generates the PWA icons (msfts §9) without any image library: a deep-green tile with a
// white coin and three stacked bars ("savings growing"). Run: node scripts/generate-icons.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const GREEN = [0x00, 0x58, 0x40];
const WHITE = [0xff, 0xff, 0xff];
const LIGHT = [0x08, 0xbc, 0x8c];

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5);
      const i = y * (size * 4 + 1) + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** 4×4 supersampled coverage → smooth edges. */
function shade(size, maskable) {
  const s = size;
  const radius = maskable ? 0 : s * 0.22; // rounded tile unless maskable (full bleed)
  const scale = maskable ? 0.72 : 1; // keep the symbol inside the maskable safe zone
  const cx = s / 2;
  const cy = s / 2;
  const inTile = (x, y) => {
    if (radius === 0) return true;
    const dx = Math.max(radius - x, 0, x - (s - radius));
    const dy = Math.max(radius - y, 0, y - (s - radius));
    return dx * dx + dy * dy <= radius * radius;
  };
  const layer = (x, y) => {
    if (!inTile(x, y)) return null;
    const u = (x - cx) / (s * scale) + 0.5;
    const v = (y - cy) / (s * scale) + 0.5;
    // coin (ring + disc), upper right
    const d = Math.hypot(u - 0.69, v - 0.29);
    if (d < 0.135 && d > 0.095) return WHITE;
    if (d <= 0.095) return LIGHT;
    // three rising bars, lower left
    const bars = [
      [0.2, 0.3, 0.64],
      [0.36, 0.46, 0.56],
      [0.52, 0.62, 0.48],
    ];
    for (const [x0, x1, top] of bars) if (u >= x0 && u <= x1 && v >= top && v <= 0.8) return WHITE;
    return GREEN;
  };
  return (x, y) => {
    let r = 0, g = 0, b = 0, a = 0;
    const N = 4;
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const c = layer(x - 0.5 + (i + 0.5) / N, y - 0.5 + (j + 0.5) / N);
        if (c) {
          r += c[0];
          g += c[1];
          b += c[2];
          a += 255;
        }
      }
    const n = N * N;
    const cover = a / n;
    return cover === 0 ? [0, 0, 0, 0] : [Math.round((r / n) * (255 / cover)), Math.round((g / n) * (255 / cover)), Math.round((b / n) * (255 / cover)), Math.round(cover)];
  };
}

mkdirSync("public/icons", { recursive: true });
const out = [
  ["public/icons/icon-192.png", 192, false],
  ["public/icons/icon-512.png", 512, false],
  ["public/icons/maskable-512.png", 512, true],
  ["public/icons/apple-touch-icon.png", 180, true],
];
for (const [file, size, maskable] of out) {
  writeFileSync(file, png(size, shade(size, maskable)));
  console.log("wrote", file);
}
