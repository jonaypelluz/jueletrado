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
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { LOAD_TIMEOUT_S, LOCALES, OUT, ROUND_TIMEOUT_S, clickPlay, findChrome, gamePaths, leftStart, loadLevels, serveOut, sleep } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
};
const locales = (opt('--locale') ?? 'es,en').split(',').filter((l) => LOCALES[l]);

const runLocale = async (browserPath, base, locale) => {
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
        const seconds = await loadLevels(home, base, locale);
        console.log(`${locale}: every level loaded in ${seconds} s`);
        await home.close();

        for (const game of gamePaths(locale)) {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
            await page.goto(base + game, { waitUntil: 'networkidle2' });
            const started = await clickPlay(page, locale);
            let left = false;
            for (let i = 0; started && i < ROUND_TIMEOUT_S * 2 && !left && errors.length === 0; i++) {
                await sleep(500);
                left = await leftStart(page, locale);
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
