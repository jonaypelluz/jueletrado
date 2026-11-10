#!/usr/bin/env node
/**
 * Smoke test of the built site: every game, in every locale, starts a round with real words and no JavaScript error.
 *
 *   yarn build && yarn smoke                 # both locales
 *   yarn smoke --locale es                   # one locale
 *   yarn smoke --base http://localhost:3000  # a running dev server instead of ./out
 *
 * Per locale, in a fresh browser profile: the home page's "load levels" button populates every level (the slow first
 * load), then each game page under out/<games route>/ is opened, its Play button clicked, and the round checked:
 * no page error, and the game left its start screen (the Play button is gone, or the game shows its inputs — the
 * crossword keeps Play to make another puzzle). Exits 1 if any game fails.
 *
 * Needs Chrome or Chromium: CHROME_PATH, else PUPPETEER_EXECUTABLE_PATH, else the usual install paths.
 */
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.join(ROOT, 'out');
// The home's load button (homeLoadLevels) and every game's start button (gamePlay), from config/translations/General.ts.
const LOCALES = {
    es: { home: '/', games: 'juegos', load: 'Cargar niveles', play: 'Jugar' },
    en: { home: '/en/', games: 'en/games', load: 'Load levels', play: 'Start' },
};
const LOAD_TIMEOUT_S = 900; // the first full populate of es takes about a minute; slow machines get room
const START_TIMEOUT_S = 60; // until the start button is enabled (the game read its words)
const ROUND_TIMEOUT_S = 20; // after the click, until the game leaves its start screen (some load the full word set first)

const args = process.argv.slice(2);
const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
};
const locales = (opt('--locale') ?? 'es,en').split(',').filter((l) => LOCALES[l]);

const findChrome = () => {
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

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.woff2': 'font/woff2' };

/** Serves ./out like the static host does (a folder serves its index.html). */
const serveOut = () =>
    new Promise((resolve) => {
        const server = createServer((req, res) => {
            let file = path.join(OUT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
            if (!file.startsWith(OUT)) return res.writeHead(403).end();
            if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
            if (!existsSync(file)) return res.writeHead(404).end();
            res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
            res.end(readFileSync(file));
        });
        server.listen(0, '127.0.0.1', () => resolve(server));
    });

const gamePaths = (locale) => {
    const dir = path.join(OUT, LOCALES[locale].games);
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
        .filter((name) => existsSync(path.join(dir, name, 'index.html')))
        .sort()
        .map((name) => `/${LOCALES[locale].games}/${name}/`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const runLocale = async (browserPath, base, locale) => {
    const L = LOCALES[locale];
    const browser = await puppeteer.launch({
        executablePath: browserPath,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu'],
        userDataDir: mkdtempSync(path.join(tmpdir(), 'jueletrado-smoke-')),
        protocolTimeout: LOAD_TIMEOUT_S * 1000,
    });
    const results = [];
    try {
        const home = await browser.newPage();
        await home.goto(base + L.home, { waitUntil: 'networkidle2' });
        const t0 = Date.now();
        const clicked = await home.evaluate((label) => {
            const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === label);
            if (b) b.click();
            return !!b;
        }, L.load);
        if (!clicked) throw new Error(`no "${L.load}" button on ${L.home}`);
        let loaded = false;
        while (!loaded && Date.now() - t0 < LOAD_TIMEOUT_S * 1000) {
            loaded = await home.evaluate((loc) => {
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
        console.log(`${locale}: every level loaded in ${Math.round((Date.now() - t0) / 1000)} s`);
        await home.close();

        for (const game of gamePaths(locale)) {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
            await page.goto(base + game, { waitUntil: 'networkidle2' });
            let started = false;
            for (let i = 0; i < START_TIMEOUT_S * 2 && !started; i++) {
                started = await page.evaluate((label) => {
                    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === label && !x.disabled);
                    if (b) b.click();
                    return !!b;
                }, L.play);
                if (!started) await sleep(500);
            }
            // Left the start screen: the start button is gone, or the game shows its inputs (the crossword keeps it).
            const leftStart = () =>
                page.evaluate((label) => {
                    const main = document.querySelector('main') || document.body;
                    const buttons = [...main.querySelectorAll('button')].map((b) => b.textContent.trim());
                    return !buttons.includes(label) || main.querySelectorAll('input, textarea').length > 0;
                }, L.play);
            let left = false;
            for (let i = 0; started && i < ROUND_TIMEOUT_S * 2 && !left && errors.length === 0; i++) {
                await sleep(500);
                left = await leftStart();
            }
            await sleep(1500); // a page error right after the round starts still counts
            const ok = started && errors.length === 0 && left;
            results.push({ locale, game, ok, why: !started ? 'Play never enabled' : errors.length ? errors.join(' / ') : ok ? '' : 'still on its start screen' });
            await page.close();
        }
    } finally {
        await browser.close();
    }
    return results;
};

const main = async () => {
    const browserPath = findChrome();
    if (!browserPath) {
        console.error('No Chrome or Chromium found: set CHROME_PATH to the browser executable.');
        process.exit(2);
    }
    let base = opt('--base');
    let server = null;
    if (!base) {
        if (!existsSync(path.join(OUT, 'index.html'))) {
            console.error('No ./out build: run `yarn build` first (or pass --base <url>).');
            process.exit(2);
        }
        server = await serveOut();
        base = `http://127.0.0.1:${server.address().port}`;
    }
    const results = [];
    try {
        for (const locale of locales) results.push(...(await runLocale(browserPath, base, locale)));
    } finally {
        server?.close();
    }
    for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.locale}  ${r.game}${r.why ? '  — ' + r.why : ''}`);
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed} games started, ${failed} failed`);
    process.exit(failed || results.length === 0 ? 1 : 0);
};

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
