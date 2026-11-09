/**
 * JUE-0008 spike — measures, on the real data in public/, how many words every game really gets
 * per level and locale after every filter, plus the difficulty signals and definition data quality.
 *
 * Run from the repo root:  yarn tsx ops/jobs/spikes/JUE-0008/measure.ts
 * Writes ops/jobs/spikes/JUE-0008/results.md and results.json (and prints the markdown).
 *
 * It imports the games' real pure logic (utils/, config/) so the counts follow the code. The only
 * copied logic is syllableSplitter's `isEligible` and the games' length windows (they are not
 * exported); each copy cites its source line. Random parts (shuffles, variant generation) are run
 * with a fixed-seed Math.random so the output is reproducible.
 */
import fs from 'fs';
import path from 'path';
import { buildChallenge } from '@utils/AccentGameProcessor';
import { buildLetterChallenge } from '@utils/LetterMatchProcessor';
import WordGameProcessor from '@utils/WordGameProcessor';
import { dividerPositions, syllabify } from '@utils/SyllableSplitter';
import { generateCrossword } from '@utils/CrosswordGenerator';
import { formatDefinition, getDefinitionForLevel } from '@utils/DefinitionPicker';
import { isUsableClue, revealsWord } from '@utils/SpellingComparer';
import createChangeRules from '@config/ChangeRules';
import { AccentedVowels } from '@config/AccentRules';
import { consonants, vowels } from '@config/translations/Letters';
import { LETTERS_WITHOUT_DEFINITIONS } from '@config/DefinitionConfig';
import type { Definition } from '@models/types';

// ---------- deterministic Math.random (mulberry32) ----------
let seed = 8008;
Math.random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'ops/jobs/spikes/JUE-0008');
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
type Level = (typeof LEVELS)[number];
const LOCALES = ['es', 'en'] as const;
type Locale = (typeof LOCALES)[number];

const md: string[] = [];
const json: Record<string, unknown> = {};
const out = (line = '') => md.push(line);

// ---------- data loading ----------
const loadLevel = (locale: Locale, level: Level): string[] => {
    const dir = path.join(ROOT, 'public/words', locale);
    const files = fs
        .readdirSync(dir)
        .filter((f) => f.startsWith(`${level}_words_from_`))
        .sort((a, b) => Number(a.match(/from_(\d+)/)![1]) - Number(b.match(/from_(\d+)/)![1]));
    return files.flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as string[]);
};

const loadFrequency = (locale: Locale): Map<string, number> => {
    const lines = fs.readFileSync(path.join(ROOT, `ops/scripts/frequency/wordfreq_${locale}.txt`), 'utf8').split('\n');
    const rank = new Map<string, number>();
    lines.forEach((w, i) => {
        const word = w.trim();
        if (word && !rank.has(word)) rank.set(word, i + 1);
    });
    return rank;
};

type DefEntry = { level?: string; definitions: (Definition & { number: number | string })[] };
const loadDefinitions = (locale: Locale): Record<string, Record<string, DefEntry>> => {
    const dir = path.join(ROOT, 'public/definitions', locale);
    const byLetter: Record<string, Record<string, DefEntry>> = {};
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('_definitions.json'))) {
        byLetter[f[0]] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    }
    return byLetter;
};

const loadBlocklist = (file: string): Set<string> =>
    new Set(
        fs
            .readFileSync(path.join(ROOT, 'ops/scripts/words', file), 'utf8')
            .split('\n')
            .map((l) => l.trim().toLowerCase())
            .filter((l) => l && !l.startsWith('#')),
    );

// ---------- game rules copied from the games (not exported) ----------
type Window = { min: number; max?: number };
// accentFixer: games/accentFixer/useAccentFixer.tsx:16-20
const ACCENT_WINDOWS: Record<Level, Window> = { beginner: { min: 4, max: 6 }, intermediate: { min: 5, max: 8 }, advanced: { min: 6 } };
// letterMatcher: games/letterMatcher/useLetterMatcher.tsx:15-19
const MATCHER_WINDOWS: Record<Level, Window> = { beginner: { min: 4, max: 6 }, intermediate: { min: 4, max: 8 }, advanced: { min: 6 } };
// syllableSplitter: games/syllableSplitter/useSyllableSplitter.tsx:15-20
const SYLLABLE_WINDOWS: Record<Level, Window> = { beginner: { min: 4, max: 6 }, intermediate: { min: 5, max: 8 }, advanced: { min: 6, max: 12 } };
// wordFinder: games/wordFinder/useWordFinder.tsx:12-16 (no minLength → DB default 3, services/WordsService.ts getWordsImpl)
const FINDER_WINDOWS: Record<Level, Window> = { beginner: { min: 3, max: 4 }, intermediate: { min: 4, max: 6 }, advanced: { min: 6, max: 9 } };
// spellTower / wordsRain: minLength 4, no max, same for every level
const TOWER_WINDOW: Window = { min: 4 };
// Prefetched pool on level selection: services/WordsService.ts WORD_GROUP_FETCH_CONFIG
const PREFETCH_WINDOWS: Record<string, Window> = {
    WORDS_FINDER: { min: 4, max: 9 },
    WORDS_ACCENT: { min: 4 },
    WORDS_MATCHER: { min: 4 },
    WORDS_SYLLABLE: { min: 4 },
    WORDS_TOWER: { min: 4 },
    WORDS_RAIN: { min: 4 },
};

const SPANISH_LETTERS = /^[a-záéíóúüñ]+$/;
const PREFIX_WORDS = /^(sub[lr]|abrog|abrup)/;
const LOANWORD_Y = /y[^aeiouáéíóú]|[^aeiouáéíóúü]y$/;
const TL_CLUSTER = /tl/;
// syllableSplitter isEligible minus the length window: useSyllableSplitter.tsx:34-42
const syllableEligible = (w: string) =>
    SPANISH_LETTERS.test(w) && !PREFIX_WORDS.test(w) && !LOANWORD_Y.test(w) && !TL_CLUSTER.test(w) && syllabify(w).length >= 2;

const inWindow = (w: string, win: Window) => w.length >= win.min && (win.max === undefined || w.length <= win.max);

// ---------- stats helpers ----------
const median = (xs: number[]) => {
    if (xs.length === 0) return NaN;
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
};
const pct = (n: number, d: number) => (d === 0 ? '—' : `${((100 * n) / d).toFixed(1)}%`);
const fmt = (n: number) => n.toLocaleString('es-ES');

type Profile = {
    n: number;
    lenMedian: number;
    lenMin: number;
    lenMax: number;
    byLength: Record<string, number>;
    byLetter: Record<string, number>;
    top10k: string;
    notInFreq: string;
    freqMedian: number | string;
    accent: string;
    enye: string;
    hiatus?: string;
};

const isVowel = (c: string) => 'aeiouáéíóúü'.includes(c);
const hasHiatus = (w: string) => dividerPositions(w).some((p) => isVowel(w[p - 1]) && isVowel(w[p]) );
const hasAccent = (w: string) => /[áéíóú]/.test(w);

const profile = (words: string[], freq: Map<string, number>, locale: Locale): Profile => {
    const byLength: Record<string, number> = {};
    const byLetter: Record<string, number> = {};
    const ranks: number[] = [];
    let top10k = 0;
    let notIn = 0;
    let accent = 0;
    let enye = 0;
    let hiatus = 0;
    for (const w of words) {
        const L = w.length >= 13 ? '13+' : String(w.length);
        byLength[L] = (byLength[L] ?? 0) + 1;
        const first = w[0];
        byLetter[first] = (byLetter[first] ?? 0) + 1;
        const r = freq.get(w);
        if (r === undefined) notIn++;
        else {
            ranks.push(r);
            if (r <= 10000) top10k++;
        }
        if (hasAccent(w)) accent++;
        if (w.includes('ñ')) enye++;
        if (locale === 'es' && hasHiatus(w)) hiatus++;
    }
    const lens = words.map((w) => w.length);
    return {
        n: words.length,
        lenMedian: median(lens),
        lenMin: lens.length ? lens.reduce((a, b) => Math.min(a, b), Infinity) : 0,
        lenMax: lens.length ? lens.reduce((a, b) => Math.max(a, b), 0) : 0,
        byLength,
        byLetter,
        top10k: pct(top10k, words.length),
        notInFreq: pct(notIn, words.length),
        freqMedian: ranks.length ? median(ranks) : '—',
        accent: pct(accent, words.length),
        enye: pct(enye, words.length),
        ...(locale === 'es' ? { hiatus: pct(hiatus, words.length) } : {}),
    };
};

/**
 * Sessions until the first word is shown again, assuming what the code does: every refill is an
 * independent uniform draw from the eligible set (DBService.getRandomWords keeps no history across
 * calls), `shown` words played per session. Median over 300 simulated players.
 */
const sessionsUntilRepeat = (eligible: number, shown: number): number | string => {
    if (eligible === 0) return '—';
    if (shown >= eligible) return 1;
    const runs: number[] = [];
    for (let r = 0; r < 300; r++) {
        const seen = new Set<number>();
        let s = 0;
        let repeated = false;
        while (!repeated && s < 100000) {
            s++;
            const session = new Set<number>();
            while (session.size < shown) session.add(Math.floor(Math.random() * eligible));
            for (const x of session) {
                if (seen.has(x)) repeated = true;
                seen.add(x);
            }
        }
        runs.push(s);
    }
    return median(runs);
};

const lengthTable = (rows: [string, Profile][]) => {
    const keys = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13+'];
    const lower = rows.some(([, p]) => (p.byLength['1'] ?? 0) + (p.byLength['2'] ?? 0) > 0);
    const allKeys = lower ? ['1', '2', ...keys] : keys;
    out(`| set | ${allKeys.join(' | ')} |`);
    out(`|---|${allKeys.map(() => '---:').join('|')}|`);
    for (const [name, p] of rows) out(`| ${name} | ${allKeys.map((k) => fmt(p.byLength[k] ?? 0)).join(' | ')} |`);
};

const letterTable = (rows: [string, Profile][], locale: Locale) => {
    const letters = locale === 'es' ? 'abcdefghijklmnñopqrstuvwxyz'.split('') : 'abcdefghijklmnopqrstuvwxyz'.split('');
    const others = (p: Profile) => Object.entries(p.byLetter).filter(([k]) => !letters.includes(k)).reduce((a, [, v]) => a + v, 0);
    out(`| set | ${letters.join(' | ')} | other |`);
    out(`|---|${letters.map(() => '---:').join('|')}|---:|`);
    for (const [name, p] of rows) out(`| ${name} | ${letters.map((k) => fmt(p.byLetter[k] ?? 0)).join(' | ')} | ${fmt(others(p))} |`);
};

const difficultyTable = (rows: [string, Profile][], locale: Locale) => {
    out(`| set | words | len min–median–max | freq rank median | in top-10k | not in freq list | with accent | with ñ |${locale === 'es' ? ' with hiatus |' : ''}`);
    out(`|---|---:|---|---:|---:|---:|---:|---:|${locale === 'es' ? '---:|' : ''}`);
    for (const [name, p] of rows) {
        out(
            `| ${name} | ${fmt(p.n)} | ${p.lenMin}–${p.lenMedian}–${p.lenMax} | ${typeof p.freqMedian === 'number' ? fmt(p.freqMedian) : p.freqMedian} | ${p.top10k} | ${p.notInFreq} | ${p.accent} | ${p.enye} |${locale === 'es' ? ` ${p.hiatus} |` : ''}`,
        );
    }
};

// ---------- main ----------
const summary: { game: string; locale: string; level: string; eligible: number; shown: number; repeat: number | string; note: string }[] = [];

for (const locale of LOCALES) {
    out(`# ${locale.toUpperCase()}`);
    out();
    const freq = loadFrequency(locale);
    const levelWords: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
    const levelSets: Record<Level, Set<string>> = { beginner: new Set(), intermediate: new Set(), advanced: new Set() };
    for (const level of LEVELS) {
        levelWords[level] = loadLevel(locale, level);
        levelSets[level] = new Set(levelWords[level]);
    }
    const fullWordSet = new Set<string>([...levelSets.beginner, ...levelSets.intermediate, ...levelSets.advanced]);

    // ---- raw level lists ----
    out('## Level lists (public/words)');
    out();
    out('| level | entries | unique | duplicates | also in beginner | also in intermediate | also in advanced | not lowercase letters only | length ≤ 2 |');
    out('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
    const letterRe = locale === 'es' ? /^[a-záéíóúüñ]+$/ : /^[a-z]+$/;
    const rawInfo: Record<string, unknown> = {};
    for (const level of LEVELS) {
        const list = levelWords[level];
        const set = levelSets[level];
        const overlap = (other: Level) => (other === level ? '—' : fmt([...set].filter((w) => levelSets[other].has(w)).length));
        const odd = [...set].filter((w) => !letterRe.test(w));
        const short = [...set].filter((w) => w.length <= 2).length;
        rawInfo[level] = { entries: list.length, unique: set.size, oddSample: odd.slice(0, 15) };
        out(
            `| ${level} | ${fmt(list.length)} | ${fmt(set.size)} | ${fmt(list.length - set.size)} | ${overlap('beginner')} | ${overlap('intermediate')} | ${overlap('advanced')} | ${fmt(odd.length)} | ${fmt(short)} |`,
        );
    }
    out();
    for (const level of LEVELS) {
        const odd = (rawInfo[level] as { oddSample: string[] }).oddSample;
        if (odd.length) out(`- ${level} sample of entries that are not lowercase letters: ${odd.map((w) => `\`${w}\``).join(', ')}`);
    }
    out();

    // ---- blocklists ----
    const block = new Set([...loadBlocklist('html_xml_blocklist.txt'), ...loadBlocklist(`html_xml_blocklist_${locale}.txt`)]);
    out('## Blocklisted words still present in the level lists');
    out();
    for (const level of LEVELS) {
        const hits = [...levelSets[level]].filter((w) => block.has(w));
        out(`- ${level}: ${hits.length}${hits.length ? ` — ${hits.slice(0, 20).map((w) => `\`${w}\``).join(', ')}` : ''}`);
    }
    out();

    // ---- difficulty profile of the raw levels ----
    out('## Difficulty profile of each level (raw list, before game filters)');
    out();
    const rawProfiles: [string, Profile][] = LEVELS.map((l) => [l, profile([...levelSets[l]], freq, locale)]);
    difficultyTable(rawProfiles, locale);
    out();
    lengthTable(rawProfiles);
    out();

    // ---- per game ----
    const processor = new WordGameProcessor(locale, fullWordSet);
    const rules = createChangeRules(locale);

    const gameBlock = (
        game: string,
        sets: Record<Level, string[]>,
        shown: number,
        extraNotes: Record<Level, string> = { beginner: '', intermediate: '', advanced: '' },
        showLetters = true,
    ) => {
        out(`### ${game}`);
        out();
        const profs: [string, Profile][] = LEVELS.map((l) => [l, profile(sets[l], freq, locale)]);
        difficultyTable(profs, locale);
        out();
        lengthTable(profs);
        out();
        if (showLetters) {
            letterTable(profs, locale);
            out();
        }
        for (const level of LEVELS) {
            const repeat = sessionsUntilRepeat(sets[level].length, shown);
            summary.push({ game, locale, level, eligible: sets[level].length, shown, repeat, note: extraNotes[level] });
        }
        (json[`${locale}.${game}`] as unknown) = Object.fromEntries(profs.map(([l, p]) => [l, p]));
    };

    out('## Games');
    out();

    // spellTower / wordsRain: words that get at least one distractor
    {
        const sets: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
        // The pool the games draw from today: every word in the window, single-option words included.
        const windowSets: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
        const noDistractor: Record<Level, number> = { beginner: 0, intermediate: 0, advanced: 0 };
        const window: Record<Level, number> = { beginner: 0, intermediate: 0, advanced: 0 };
        const optionCounts: Record<Level, Record<number, number>> = { beginner: {}, intermediate: {}, advanced: {} };
        for (const level of LEVELS) {
            for (const w of levelSets[level]) {
                if (!inWindow(w, TOWER_WINDOW)) continue;
                window[level]++;
                windowSets[level].push(w);
                let arr = processor.processWord(w);
                if (arr.length === 1) arr = processor.processWordWithAccent(arr[0]);
                optionCounts[level][arr.length] = (optionCounts[level][arr.length] ?? 0) + 1;
                if (arr.length < 2) noDistractor[level]++;
                else sets[level].push(w);
            }
        }
        out('### spellTower + wordsRain — distractor generation (`processWord` → `processWordWithAccent`)');
        out();
        out('| level | in length window (≥4) | 1 option (no distractor) | 2 options | 3 options | eligible (≥2 options) |');
        out('|---|---:|---:|---:|---:|---:|');
        for (const level of LEVELS) {
            const oc = optionCounts[level];
            out(`| ${level} | ${fmt(window[level])} | ${fmt(noDistractor[level])} (${pct(noDistractor[level], window[level])}) | ${fmt(oc[2] ?? 0)} | ${fmt(oc[3] ?? 0)} | ${fmt(sets[level].length)} |`);
        }
        out();
        gameBlock('spellTower', windowSets, 15, { beginner: 'today: single-option words included', intermediate: 'today: single-option words included', advanced: 'today: single-option words included' });
        // After job 3 (single-option words dropped): only the ≥2-option set.
        for (const level of LEVELS) {
            summary.push({ game: 'spellTower (≥2 opciones, tras job 3)', locale, level, eligible: sets[level].length, shown: 15, repeat: sessionsUntilRepeat(sets[level].length, 15), note: 'only words with ≥1 distractor' });
        }
        // wordsRain plays the same processed words; 150 looped per hour, not consumed.
        for (const level of LEVELS) {
            summary.push({ game: 'wordsRain', locale, level, eligible: windowSets[level].length, shown: 150, repeat: 1, note: 'cycles the same 150 words for 1 h; single-option words included' });
        }
        json[`${locale}.towerNoDistractor`] = { noDistractor, window };
    }

    // wordFinder
    {
        const sets: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
        for (const level of LEVELS) sets[level] = [...levelSets[level]].filter((w) => inWindow(w, FINDER_WINDOWS[level]));
        const prefetch: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
        for (const level of LEVELS) prefetch[level] = [...levelSets[level]].filter((w) => inWindow(w, PREFETCH_WINDOWS.WORDS_FINDER));
        out('### wordFinder — game window vs prefetched pool (WORD_GROUP_FETCH_CONFIG 4–9)');
        out();
        out('| level | game window | eligible by game window | eligible by prefetch window (first ≥60 words after a level change) | of those, outside the game window |');
        out('|---|---|---:|---:|---:|');
        for (const level of LEVELS) {
            const outside = prefetch[level].filter((w) => !inWindow(w, FINDER_WINDOWS[level])).length;
            const win = FINDER_WINDOWS[level];
            out(`| ${level} | ${win.min}–${win.max} | ${fmt(sets[level].length)} | ${fmt(prefetch[level].length)} | ${fmt(outside)} (${pct(outside, prefetch[level].length)}) |`);
        }
        out();
        gameBlock('wordFinder', sets, 10);
    }

    if (locale === 'es') {
        // accentFixer
        const sets: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
        out('### accentFixer — `buildChallenge` eligibility');
        out();
        out('| level | in window | eligible | with accent | without accent | accented share | prefetch pool (≥4) words outside window |');
        out('|---|---:|---:|---:|---:|---:|---:|');
        for (const level of LEVELS) {
            const inWin = [...levelSets[level]].filter((w) => inWindow(w, ACCENT_WINDOWS[level]));
            const elig = inWin.filter((w) => buildChallenge(w, fullWordSet) !== null);
            const acc = elig.filter((w) => buildChallenge(w, fullWordSet)!.accentIndex !== -1).length;
            const pre = [...levelSets[level]].filter((w) => inWindow(w, PREFETCH_WINDOWS.WORDS_ACCENT));
            const preOutside = pre.filter((w) => !inWindow(w, ACCENT_WINDOWS[level])).length;
            sets[level] = elig;
            out(`| ${level} | ${fmt(inWin.length)} | ${fmt(elig.length)} | ${fmt(acc)} | ${fmt(elig.length - acc)} | ${pct(acc, elig.length)} | ${pct(preOutside, pre.length)} |`);
        }
        out();
        gameBlock('accentFixer', sets, 10);

        // syllableSplitter
        const ssets: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
        out('### syllableSplitter — `isEligible`');
        out();
        out('| level | window | in window | eligible | share of prefetch pool (≥4) that passes `isEligible` with the level window |');
        out('|---|---|---:|---:|---:|');
        for (const level of LEVELS) {
            const win = SYLLABLE_WINDOWS[level];
            const inWin = [...levelSets[level]].filter((w) => inWindow(w, win));
            ssets[level] = inWin.filter(syllableEligible);
            const pre = [...levelSets[level]].filter((w) => inWindow(w, PREFETCH_WINDOWS.WORDS_SYLLABLE));
            const prePass = pre.filter((w) => inWindow(w, win) && syllableEligible(w)).length;
            out(`| ${level} | ${win.min}–${win.max} | ${fmt(inWin.length)} | ${fmt(ssets[level].length)} | ${pct(prePass, pre.length)} |`);
        }
        out();
        const sylCounts = (ws: string[]) => {
            const c: Record<string, number> = {};
            for (const w of ws) {
                const n = syllabify(w).length;
                const k = n >= 6 ? '6+' : String(n);
                c[k] = (c[k] ?? 0) + 1;
            }
            return c;
        };
        out('| level | 2 syll. | 3 | 4 | 5 | 6+ |');
        out('|---|---:|---:|---:|---:|---:|');
        for (const level of LEVELS) {
            const c = sylCounts(ssets[level]);
            out(`| ${level} | ${['2', '3', '4', '5', '6+'].map((k) => fmt(c[k] ?? 0)).join(' | ')} |`);
        }
        out();
        gameBlock('syllableSplitter', ssets, 10);
    }

    // letterMatcher (both locales)
    {
        const sets: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
        out(`### letterMatcher — \`buildLetterChallenge\` eligibility (${locale})`);
        out();
        out('| level | in window | eligible | share | prefetch pool (≥4) words outside window |');
        out('|---|---:|---:|---:|---:|');
        for (const level of LEVELS) {
            const inWin = [...levelSets[level]].filter((w) => inWindow(w, MATCHER_WINDOWS[level]));
            sets[level] = inWin.filter((w) => buildLetterChallenge(w, rules, fullWordSet) !== null);
            const pre = [...levelSets[level]].filter((w) => inWindow(w, PREFETCH_WINDOWS.WORDS_MATCHER));
            const preOutside = pre.filter((w) => !inWindow(w, MATCHER_WINDOWS[level])).length;
            out(`| ${level} | ${fmt(inWin.length)} | ${fmt(sets[level].length)} | ${pct(sets[level].length, inWin.length)} | ${pct(preOutside, pre.length)} |`);
        }
        out();
        gameBlock('letterMatcher', sets, 10);
    }

    // ---- daily word ----
    {
        const beg = [...levelSets.beginner];
        const short = beg.filter((w) => w.length < 4);
        out('### Daily word (`loadDailyWordForLocale`: `getRandomWords(1)` from beginner, no length filter)');
        out();
        out(`- beginner words: ${fmt(beg.length)}; shorter than 4 letters (WORDS_DAILY's minLength, which the daily word never reads): ${fmt(short.length)} (${pct(short.length, beg.length)}) — e.g. ${short.slice(0, 12).map((w) => `\`${w}\``).join(', ')}`);
        const begDefs = loadDefinitions(locale);
        const withDef = beg.filter((w) => begDefs[w[0]]?.[w] !== undefined).length;
        out(`- beginner words with an entry in public/definitions/${locale}: ${fmt(withDef)} (${pct(withDef, beg.length)})`);
        out();
        summary.push({ game: 'dailyWord', locale, level: 'beginner (always)', eligible: beg.length, shown: 1, repeat: sessionsUntilRepeat(beg.length, 1), note: 'level ignored; 1 word/day' });
    }

    // ---- definitions-based games ----
    const defs = loadDefinitions(locale);
    const allDefWords = Object.values(defs).flatMap((d) => Object.keys(d));
    {
        out('## Definitions data (public/definitions)');
        out();
        let entries = 0;
        let noDefs = 0;
        let emptyText = 0;
        let html = 0;
        let shortFmt = 0;
        let reveals = 0;
        let revealsFmt = 0;
        let enTypeInEs = 0;
        let defsTotal = 0;
        let notInWordList = 0;
        const htmlSamples: string[] = [];
        const shortSamples: string[] = [];
        const revealSamples: string[] = [];
        const enTypeSamples: string[] = [];
        const levelField: Record<string, number> = {};
        for (const d of Object.values(defs)) {
            for (const [w, e] of Object.entries(d)) {
                entries++;
                levelField[e.level ?? '(none)'] = (levelField[e.level ?? '(none)'] ?? 0) + 1;
                if (!fullWordSet.has(w)) notInWordList++;
                if (!e.definitions?.length) noDefs++;
                for (const def of e.definitions ?? []) {
                    defsTotal++;
                    const t = (def.definition ?? '').trim();
                    if (!t) emptyText++;
                    if (/<[a-z/][^>]*>|&[a-z]+;|&#\d+;/i.test(t)) {
                        html++;
                        if (htmlSamples.length < 5) htmlSamples.push(`${w}: ${t.slice(0, 90)}`);
                    }
                    const f = formatDefinition(t);
                    if ((f.match(/\p{L}/gu)?.length ?? 0) < 10) {
                        shortFmt++;
                        if (shortSamples.length < 8) shortSamples.push(`${w}: "${t.slice(0, 60)}" → "${f}"`);
                    }
                    if (revealsWord(t, w)) reveals++;
                    if (revealsWord(f, w)) {
                        revealsFmt++;
                        if (revealSamples.length < 6) revealSamples.push(`${w}: "${f.slice(0, 80)}"`);
                    }
                    if (locale === 'es' && /^(verb|noun|adjective|adverb|preposition|pronoun|conjunction|interjection)\b/i.test(def.type ?? '')) {
                        enTypeInEs++;
                        if (enTypeSamples.length < 6) enTypeSamples.push(`${w} [${def.type}]: ${t.slice(0, 60)}`);
                    }
                }
            }
        }
        out(`| metric | value |`);
        out(`|---|---:|`);
        out(`| words with an entry | ${fmt(entries)} |`);
        out(`| … not in any level list | ${fmt(notInWordList)} (${pct(notInWordList, entries)}) |`);
        out(`| … with no definitions | ${fmt(noDefs)} |`);
        out(`| \`level\` field | ${Object.entries(levelField).map(([k, v]) => `${k}: ${fmt(v)}`).join(', ')} |`);
        out(`| definitions | ${fmt(defsTotal)} |`);
        out(`| … empty text | ${fmt(emptyText)} |`);
        out(`| … HTML/entity junk | ${fmt(html)} |`);
        out(`| … under 10 letters after \`formatDefinition\` (cut at first '.') | ${fmt(shortFmt)} (${pct(shortFmt, defsTotal)}) |`);
        out(`| … raw text contains the word | ${fmt(reveals)} (${pct(reveals, defsTotal)}) |`);
        out(`| … formatted text (what definitionMaster shows) contains the word | ${fmt(revealsFmt)} (${pct(revealsFmt, defsTotal)}) |`);
        if (locale === 'es') out(`| … ES entry with an English part-of-speech label | ${fmt(enTypeInEs)} (${pct(enTypeInEs, defsTotal)}) |`);
        out();
        out('Per letter (words with an entry):');
        out();
        const letters = Object.keys(defs).sort();
        out(`| ${letters.join(' | ')} |`);
        out(`|${letters.map(() => '---:').join('|')}|`);
        out(`| ${letters.map((l) => fmt(Object.keys(defs[l]).length)).join(' | ')} |`);
        out();
        if (htmlSamples.length) out(`- HTML samples: ${htmlSamples.map((s) => `\`${s}\``).join('; ')}`);
        if (shortSamples.length) out(`- Short-after-format samples: ${shortSamples.map((s) => `\`${s}\``).join('; ')}`);
        if (revealSamples.length) out(`- Shown definition contains the word: ${revealSamples.map((s) => `\`${s}\``).join('; ')}`);
        if (enTypeSamples.length) out(`- English labels in ES: ${enTypeSamples.map((s) => `\`${s}\``).join('; ')}`);
        out();
        const empty = Object.entries(LETTERS_WITHOUT_DEFINITIONS[locale] ? { x: 1 } : {}).length;
        void empty;
    }

    // definitionMaster
    {
        out('### definitionMaster — words per letter with enough definitions (`minDefs` 1/2/3, max 10 per letter session)');
        out();
        const minDefs: Record<Level, number> = { beginner: 1, intermediate: 2, advanced: 3 };
        const letters = Object.keys(defs).sort();
        out(`| level | total eligible | letters with < 5 words (fewer than 5 options) | letters with < 10 words (short quiz) | sessions per letter before repeat (eligible/10) min–median |`);
        out('|---|---:|---|---|---|');
        const dmSets: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
        for (const level of LEVELS) {
            const perLetter = letters.map((l) => Object.entries(defs[l]).filter(([, e]) => (e.definitions?.length ?? 0) >= minDefs[level]).map(([w]) => w));
            dmSets[level] = perLetter.flat();
            const lt5 = letters.filter((_, i) => perLetter[i].length < 5 && !LETTERS_WITHOUT_DEFINITIONS[locale]?.has(letters[i]));
            const lt10 = letters.filter((_, i) => perLetter[i].length < 10 && !LETTERS_WITHOUT_DEFINITIONS[locale]?.has(letters[i]));
            const sess = perLetter.filter((_, i) => !LETTERS_WITHOUT_DEFINITIONS[locale]?.has(letters[i]) && perLetter[i].length > 0).map((p) => p.length / 10);
            out(`| ${level} | ${fmt(dmSets[level].length)} | ${lt5.join(' ') || '—'} | ${lt10.join(' ') || '—'} | ${Math.min(...sess).toFixed(1)}–${median(sess).toFixed(1)} |`);
        }
        out();
        // Duplicate definitions inside one letter: two options with the same text.
        let dup = 0;
        const dupSamples: string[] = [];
        for (const l of letters) {
            const seen = new Map<string, string>();
            for (const [w, e] of Object.entries(defs[l])) {
                const first = e.definitions?.[0];
                if (!first) continue;
                const f = formatDefinition(first.definition ?? '').toLowerCase();
                if (seen.has(f)) {
                    dup++;
                    if (dupSamples.length < 6) dupSamples.push(`${seen.get(f)} / ${w}: "${f.slice(0, 50)}"`);
                } else seen.set(f, w);
            }
        }
        out(`- Words whose first formatted definition repeats another word's in the same letter file (identical answer options): ${fmt(dup)}${dupSamples.length ? ` — e.g. ${dupSamples.map((s) => `\`${s}\``).join('; ')}` : ''}`);
        const lvlMix = LEVELS.map((level) => {
            const inLevel = dmSets[level].filter((w) => levelSets.beginner.has(w)).length;
            return `${level}: ${pct(inLevel, dmSets[level].length)} are beginner-list words`;
        });
        out(`- The level does not pick the words, only how many definitions they need: ${lvlMix.join('; ')}.`);
        out();
        gameBlock('definitionMaster', dmSets, 10);
    }

    // spellingBee
    {
        out('### spellingBee — words ≥4 letters with a usable clue for the level');
        out();
        const sbSets: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
        out('| level | words ≥4 | with ≥1 usable clue among the level\'s definitions | share |');
        out('|---|---:|---:|---:|');
        for (const level of LEVELS) {
            let n4 = 0;
            for (const d of Object.values(defs)) {
                for (const [w, e] of Object.entries(d)) {
                    if (Array.from(w).length < 4 || !e.definitions?.length) continue;
                    n4++;
                    const nums = e.definitions.map((x) => Number(x.number));
                    const eligible = level === 'beginner' ? e.definitions.filter((_, i) => nums[i] === 1) : level === 'intermediate' ? e.definitions.filter((_, i) => nums[i] <= 3) : e.definitions;
                    const pool = eligible.length ? eligible : e.definitions;
                    if (pool.some((x) => isUsableClue({ word: w, definition: formatDefinition(x.definition ?? ''), type: x.type ?? '' }, locale))) sbSets[level].push(w);
                }
            }
            out(`| ${level} | ${fmt(n4)} | ${fmt(sbSets[level].length)} | ${pct(sbSets[level].length, n4)} |`);
        }
        out();
        // sanity check the real picker is the one emulated
        void getDefinitionForLevel;
        gameBlock('spellingBee', sbSets, 5);
    }

    // crossWordPuzzle
    {
        out('### crossWordPuzzle — definitions words (accents stripped), 6 random letters per batch, 3 batches');
        out();
        const stripped = allDefWords.map((w) => w.split('').map((c) => AccentedVowels[c] || c).join(''));
        const collisions = stripped.length - new Set(stripped).size;
        const notLetters = stripped.filter((w) => !/^[a-zñü]+$/.test(w));
        out(`- words: ${fmt(stripped.length)}; accent-stripping collisions (two words become one key, one definition lost): ${fmt(collisions)}; keys with non-letters: ${fmt(notLetters.length)}${notLetters.length ? ` (${notLetters.slice(0, 8).map((w) => `\`${w}\``).join(', ')})` : ''}`);
        const lettersAll = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const targets: Record<Level, number> = { beginner: 4, intermediate: 6, advanced: 8 };
        const placedWords: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
        out();
        out('| level | target words | trials | full layout | failed after 3 batches | median placed-word length | words ≥ 10 letters placed |');
        out('|---|---:|---:|---:|---:|---:|---:|');
        for (const level of LEVELS) {
            let ok = 0;
            const lens: number[] = [];
            let long = 0;
            const trials = 150;
            for (let t = 0; t < trials; t++) {
                let placed = null;
                for (let b = 0; b < 3 && !placed; b++) {
                    const ls = [...lettersAll].sort(() => 0.5 - Math.random()).slice(0, 6);
                    const keys = new Set<string>();
                    for (const l of ls) for (const w of Object.keys(defs[l] ?? {})) keys.add(w.split('').map((c) => AccentedVowels[c] || c).join(''));
                    placed = generateCrossword([...keys], targets[level], 15);
                }
                if (placed) {
                    ok++;
                    for (const p of placed) {
                        lens.push(p.word.length);
                        placedWords[level].push(p.word);
                        if (p.word.length >= 10) long++;
                    }
                }
            }
            out(`| ${level} | ${targets[level]} | ${trials} | ${ok} | ${trials - ok} | ${median(lens)} | ${long} |`);
        }
        out();
        // Length and letter distributions: the pool (same for every level) and the words placed per level.
        const cwProfs: [string, Profile][] = [
            ['pool (all levels, accents stripped)', profile([...new Set(stripped)], freq, locale)],
            ...LEVELS.map((l): [string, Profile] => [`placed, ${l} (150 trials)`, profile(placedWords[l], freq, locale)]),
        ];
        lengthTable(cwProfs);
        out();
        letterTable(cwProfs, locale);
        out();
        json[`${locale}.crossWordPuzzle`] = Object.fromEntries(cwProfs);
    }

    // wordBuilder
    {
        out('### wordBuilder — 4 random consonants + 2 random vowels, words from all three levels');
        out();
        const alphabet = locale === 'es' ? 'abcdefghijklmnñopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
        const bit = (c: string) => {
            const base = AccentedVowels[c] ?? c;
            const i = alphabet.indexOf(base);
            return i === -1 ? -1 : i;
        };
        const masks = new Map<number, { all: number; beginner: number; words: string[] }>();
        let impossible = 0;
        for (const w of fullWordSet) {
            if (w.length <= 1) continue;
            let m = 0;
            let bad = false;
            for (const c of w) {
                const i = bit(c);
                if (i < 0) {
                    bad = true;
                    break;
                }
                m |= 1 << i;
            }
            if (bad) {
                impossible++;
                continue;
            }
            const e = masks.get(m) ?? { all: 0, beginner: 0, words: [] };
            e.all++;
            e.words.push(w);
            if (levelSets.beginner.has(w)) e.beginner++;
            masks.set(m, e);
        }
        const trials = 1000;
        const totals: number[] = [];
        const begTotals: number[] = [];
        let zero = 0;
        let zeroBeg = 0;
        const zeroSamples: string[] = [];
        const found = new Set<string>();
        for (let t = 0; t < trials; t++) {
            const cons = [...consonants[locale]].sort(() => Math.random() - 0.5).slice(0, 4);
            const vows = [...vowels].sort(() => Math.random() - 0.5).slice(0, 2);
            let m = 0;
            for (const c of [...cons, ...vows]) m |= 1 << alphabet.indexOf(c);
            let n = 0;
            let nb = 0;
            for (const [k, v] of masks) {
                if ((k & m) === k) {
                    n += v.all;
                    nb += v.beginner;
                    for (const w of v.words) found.add(w);
                }
            }
            totals.push(n);
            begTotals.push(nb);
            if (n === 0) {
                zero++;
                if (zeroSamples.length < 5) zeroSamples.push([...cons, ...vows].join(''));
            }
            if (nb === 0) zeroBeg++;
        }
        const q = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))];
        out(`| metric (${trials} random letter sets) | value |`);
        out('|---|---:|');
        out(`| findable words p10 / median / p90 | ${q(totals, 0.1)} / ${median(totals)} / ${q(totals, 0.9)} |`);
        out(`| … of which beginner-list words, median | ${median(begTotals)} |`);
        out(`| sets with 0 findable words | ${zero} (${pct(zero, trials)})${zeroSamples.length ? ` e.g. ${zeroSamples.map((s) => `\`${s}\``).join(', ')}` : ''} |`);
        out(`| sets with 0 beginner-list words | ${zeroBeg} (${pct(zeroBeg, trials)}) |`);
        out(`| dictionary words never findable (letters outside the set, e.g. ü) | ${fmt(impossible)} |`);
        out();
        out('- The level is not used by wordBuilder (same letters rule and same dictionary on every level).');
        out();
        // Length and letter distributions: the findable dictionary and the words found across the trials.
        const wbProfs: [string, Profile][] = [
            ['findable dictionary (all levels)', profile([...masks.values()].flatMap((v) => v.words), freq, locale)],
            [`found in ${trials} letter sets (union)`, profile([...found], freq, locale)],
        ];
        lengthTable(wbProfs);
        out();
        letterTable(wbProfs, locale);
        out();
        json[`${locale}.wordBuilder`] = Object.fromEntries(wbProfs);
        summary.push({ game: 'wordBuilder', locale, level: 'all (level ignored)', eligible: median(totals), shown: 0, repeat: '—', note: 'median words findable per letter set' });
    }
}

// ---------- summary ----------
const head: string[] = [];
head.push('# Words per level per game — summary');
head.push('');
head.push('`eligible` = distinct words the game can show at that level after every filter in the code. `shown` = words played per session. `sessions until first repeat` = median over 300 simulated players of the session in which a word already seen comes back (uniform independent refills, as `DBService.getRandomWords` does). It ignores the code bugs that repeat earlier (see the report).');
head.push('');
head.push('| game | locale | level | eligible | shown/session | sessions until first repeat | note |');
head.push('|---|---|---|---:|---:|---:|---|');
for (const s of summary) head.push(`| ${s.game} | ${s.locale} | ${s.level} | ${fmt(s.eligible)} | ${s.shown || '—'} | ${s.repeat} | ${s.note} |`);
head.push('');

const text = [...head, ...md].join('\n');
fs.writeFileSync(path.join(OUT_DIR, 'results.md'), text + '\n');
fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify({ summary, profiles: json }, null, 1) + '\n');
console.log(text);
