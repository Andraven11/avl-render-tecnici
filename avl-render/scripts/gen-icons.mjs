#!/usr/bin/env node
/**
 * Genera icone Tauri (32x32, 128x128, 128x128@2x, icon.ico, icon.icns)
 * Uso: node scripts/gen-icons.mjs
 * Richiede: npm install sharp png-to-ico png2icons --save-dev
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcIcon = join(root, 'src-tauri', 'icon-source.png');
const fallbackSrc = join(process.env.USERPROFILE || process.env.HOME || '', '.cursor', 'projects', 'c-Users-andre-Desktop-render-tecnici', 'assets', 'icon-source.png');
const outDir = join(root, 'src-tauri', 'icons');

async function main() {
  const appIcon = join(root, 'app-icon.png');
  let source = srcIcon;
  if (!existsSync(source)) {
    if (existsSync(appIcon)) {
      copyFileSync(appIcon, srcIcon);
      source = srcIcon;
    } else if (existsSync(fallbackSrc)) {
      mkdirSync(dirname(srcIcon), { recursive: true });
      copyFileSync(fallbackSrc, srcIcon);
      source = srcIcon;
    } else {
      console.error('Crea src-tauri/icon-source.png o app-icon.png (512x512 PNG)');
      process.exit(1);
    }
  }

  mkdirSync(outDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const img = sharp(readFileSync(source));

  // PNG
  for (const [size, name] of [[32, '32x32.png'], [128, '128x128.png'], [256, '128x128@2x.png']]) {
    const buf = await img.clone().resize(size, size).png().toBuffer();
    writeFileSync(join(outDir, name), buf);
    console.log('OK:', name);
  }

  // ICO con png-to-ico (array di Buffer)
  const pngToIco = (await import('png-to-ico')).default;
  const sizes = [16, 24, 32, 48, 64, 256];
  const pngs = await Promise.all(
    sizes.map((s) => img.clone().resize(s, s).png().toBuffer())
  );
  const ico = await pngToIco(pngs);
  writeFileSync(join(outDir, 'icon.ico'), ico);
  // ICNS: png2icons (opzionale su Windows)
  try {
    const png2icons = (await import('png2icons')).default;
    const png512 = await img.clone().resize(512, 512).png().toBuffer();
    const icns = png2icons.createICNS(png512, png2icons.BILINEAR, 0);
    if (icns) writeFileSync(join(outDir, 'icon.icns'), Buffer.from(icns));
  } catch (e) {
    console.warn('icon.icns saltato:', e.message);
  }
  console.log('OK: icon.ico');
  console.log('Icone in src-tauri/icons/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
