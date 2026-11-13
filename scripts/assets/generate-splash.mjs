/* ============================================
   Genera le splash screen iOS (apple-touch-startup-image)
   per evitare il flash bianco all'avvio della PWA.
   Target principale: iPhone 14 / 13 / 12 (390×844 @3x → 1170×2532).
   Run: node scripts/assets/generate-splash.mjs
   ============================================ */

import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const outDir = join(root, 'public', 'splash');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// [css width, css height, dpr]
const DEVICES = [
  [390, 844, 3], // iPhone 12 / 13 / 14 / 16e
  [393, 852, 3], // iPhone 14 Pro / 15 / 16
  [430, 932, 3], // iPhone 14 Plus / 15 Plus / Pro Max
  [375, 812, 3], // iPhone X / XS / 11 Pro / 12 mini / 13 mini
];

const logoSvg = readFileSync(join(root, 'src/shared/assets/brand/workout-lab-logo.svg'), 'utf8');
const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

for (const [w, h, dpr] of DEVICES) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
  await page.setContent(`<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;background:#0A0A0C;display:flex;align-items:center;justify-content:center">
    <img src="${logoDataUrl}" style="width:172px;height:auto" />
  </body></html>`);
  const file = join(outDir, `splash-${w * dpr}x${h * dpr}.png`);
  await page.screenshot({ path: file, type: 'png' });
  console.log('✓', file);
}

await browser.close();
