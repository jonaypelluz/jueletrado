/**
 * Shared helpers of the browser scripts (smoke, mobile audit, install check, icons): browser finder, static server of
 * ./out, game pages, level loading and the Play button. Importing this module runs nothing.
 */
import { createServer } from 'node:http';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export const OUT = path.join(ROOT, 'out');
// The home's load button (homeLoadLevels) and every game's start button (gamePlay), from config/translations/General.ts.
export const LOCALES = {
    es: { home: '/', games: 'juegos', load: 'Cargar niveles', play: 'Jugar' },
    en: { home: '/en/', games: 'en/games', load: 'Load levels', play: 'Start' },
};
export const COOKIE_KEY = 'jueletrado-analytics'; // LOCAL_STORAGE_KEY in contexts/CookieContext.tsx: consent given
export const LOAD_TIMEOUT_S = 900; // the first full populate of es takes about a minute; slow machines get room
export const START_TIMEOUT_S = 60; // until the start button is enabled (the game read its words)
export const ROUND_TIMEOUT_S = 20; // after the click, until the game leaves its start screen (some load the full word set first)

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const findChrome = () => {
    const env = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
    if (env) return env;
    const known = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ];
    const hit = known.find((p) => existsSync(p));
    if (hit) return hit;
    try {
        return execSync('command -v chromium || command -v google-chrome', { encoding: 'utf8' }).trim();
    } catch {
        return null;
    }
};

export const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.woff2': 'font/woff2' };

/** Serves ./out like the static host does (a folder serves its index.html). */
export const serveOut = () =>
    new Promise((resolve) => {
        const server = createServer((req, res) => {
            let file = path.join(OUT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
            const rel = path.relative(OUT, file);
            if (rel.startsWith('..') || path.isAbsolute(rel)) return res.writeHead(403).end();
            if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
            if (!existsSync(file)) return res.writeHead(404).end();
            res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
            res.end(readFileSync(file));
        });
        server.listen(0, '127.0.0.1', () => resolve(server));
    });

/** Every built game page of a locale, e.g. /juegos/crucigramas/. */
export const gamePaths = (locale) => {
    const dir = path.join(OUT, LOCALES[locale].games);
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
        .filter((name) => existsSync(path.join(dir, name, 'index.html')))
        .sort()
        .map((name) => `/${LOCALES[locale].games}/${name}/`);
};

/**
 * Opens the locale's home on `page` (whose base URL is `base`), clicks "load levels" and waits until every level is
 * in localStorage. Returns the seconds it took; throws when there is no button or it times out.
 */
export const loadLevels = async (page, base, locale) => {
    const L = LOCALES[locale];
    await page.goto(base + L.home, { waitUntil: 'networkidle2' });
    const t0 = Date.now();
    const clicked = await page.evaluate((label) => {
        const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === label);
        if (b) b.click();
        return !!b;
    }, L.load);
    if (!clicked) throw new Error(`no "${L.load}" button on ${L.home}`);
    let loaded = false;
    while (!loaded && Date.now() - t0 < LOAD_TIMEOUT_S * 1000) {
        loaded = await page.evaluate((loc) => {
            try {
                const m = JSON.parse(localStorage.getItem('LEVELS_POPULATED')).value[loc];
                return !!(m && m.beginner && m.intermediate && m.advanced);
            } catch {
                return false;
            }
        }, locale);
        if (!loaded) await sleep(1000);
    }
    if (!loaded) throw new Error(`levels not loaded after ${LOAD_TIMEOUT_S} s`);
    return Math.round((Date.now() - t0) / 1000);
};

/** Clicks the game's start button once it is enabled; false when it never was within START_TIMEOUT_S. */
export const clickPlay = async (page, locale) => {
    for (let i = 0; i < START_TIMEOUT_S * 2; i++) {
        const started = await page.evaluate((label) => {
            const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === label && !x.disabled);
            if (b) b.click();
            return !!b;
        }, LOCALES[locale].play);
        if (started) return true;
        await sleep(500);
    }
    return false;
};

/** Left the start screen: the start button is gone, or the game shows its inputs (the crossword keeps it). */
export const leftStart = (page, locale) =>
    page.evaluate((label) => {
        const main = document.querySelector('main') || document.body;
        const buttons = [...main.querySelectorAll('button')].map((b) => b.textContent.trim());
        return !buttons.includes(label) || main.querySelectorAll('input, textarea').length > 0;
    }, LOCALES[locale].play);
