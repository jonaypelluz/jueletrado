/**
 * Extracts candidate words from a text file (e.g. a book) and appends the
 * ones not yet known to ops/crawl-output/{locale}/discovered_words.txt.
 *
 * "Not yet known" = not already in public/definitions/{locale}/*, not in
 * ops/crawl-output/{locale}/not-found.txt, not in any of the 3 *_words.txt
 * lists, and not already in discovered_words.txt from a previous run.
 *
 * Never touches public/definitions/ or the *_words.txt lists — output goes
 * only to discovered_words.txt (append-safe across multiple book runs).
 *
 * Usage:
 *   tsx scripts/words/extractFromBook.ts <es|en> <bookFile>
 */

import { readFile, appendFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const LOCALES = ['es', 'en'] as const;
type Locale = (typeof LOCALES)[number];
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

const VALID_RE: Record<Locale, RegExp> = {
    es: /[\p{L}]+/gu,
    en: /[a-zA-Z]+/g,
};

async function loadWordSet(filePath: string): Promise<Set<string>> {
    if (!existsSync(filePath)) return new Set();
    const content = await readFile(filePath, 'utf-8');
    return new Set(content.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean));
}

async function loadDefinedWords(locale: Locale): Promise<Set<string>> {
    const dir = path.join(ROOT, 'public/definitions', locale);
    const words = new Set<string>();
    if (!existsSync(dir)) return words;

    for (const file of await readdir(dir)) {
        if (!file.endsWith('.json')) continue;
        const data = JSON.parse(await readFile(path.join(dir, file), 'utf-8')) as Record<string, unknown>;
        for (const word of Object.keys(data)) words.add(word.toLowerCase());
    }

    return words;
}

async function main(): Promise<void> {
    const [, , locale, bookFile] = process.argv;

    if (!locale || !bookFile || !(LOCALES as readonly string[]).includes(locale)) {
        console.error('Usage: tsx scripts/words/extractFromBook.ts <es|en> <bookFile>');
        process.exit(1);
    }

    if (!existsSync(bookFile)) {
        console.error(`Book file not found: ${bookFile}`);
        process.exit(1);
    }

    const loc = locale as Locale;
    const wordsDir = path.join(ROOT, 'ops/scripts/words', loc);
    const outputDir = path.join(ROOT, 'ops/crawl-output', loc);
    const outputFile = path.join(outputDir, 'discovered_words.txt');

    await mkdir(outputDir, { recursive: true });
    if (!existsSync(outputFile)) await writeFile(outputFile, '', 'utf-8');

    console.log(`Loading known words for ${loc}...`);
    const known = new Set<string>();
    const sets = await Promise.all([
        loadDefinedWords(loc),
        loadWordSet(path.join(outputDir, 'not-found.txt')),
        loadWordSet(outputFile),
        ...LEVELS.map(level => loadWordSet(path.join(wordsDir, `${level}_words.txt`))),
    ]);
    for (const set of sets) {
        for (const w of set) known.add(w);
    }
    console.log(`Known words: ${known.size}`);

    console.log(`Reading ${bookFile}...`);
    const text = await readFile(bookFile, 'utf-8');
    const matches = text.match(VALID_RE[loc]) ?? [];

    const discovered = new Set<string>();
    for (const raw of matches) {
        const word = raw.toLowerCase();
        if (known.has(word) || discovered.has(word)) continue;
        discovered.add(word);
    }

    if (discovered.size === 0) {
        console.log('Nothing new found.');
        return;
    }

    await appendFile(outputFile, [...discovered].join('\n') + '\n', 'utf-8');
    console.log(`Discovered ${discovered.size} new words → ${outputFile}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
