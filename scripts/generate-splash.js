import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import sharp from "sharp";

const SRC = process.argv[2] || "public/logo-catalogue-share.svg";
const OUT = path.resolve(process.cwd(), "android", "app", "src", "main", "res");

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

async function createSplashScreen(width, height, logoBuffer, outputPath) {
  // Create white background and place logo in center
  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#ffffff"/>
      <g transform="translate(${width / 2}, ${height / 2})">
        <image href="data:image/svg+xml;base64,${logoBuffer.toString('base64')}" width="200" height="200" x="-100" y="-100"/>
      </g>
    </svg>
  `);

  await sharp(svg).png().toFile(outputPath);
  console.log(`Wrote ${outputPath}`);
}

async function generate() {
  console.log("Generating splash screens from:", SRC);
  const buf = await downloadBuffer(SRC);

  // Portrait splash screens
  const portraitSplashes = [
    { folder: "drawable", name: "splash.png", width: 480, height: 800 },
    { folder: "drawable-port-mdpi", name: "splash.png", width: 320, height: 470 },
    { folder: "drawable-port-hdpi", name: "splash.png", width: 480, height: 800 },
    { folder: "drawable-port-xhdpi", name: "splash.png", width: 720, height: 1280 },
    { folder: "drawable-port-xxhdpi", name: "splash.png", width: 1080, height: 1920 },
    { folder: "drawable-port-xxxhdpi", name: "splash.png", width: 1440, height: 2560 },
  ];

  // Landscape splash screens
  const landscapeSplashes = [
    { folder: "drawable-land-mdpi", name: "splash.png", width: 470, height: 320 },
    { folder: "drawable-land-hdpi", name: "splash.png", width: 800, height: 480 },
    { folder: "drawable-land-xhdpi", name: "splash.png", width: 1280, height: 720 },
    { folder: "drawable-land-xxhdpi", name: "splash.png", width: 1920, height: 1080 },
    { folder: "drawable-land-xxxhdpi", name: "splash.png", width: 2560, height: 1440 },
  ];

  const allSplashes = [...portraitSplashes, ...landscapeSplashes];

  for (const splash of allSplashes) {
    const dir = path.join(OUT, splash.folder);
    await ensureDir(dir);
    const outPath = path.join(dir, splash.name);
    
    // Create a white background with the logo in center
    await sharp(buf)
      .resize(Math.min(200, splash.width * 0.4), Math.min(200, splash.height * 0.4), {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png()
      .toBuffer()
      .then(async (logoImg) => {
        const canvas = await sharp({
          create: {
            width: splash.width,
            height: splash.height,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        })
        .composite([{
          input: logoImg,
          left: Math.floor((splash.width - logoImg.width) / 2),
          top: Math.floor((splash.height - logoImg.width) / 2),
          gravity: 'center'
        }])
        .png()
        .toFile(outPath);
      });

    console.log(`Wrote ${outPath}`);
  }

  console.log("Splash screen generation complete!");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
