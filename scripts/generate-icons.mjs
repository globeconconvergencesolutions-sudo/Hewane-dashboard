/**
 * Generates favicons and PWA icons from public/icon.svg (Hewane logo).
 * Run: pnpm icons:generate
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const SOURCE = path.join(PUBLIC, "icon.svg");

const BRAND_DARK = "#1a1a2e";
const BRAND_LIGHT = "#f8f7f4";

async function renderSquare(size, background, paddingRatio = 0.12) {
  const padding = Math.round(size * paddingRatio);
  const inner = size - padding * 2;

  const logo = await sharp(SOURCE)
    .resize(inner, inner, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function renderOgImage() {
  const width = 1200;
  const height = 630;

  const logo = await sharp(SOURCE)
    .resize(720, 400, { fit: "inside" })
    .png()
    .toBuffer();

  const gradient = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1a1a2e"/>
          <stop offset="55%" stop-color="#2d1b3d"/>
          <stop offset="100%" stop-color="#7D3F7E"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <text x="80" y="560" fill="#E8B825" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" letter-spacing="6">HEWANE SCHOOL OF MUSIC</text>
      <text x="80" y="595" fill="rgba(255,255,255,0.75)" font-family="Arial, Helvetica, sans-serif" font-size="22">Staff Broadcast Dashboard</text>
    </svg>
  `);

  return sharp(gradient)
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function writeIco(png32, png16) {
  // Minimal ICO writer (16 + 32 px)
  const images = [
    { size: 16, data: png16 },
    { size: 32, data: png32 },
  ];

  const headerSize = 6;
  const dirEntrySize = 16;
  const offset = headerSize + dirEntrySize * images.length;

  let dataOffset = offset;
  const parts = [];

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  parts.push(header);

  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 0);
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.data.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    parts.push(entry);
    parts.push(img.data);
    dataOffset += img.data.length;
  }

  await writeFile(path.join(PUBLIC, "favicon.ico"), Buffer.concat(parts));
}

async function main() {
  await mkdir(PUBLIC, { recursive: true });
  await readFile(SOURCE); // ensure source exists

  const [
    iconLight32,
    iconDark32,
    appleIcon,
    icon192,
    icon512,
    favicon16,
    favicon32,
    ogImage,
  ] = await Promise.all([
    renderSquare(32, BRAND_LIGHT),
    renderSquare(32, BRAND_DARK),
    renderSquare(180, BRAND_DARK, 0.1),
    renderSquare(192, BRAND_DARK, 0.1),
    renderSquare(512, BRAND_DARK, 0.1),
    renderSquare(16, BRAND_LIGHT),
    renderSquare(32, BRAND_LIGHT),
    renderOgImage(),
  ]);

  await Promise.all([
    writeFile(path.join(PUBLIC, "icon-light-32x32.png"), iconLight32),
    writeFile(path.join(PUBLIC, "icon-dark-32x32.png"), iconDark32),
    writeFile(path.join(PUBLIC, "apple-icon.png"), appleIcon),
    writeFile(path.join(PUBLIC, "icon-192.png"), icon192),
    writeFile(path.join(PUBLIC, "icon-512.png"), icon512),
    writeFile(path.join(PUBLIC, "og-image.png"), ogImage),
    writeIco(favicon32, favicon16),
  ]);

  console.log("Generated Hewane icons in public/");
}

main().catch((error) => {
  console.error("Icon generation failed:", error);
  process.exit(1);
});
