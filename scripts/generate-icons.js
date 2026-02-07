import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import sharp from "sharp";

const SRC = process.argv[3] || process.argv[2] || "https://cdn.builder.io/api/v1/image/assets%2F26f6b390b6b24d1f855eb0c2e3d0fae9%2Facd1b8640f454da3abea98b8f7347a2f?format=webp&width=1024";
const OUT = path.resolve(process.cwd(), "public", "icons");

async function downloadBuffer(urlOrPath) {
  if (/^https?:\/\//i.test(urlOrPath)) {
    const res = await fetch(urlOrPath);
    if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const p = path.resolve(process.cwd(), urlOrPath);
  return await fs.promises.readFile(p);
}

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function generate() {
  console.log("Downloading source image:", SRC);
  const buf = await downloadBuffer(SRC);

  // Web
  await ensureDir(OUT);
  await sharp(buf).resize(192, 192).png().toFile(path.join(OUT, "icon-192.png"));
  await sharp(buf).resize(512, 512).png().toFile(path.join(OUT, "icon-512.png"));
  // Create a maskable variant (same PNG but flagged for manifest as maskable)
  await sharp(buf).resize(512, 512).png().toFile(path.join(OUT, "icon-512-maskable.png"));

  // Android mipmap densities
  const android = [
    { folder: "mipmap-mdpi", size: 48 },
    { folder: "mipmap-hdpi", size: 72 },
    { folder: "mipmap-xhdpi", size: 96 },
    { folder: "mipmap-xxhdpi", size: 144 },
    { folder: "mipmap-xxxhdpi", size: 192 },
    { folder: "playstore", size: 512 },
  ];

  for (const a of android) {
    const dir = path.join(OUT, "android", a.folder);
    await ensureDir(dir);
    const outPath = path.join(dir, "ic_launcher.png");
    await sharp(buf).resize(a.size, a.size).png().toFile(outPath);
    console.log("Wrote", outPath);
  }

  // iOS sizes (common set)
  const iosSizes = [20, 29, 40, 60, 76, 83.5, 1024];
  for (const s of iosSizes) {
    const size = Math.round(s * 2); // generate @2x PNG for simplicity when fractional
    const dir = path.join(OUT, "ios");
    await ensureDir(dir);
    const outPath = path.join(dir, `AppIcon-${Math.round(s)}@2x.png`);
    await sharp(buf).resize(size, size).png().toFile(outPath);
    console.log("Wrote", outPath);
  }

  console.log("Icon generation complete. Files are in public/icons/");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
