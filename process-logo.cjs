// One-off script: processes the supplied school logo into site assets.
// - samples the official maroon/black swatches
// - crops the emblem (book + MS + swoosh) for header/footer use
// - generates a square favicon from the emblem
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC = "C:/Users/Jane Pila/Downloads/images (11).jpg";
const OUT_DIR = path.join(__dirname, "public", "images");
const APP_DIR = path.join(__dirname, "src", "app");

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const meta = await sharp(SRC).metadata();
  console.log("source:", meta.width, "x", meta.height, meta.format);

  // 1. Sample swatch colours (top-left strip: maroon box then black box).
  const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    const idx = (Math.round(y) * info.width + Math.round(x)) * info.channels;
    return [data[idx], data[idx + 1], data[idx + 2]];
  };
  const hex = (rgb) => "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");
  // Swatches sit near the top-left; scan a row for the two darkest saturated blocks.
  const ySw = Math.round(info.height * 0.09);
  let maroon = null;
  let black = null;
  for (let x = 5; x < info.width * 0.5; x += 2) {
    const [r, g, b] = px(x, ySw);
    const isWhite = r > 235 && g > 235 && b > 235;
    if (isWhite) continue;
    if (r > 90 && r < 190 && g < 80 && b < 90 && !maroon) maroon = [r, g, b];
    if (r < 80 && g < 80 && b < 80 && maroon && !black) black = [r, g, b];
  }
  console.log("maroon swatch:", maroon ? hex(maroon) : "not found");
  console.log("black swatch:", black ? hex(black) : "not found");

  // 2. Full logo copy.
  fs.copyFileSync(SRC, path.join(OUT_DIR, "mainflow-logo.jpg"));
  console.log("saved full logo");

  // 3. Emblem crop: everything between the swatch strip and the tagline line.
  const top = Math.round(info.height * 0.2);
  const height = Math.round(info.height * 0.45);
  const emblem = await sharp(SRC)
    .extract({ left: 0, top, width: info.width, height })
    .trim({ threshold: 12 })
    .resize({ width: 640, withoutEnlargement: true })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, "mainflow-logo-mark.png"), emblem);
  const markMeta = await sharp(emblem).metadata();
  console.log("saved emblem mark:", markMeta.width, "x", markMeta.height);

  // 4. Favicon: emblem on a white square with padding.
  const iconSize = 512;
  const inner = await sharp(emblem)
    .resize({ width: iconSize - 96, height: iconSize - 96, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();
  const innerMeta = await sharp(inner).metadata();
  await sharp({
    create: { width: iconSize, height: iconSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: inner, left: Math.round((iconSize - innerMeta.width) / 2), top: Math.round((iconSize - innerMeta.height) / 2) }])
    .png()
    .toFile(path.join(APP_DIR, "icon.png"));
  console.log("saved src/app/icon.png");
})();
