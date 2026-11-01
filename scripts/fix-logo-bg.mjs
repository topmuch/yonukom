// Make logo PNG backgrounds truly transparent.
// - logo.png / favicon.png / apple-touch-icon.png: chroma-key near-white → alpha 0 (keeps colored mark).
// - logo-white.png: alpha threshold → isolate opaque-white mark from semi-transparent white bg.
import sharp from "sharp";
import fs from "node:fs";

const FILES = [
  "public/brand/logo.png",
  "public/brand/logo-white.png",
  "public/favicon.png",
  "public/apple-touch-icon.png",
];

// Backup originals once
for (const f of FILES) {
  const bak = f + ".bak";
  if (!fs.existsSync(bak)) fs.copyFileSync(f, bak);
}

async function chromaKeyWhite(input, output) {
  const img = sharp(input);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < data.length; i += ch, o += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const a = ch === 4 ? data[i + 3] : 255;
    // near-white background → fully transparent
    if (r > 235 && g > 235 && b > 235) {
      out[o] = 255; out[o + 1] = 255; out[o + 2] = 255; out[o + 3] = 0;
    } else {
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a;
    }
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(output + ".tmp");
  fs.renameSync(output + ".tmp", output);
  console.log("chroma-key:", input, "->", output);
}

async function thresholdAlphaWhite(input, output) {
  const img = sharp(input);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  if (ch !== 4) throw new Error(input + " needs alpha channel");
  for (let i = 0; i < data.length; i += ch) {
    const a = data[i + 3];
    if (a < 200) {
      // semi-transparent white bg → transparent
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 0;
    } else {
      // opaque white mark → keep opaque white
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(output + ".tmp");
  fs.renameSync(output + ".tmp", output);
  console.log("alpha-threshold:", input, "->", output);
}

await chromaKeyWhite("public/brand/logo.png", "public/brand/logo.png");
await chromaKeyWhite("public/favicon.png", "public/favicon.png");
await chromaKeyWhite("public/apple-touch-icon.png", "public/apple-touch-icon.png");
await thresholdAlphaWhite("public/brand/logo-white.png", "public/brand/logo-white.png");

// Verify results
for (const f of FILES) {
  const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  const corner = (x, y) => { const i = (y * w + x) * ch; return Array.from(data.slice(i, i + ch)); };
  console.log(f, "corners now:", { tl: corner(0, 0), tr: corner(w - 1, 0), bl: corner(0, h - 1) });
}
console.log("done");
