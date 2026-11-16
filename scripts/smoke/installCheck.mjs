#!/usr/bin/env node
/**
 * Install check of the built site (the app can be added to a phone's home screen):
 *
 *   yarn build && yarn smoke:install
 *
 * 1. Every es page in out/ links /site.webmanifest and every en page /site-en.webmanifest.
 * 2. Chrome finds no installability error (CDP Page.getInstallabilityErrors) on / and /en/.
 * 3. The footer's install button: Android + a synthetic beforeinstallprompt → tapping it calls prompt() and it hides;
 *    iPhone → tapping it shows the Add to Home Screen steps; installed app (display-mode standalone, emulated through
 *    matchMedia) → no button.
 * 4. In the installed app, one spellTower round plays to its end (its 30 s timer) and the header logo goes home.
 * Prints a PASS/FAIL line per check. Exits 1 on any FAIL, 2 without a build or Chromium.
 */
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { parse } from 'node-html-parser';
import { COOKIE_KEY, LOAD_TIMEOUT_S, LOCALES, OUT, clickPlay, findChrome, gamePaths, loadLevels, serveOut, sleep } from './lib.mjs';

const MANIFEST = { es: '/site.webmanifest', en: '/site-en.webmanifest' };
const ROUND_GAME = { es: '/juegos/la-torre-de-la-ortografia/', en: '/en/games/spell-tower/' };
const ROUND_END_S = 60; // spellTower's round is 30 s
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const PHONE = { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

const results = [];
const check = (name, ok, why = '') => {
    results.push(ok);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && why ? '  — ' + why : ''}`);
};

/** The index.html of every built page of a locale: its home and its game pages. */
const localePages = (locale) => [path.join(OUT, LOCALES[locale].home, 'index.html'), ...gamePaths(locale).map((p) => path.join(OUT, p, 'index.html'))];

const checkManifestLinks = () => {
    for (const locale of ['es', 'en']) {
        const files = localePages(locale).filter((f) => existsSync(f));
        const wrong = files.filter((f) => parse(readFileSync(f, 'utf8')).querySelector('link[rel=manifest]')?.getAttribute('href') !== MANIFEST[locale]);
        check(`${locale}: ${files.length} pages link ${MANIFEST[locale]}`, files.length > 0 && wrong.length === 0, wrong.map((f) => path.relative(OUT, f)).join(', '));
    }
};

const checkInstallable = async (browser, base) => {
    for (const locale of ['es', 'en']) {
        const page = await browser.newPage();
        const client = await page.createCDPSession();
        await page.goto(base + LOCALES[locale].home, { waitUntil: 'networkidle2' });
        // Decline cookies once for the profile, so the banner does not cover the footer's button (no analytics).
        await page.evaluate((key) => localStorage.setItem(key, 'rejected'), COOKIE_KEY);
        let errors = null;
        for (let i = 0; i < 20; i++) {
            const { installabilityErrors } = await client.send('Page.getInstallabilityErrors');
            errors = installabilityErrors;
            if (errors.length === 0) break;
            await sleep(500);
        }
        check(`${locale}: installable (no installability errors on ${LOCALES[locale].home})`, errors.length === 0, errors.map((e) => e.errorId).join(', '));
        await page.close();
    }
};

/**
 * Installed-app emulation: Chromium 142 has no display-mode media emulation (CDP Emulation.setEmulatedMedia ignores
 * it, emulateMediaFeatures rejects it) and no CDP PWA domain, so the page's matchMedia reports standalone instead.
 */
const standalone = (page) =>
    page.evaluateOnNewDocument(() => {
        const matchMedia = window.matchMedia.bind(window);
        window.matchMedia = (query) => matchMedia(query.replace(/\s/g, '') === '(display-mode:standalone)' ? 'all' : query);
    });

/** Headless Chrome fires a real beforeinstallprompt for an installable site: drop it (iOS never fires one). */
const noRealPrompt = (page) =>
    page.evaluateOnNewDocument(() => {
        window.addEventListener('beforeinstallprompt', (e) => e.isTrusted && e.stopImmediatePropagation(), true);
    });

/** Dispatches a beforeinstallprompt whose prompt() counts its calls in window.__prompted. */
const firePrompt = (page) =>
    page.evaluate(() => {
        window.__prompted = 0;
        const event = new Event('beforeinstallprompt', { cancelable: true });
        event.prompt = () => {
            window.__prompted += 1;
            return Promise.resolve();
        };
        event.userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(event);
    });

const hasButton = (page) => page.evaluate(() => !!document.querySelector('.install-app'));

const checkButton = async (browser, base) => {
    const android = await browser.newPage();
    await android.emulate({ viewport: PHONE, userAgent: ANDROID_UA });
    await noRealPrompt(android); // only the synthetic event below drives the button
    await android.goto(base + '/', { waitUntil: 'networkidle2' });
    await firePrompt(android);
    await android.waitForSelector('.install-app', { timeout: 5000 }).catch(() => null);
    const shown = await hasButton(android);
    if (shown) await android.tap('.install-app');
    await sleep(500);
    const prompted = await android.evaluate(() => window.__prompted);
    check('android: beforeinstallprompt shows the button, tap calls prompt() once and hides it', shown && prompted === 1 && !(await hasButton(android)), `shown ${shown}, prompt() calls ${prompted}`);
    await android.close();

    const iphone = await browser.newPage();
    await iphone.emulate({ viewport: PHONE, userAgent: IPHONE_UA });
    await noRealPrompt(iphone);
    await iphone.goto(base + '/en/', { waitUntil: 'networkidle2' });
    await iphone.waitForSelector('.install-app', { timeout: 5000 }).catch(() => null);
    const iosShown = await hasButton(iphone);
    if (iosShown) await iphone.tap('.install-app');
    await sleep(300);
    const steps = await iphone.evaluate(() => {
        const p = document.querySelector('.install-app-steps');
        return !!p && p.getClientRects().length > 0 && document.querySelector('.install-app').getAttribute('aria-expanded') === 'true';
    });
    check('iphone: the button shows the Add to Home Screen steps', iosShown && steps, `shown ${iosShown}, steps ${steps}`);
    await iphone.close();

    const app = await browser.newPage();
    await app.emulate({ viewport: PHONE, userAgent: ANDROID_UA });
    await standalone(app);
    await app.goto(base + '/', { waitUntil: 'networkidle2' });
    const reportsStandalone = await app.evaluate(() => matchMedia('(display-mode: standalone)').matches);
    await firePrompt(app);
    await sleep(500);
    check('installed app: no install button, even after beforeinstallprompt', reportsStandalone && !(await hasButton(app)), `display-mode standalone ${reportsStandalone}`);
    await app.close();
};

const checkStandaloneRound = async (browserPath, base) => {
    for (const locale of ['en', 'es']) {
        // A fresh profile per locale: the load-levels button only shows before any level is loaded.
        const browser = await launch(browserPath);
        try {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
            await page.emulate({ viewport: PHONE, userAgent: ANDROID_UA });
            await standalone(page);
            await loadLevels(page, base, locale);
            await page.goto(base + ROUND_GAME[locale], { waitUntil: 'networkidle2' });
            const started = await clickPlay(page, locale);
            // spellTower's round: its answer buttons and timer show; it ends when its 30 s timer runs out, the
            // answer buttons go and the start button comes back.
            const roundState = () =>
                page.evaluate((label) => ({
                    running: !!document.querySelector('main .variation-btn') && !!document.querySelector('.game-timer'),
                    over:
                        !document.querySelector('main .variation-btn') &&
                        [...document.querySelectorAll('main button')].some((b) => b.textContent.trim() === label && !b.disabled),
                }), LOCALES[locale].play);
            let left = false;
            for (let i = 0; started && i < 40 && !left; i++) {
                await sleep(500);
                left = (await roundState()).running;
            }
            let ended = false;
            for (let i = 0; left && i < ROUND_END_S * 2 && !ended; i++) {
                await sleep(500);
                ended = (await roundState()).over;
            }
            const logo = await page.$('header .logo');
            const logoVisible = !!logo && (await logo.isVisible());
            if (logoVisible) {
                await logo.tap();
                await page.waitForFunction((home) => location.pathname === home, { timeout: 10000 }, LOCALES[locale].home).catch(() => null);
            }
            const home = await page.evaluate(() => location.pathname);
            check(
                `${locale}: installed app plays a spellTower round to its end and the logo goes home`,
                started && left && ended && logoVisible && home === LOCALES[locale].home && errors.length === 0,
                `started ${started}, round ${left}, ended ${ended}, ${logoVisible ? 'logo → ' + home : 'no visible header logo'}${errors.length ? ', ' + errors.join(' / ') : ''}`,
            );
        } catch (e) {
            check(`${locale}: installed app plays a spellTower round to its end and the logo goes home`, false, e.message.slice(0, 160));
        } finally {
            await browser.close();
        }
    }
};

const launch = (browserPath) =>
    puppeteer.launch({
        executablePath: browserPath,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu'],
        userDataDir: mkdtempSync(path.join(tmpdir(), 'jueletrado-install-')),
        protocolTimeout: LOAD_TIMEOUT_S * 1000,
    });

const main = async () => {
    const browserPath = findChrome();
    if (!browserPath) {
        console.error('No Chrome or Chromium found: set CHROME_PATH to the browser executable.');
        process.exit(2);
    }
    if (!existsSync(path.join(OUT, 'index.html'))) {
        console.error('No ./out build: run `yarn build` first.');
        process.exit(2);
    }
    checkManifestLinks();
    const server = await serveOut();
    const base = `http://127.0.0.1:${server.address().port}`;
    const browser = await launch(browserPath);
    try {
        await checkInstallable(browser, base);
        await checkButton(browser, base);
    } finally {
        await browser.close();
    }
    try {
        await checkStandaloneRound(browserPath, base);
    } finally {
        server.close();
    }
    const failed = results.filter((ok) => !ok).length;
    console.log(`\n${results.length - failed} checks passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
};

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
