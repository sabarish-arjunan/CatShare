import fs from "fs";
import path from "path";
import sharp from "sharp";

const SRC = process.argv[2] || "public/logo-catalogue-share.svg";
const OUT = path.resolve(process.cwd(), "android", "app", "src", "main", "res");

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function generate() {
  console.log("Generating splash screens from:", SRC);
  const srcPath = path.resolve(process.cwd(), SRC);
  const svgBuffer = await fs.promises.readFile(srcPath);

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

    // Calculate logo size (40% of the smaller dimension)
    const logoSize = Math.min(splash.width, splash.height) * 0.4;

    // Create splash with white background and centered logo
    await sharp(svgBuffer)
      .resize(Math.round(logoSize), Math.round(logoSize), {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toBuffer()
      .then(async (logoImg) => {
        await sharp({
          create: {
            width: splash.width,
            height: splash.height,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        })
          .composite([
            {
              input: logoImg,
              left: Math.floor((splash.width - Math.round(logoSize)) / 2),
              top: Math.floor((splash.height - Math.round(logoSize)) / 2)
            }
          ])
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
