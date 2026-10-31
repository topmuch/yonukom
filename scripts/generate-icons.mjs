// Generate a complete site icon set from the YonuKom logo mark (public/logo.svg).
// Outputs square PNGs at 16/32/48/180/192/512 + a multi-resolution favicon.ico.
// All icons keep a transparent background (honoring the brand's transparency
// requirement) with the pink #E91E63 mark centered.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = "public/logo.svg";
const OUT = "public";

const SIZES = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 48, name: "favicon-48x48.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 192, name: "android-chrome-192x192.png" },
  { size: 512, name: "android-chrome-512x512.png" },
];

const svgBuf = fs.readFileSync(SRC);

// Render each size to a PNG buffer (transparent background, mark scaled to fit).
async function renderPng(size) {
  return await sharp(svgBuf, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Build a multi-resolution .ico (PNG-in-ICO format, supported by all modern browsers).
function buildIco(pngs) {
  const count = pngs.length;
  const headerSize = 6;
  const dirSize = 16 * count;
  let offset = headerSize + dirSize;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = ICO
  header.writeUInt16LE(count, 4);
  const entries = [];
  for (const p of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(p.size >= 256 ? 0 : p.size, 0); // width (0 = 256)
    e.writeUInt8(p.size >= 256 ? 0 : p.size, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(p.data.length, 8); // image size
    e.writeUInt32LE(offset, 12); // offset to image data
    entries.push(e);
    offset += p.data.length;
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

// Backup originals once (favicon.png & apple-touch-icon.png were wide wordmarks)
for (const f of ["favicon.png", "apple-touch-icon.png"]) {
  const p = path.join(OUT, f);
  const bak = p + ".wide.bak";
  if (fs.existsSync(p) && !fs.existsSync(bak)) fs.copyFileSync(p, bak);
}

const rendered = [];
for (const { size, name } of SIZES) {
  const data = await renderPng(size);
  fs.writeFileSync(path.join(OUT, name), data);
  rendered.push({ size, name, data });
  console.log(`✓ ${name} (${size}x${size}, ${data.length} bytes)`);
}

// Also write a 32x32 favicon.png (legacy fallback for /favicon.png requests)
fs.writeFileSync(path.join(OUT, "favicon.png"), rendered.find((r) => r.size === 32).data);
console.log("✓ favicon.png (32x32 fallback)");

// Build favicon.ico from 16/32/48
const icoPngs = [16, 32, 48].map((s) => {
  const r = rendered.find((x) => x.size === s);
  return { size: s, data: r.data };
});
const ico = buildIco(icoPngs);
fs.writeFileSync(path.join(OUT, "favicon.ico"), ico);
console.log(`✓ favicon.ico (${icoPngs.length} resolutions, ${ico.length} bytes)`);

// Verify transparency of each output
console.log("\n=== verification ===");
for (const { name, size } of SIZES) {
  const { data, info } = await sharp(path.join(OUT, name)).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, ch = info.channels;
  const alpha = (x, y) => data[(y * w + x) * ch + (ch - 1)];
  console.log(name, "corners alpha:", alpha(0, 0), alpha(w - 1, 0), alpha(0, info.height - 1));
}
console.log("\ndone. Icon set generated from logo.svg.");
