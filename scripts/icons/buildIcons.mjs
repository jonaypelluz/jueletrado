#!/usr/bin/env node
/**
 * Renders the app icons into public/ from inline SVG with the machine's Chrome or Chromium (sharp does not run on
 * every platform): a white "J" on the brand's slanted blue band over black.
 *
 *   yarn icons:build
 *
 * icon-192.png / icon-512.png ("any"), icon-maskable-512.png (art inside the central 80 % safe zone, full-bleed
 * background) and apple-touch-icon.png (180, full-bleed, opaque). Exits 2 without a browser.
 */
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { ROOT, findChrome } from '../smoke/lib.mjs';

const MAIN_COLOR = '#3399ff'; // $main-color in styles/variables.scss
const BACKGROUND = '#000000'; // header colour, the manifests' theme_color

/** The icon art on a 100×100 canvas, scaled to `scale` of the canvas around its centre. */
const svg = (scale) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <rect width="100" height="100" fill="${BACKGROUND}"/>
  <g transform="translate(50 50) scale(${scale}) translate(-50 -50)">
    <polygon points="0,30 100,18 100,70 0,82" fill="${MAIN_COLOR}"/>
    <text x="50" y="72" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif"
          font-weight="900" font-size="64" fill="#ffffff">J</text>
  </g>
</svg>`;

const ICONS = [
    { file: 'icon-192.png', size: 192, scale: 1 },
    { file: 'icon-512.png', size: 512, scale: 1 },
    // The band's farthest corner is 59.4 units from the centre: 0.66 keeps it inside the 40-unit safe circle.
    { file: 'icon-maskable-512.png', size: 512, scale: 0.66 },
    { file: 'apple-touch-icon.png', size: 180, scale: 0.9 },
];

const main = async () => {
    const executablePath = findChrome();
    if (!executablePath) {
        console.error('No Chrome or Chromium found: set CHROME_PATH to the browser executable.');
        process.exit(2);
    }
    const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
    try {
        const page = await browser.newPage();
        for (const { file, size, scale } of ICONS) {
            await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
            await page.setContent(`<html><body style="margin:0;background:${BACKGROUND}">${svg(scale)}</body></html>`);
            await page.screenshot({ path: path.join(ROOT, 'public', file), omitBackground: false });
            console.log(`public/${file} ${size}x${size}`);
        }
    } finally {
        await browser.close();
    }
};

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
