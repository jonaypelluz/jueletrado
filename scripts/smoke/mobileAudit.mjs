#!/usr/bin/env node
/**
 * Mobile audit of the built site: every game page, in every locale, at phone sizes, before and after Play.
 *
 *   yarn build && yarn smoke:mobile                      # every game, both locales
 *   yarn smoke:mobile --locale en --game wordChain       # filters (game id or route folder)
 *   yarn smoke:mobile --shots /assets/jue-0021 --tag after   # also save portrait screenshots
 *
 * Viewports (touch, dpr 3): portrait 360×740, 375×667, 390×844; timed games also landscape 740×360, 667×375, 844×390.
 * Per page × viewport × screen (start, round) it checks against the emulated width W (never innerWidth, which grows
 * with the overflow): (1) no horizontal page scroll; (2) every visible control (button, a, input, select, textarea,
 * [role=button], wordBuilder tiles, crossword cells) in header, main, footer and the cookie banner lies inside
 * [0, W]; (3) each is at least 44×44, except inline links in running prose and crossword cells (≥24×24); (4) nothing covers it (elementFromPoint at its
 * centre hits it). The cookie banner is audited on the first game of each locale, then declined (no analytics).
 * Prints a PASS/FAIL line per locale × game × viewport × screen. Exits 1 on any FAIL, 2 without a build or Chromium.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { COOKIE_KEY, LOAD_TIMEOUT_S, LOCALES, OUT, ROOT, START_TIMEOUT_S, ROUND_TIMEOUT_S, clickPlay, findChrome, gamePaths, leftStart, loadLevels, serveOut, sleep } from './lib.mjs';

const TIMED = new Set(['spellTower', 'wordsRain', 'wordFinder', 'accentFixer', 'letterMatcher', 'wordChain']);
const PORTRAIT = [
    [360, 740],
    [375, 667],
    [390, 844],
];
const LANDSCAPE = PORTRAIT.map(([w, h]) => [h, w]);
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';

const args = process.argv.slice(2);
const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
};
const locales = (opt('--locale') ?? 'es,en').split(',').filter((l) => LOCALES[l]);
const gameFilter = opt('--game');
const shotsDir = opt('--shots');
const tag = opt('--tag') ?? 'shot';

/** Route folder → game id, from GamesRoutes in config/translations/Games.ts. */
const gameIds = () => {
    const src = readFileSync(path.join(ROOT, 'config/translations/Games.ts'), 'utf8');
    const map = {};
    for (const [, id, folder] of src.matchAll(/(\w+): '\/(?:juegos|en\/games)\/([^']+)'/g)) map[folder] = id;
    return map;
};

/** Runs in the page: the failing controls of the current screen, as "selector(WxH@x)" strings. */
const auditScreen = async (page, W, H, scope) =>
    page.evaluate(
        async (W, H, scope) => {
            const TOL = 0.5;
            const fails = [];
            const describe = (el) => {
                const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '';
                const own = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls;
                let p = el.parentElement;
                while (p && !(typeof p.className === 'string' && p.className.trim())) p = p.parentElement;
                return (p ? '.' + p.className.trim().split(/\s+/)[0] + ' ' : '') + own;
            };
            const fmt = (el, r, why) => `${describe(el)}[${why}](${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.left)})`;
            const scrollWidth = document.scrollingElement.scrollWidth;
            if (scrollWidth > W + TOL) fails.push(`page[scroll](scrollWidth ${scrollWidth} > ${W})`);

            const isBlock = (el) => !getComputedStyle(el).display.startsWith('inline');
            const inProse = (a) => {
                if (getComputedStyle(a).display !== 'inline') return false;
                let block = a.parentElement;
                while (block && !isBlock(block)) block = block.parentElement;
                if (!block) return false;
                const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
                for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                    if (n.textContent.trim() && !n.parentElement.closest('a, button')) return true;
                }
                return false;
            };
            // Native controls plus the games' tappable spans (wordBuilder tiles, crossword hint cells).
            const CONTROLS = 'button, a, input, select, textarea, [role=button], .letter-tile, .crossword-grid-item span';
            const roots = [...document.querySelectorAll(scope)];
            const controls = new Set();
            for (const root of roots) {
                for (const el of root.querySelectorAll(CONTROLS)) {
                    if (el.type === 'hidden' || el.getClientRects().length === 0) continue;
                    if (getComputedStyle(el).visibility === 'hidden') continue;
                    controls.add(el);
                }
            }
            const measured = [];
            for (const el of controls) {
                const r = el.getBoundingClientRect();
                const left = r.left + window.scrollX;
                const right = r.right + window.scrollX;
                const cell = el.matches('.crossword-grid-item input, .crossword-grid-item span');
                const min = cell ? 24 : 44;
                const exempt = !cell && el.tagName === 'A' && inProse(el);
                if (left < -TOL || right > W + TOL) fails.push(fmt(el, r, 'out'));
                else if (!exempt && (r.width < min - TOL || r.height < min - TOL)) fails.push(fmt(el, r, 'small'));
                else measured.push(el);
            }
            // Occlusion: bring each control into view and check its centre is not covered.
            for (const el of measured) {
                if (!el.isConnected) continue;
                el.scrollIntoView({ block: 'center', inline: 'nearest' });
                await new Promise((r) => requestAnimationFrame(() => r()));
                // A wrapped inline link's box spans lines it does not cover: test its first line box.
                const r = el.getClientRects()[0];
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                if (cx < 0 || cx > W || cy < 0 || cy > H) continue;
                const hit = document.elementFromPoint(cx, cy);
                if (hit && hit !== el && !el.contains(hit)) {
                    fails.push(fmt(el, r, `covered by ${describe(hit)}`));
                }
            }
            window.scrollTo(0, 0);
            return fails;
        },
        W,
        H,
        scope,
    );

const waitPlayEnabled = async (page, locale) => {
    for (let i = 0; i < START_TIMEOUT_S * 2; i++) {
        const ready = await page.evaluate(
            (label) => [...document.querySelectorAll('button')].some((x) => x.textContent.trim() === label && !x.disabled),
            LOCALES[locale].play,
        );
        if (ready) return true;
        await sleep(500);
    }
    return false;
};

const shoot = async (page, name) => {
    if (!shotsDir) return;
    await page.screenshot({ path: path.join(shotsDir, name), fullPage: true });
};

const runLocale = async (browserPath, base, locale, ids) => {
    const browser = await puppeteer.launch({
        executablePath: browserPath,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu'],
        userDataDir: mkdtempSync(path.join(tmpdir(), 'jueletrado-mobile-')),
        protocolTimeout: LOAD_TIMEOUT_S * 1000,
    });
    const lines = [];
    const report = (game, [w, h], screen, fails) => {
        const line = `${fails.length ? 'FAIL' : 'PASS'}  ${locale}  ${game}  ${w}x${h}  ${screen}${fails.length ? '  ' + fails.join('  ') : ''}`;
        console.log(line);
        lines.push(!fails.length);
    };
    try {
        const home = await browser.newPage();
        console.log(`${locale}: every level loaded in ${await loadLevels(home, base, locale)} s`);
        await home.close();

        const games = gamePaths(locale)
            .map((route) => ({ route, id: ids[route.split('/').filter(Boolean).pop()] ?? route }))
            .filter(({ route, id }) => !gameFilter || id === gameFilter || route.includes(`/${gameFilter}/`));
        let cookieChecked = false;
        for (const { route, id } of games) {
            const viewports = TIMED.has(id) ? [...PORTRAIT, ...LANDSCAPE] : PORTRAIT;
            const checkCookie = !cookieChecked;
            for (const [w, h] of viewports) {
                const page = await browser.newPage();
                const errors = [];
                page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
                await page.emulate({
                    viewport: { width: w, height: h, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: w > h },
                    userAgent: ANDROID_UA,
                });
                const portrait = h > w;
                if (checkCookie && portrait) {
                    // The banner shows until consent is given: clear it so each portrait size audits the banner.
                    await page.evaluateOnNewDocument((key) => {
                        if (!sessionStorage.getItem('audit-cookie')) {
                            localStorage.removeItem(key);
                            sessionStorage.setItem('audit-cookie', '1');
                        }
                    }, COOKIE_KEY);
                }
                await page.goto(base + route, { waitUntil: 'networkidle2' });
                if (checkCookie && portrait) {
                    const shown = await page.evaluate(() => {
                        const c = document.getElementById('cookieConsent');
                        return !!c && getComputedStyle(c).display !== 'none';
                    });
                    report(id, [w, h], 'cookie', shown ? await auditScreen(page, w, h, '#cookieConsent') : ['#cookieConsent[not shown]']);
                    await page.evaluate(() => document.querySelector('#cookieConsent .decline')?.click());
                    await sleep(300);
                }
                const ready = await waitPlayEnabled(page, locale);
                await sleep(300);
                const startFails = await auditScreen(page, w, h, 'header, main, footer');
                report(id, [w, h], 'start', ready ? startFails : ['Play never enabled', ...startFails]);
                if (portrait) await shoot(page, `${locale}-${id}-${w}-start-${tag}.png`);
                const started = ready && (await clickPlay(page, locale));
                if (ready && !started) report(id, [w, h], 'round', ['round not started (Play enabled but the click did not take)']);
                if (started) {
                    let left = false;
                    for (let i = 0; i < ROUND_TIMEOUT_S * 2 && !left; i++) {
                        await sleep(500);
                        left = await leftStart(page, locale);
                    }
                    await sleep(500);
                    const roundFails = await auditScreen(page, w, h, 'header, main, footer');
                    if (!left) roundFails.unshift('still on its start screen');
                    if (errors.length) roundFails.unshift(`pageerror: ${errors.join(' / ')}`);
                    report(id, [w, h], 'round', roundFails);
                    if (portrait) await shoot(page, `${locale}-${id}-${w}-${tag}.png`);
                }
                await page.close();
            }
            cookieChecked = true;
        }
    } finally {
        await browser.close();
    }
    return lines;
};

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
    if (shotsDir) mkdirSync(shotsDir, { recursive: true });
    const server = await serveOut();
    const base = `http://127.0.0.1:${server.address().port}`;
    const t0 = Date.now();
    const results = [];
    try {
        const ids = gameIds();
        for (const locale of locales) results.push(...(await runLocale(browserPath, base, locale, ids)));
    } finally {
        server.close();
    }
    const failed = results.filter((ok) => !ok).length;
    console.log(`\n${results.length - failed} screens passed, ${failed} failed (${Math.round((Date.now() - t0) / 1000)} s)`);
    process.exit(failed || results.length === 0 ? 1 : 0);
};

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
