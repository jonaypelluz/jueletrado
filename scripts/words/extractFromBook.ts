/**
 * Extracts candidate words from book files (.txt, .pdf, .epub) and appends the
 * ones not yet known to ops/crawl-output/{locale}/discovered_words.txt.
 *
 * "Not yet known" = not already in public/definitions/{locale}/*, not in
 * ops/crawl-output/{locale}/not-found.txt, not in any of the 3 *_words.txt
 * lists, not in ops/scripts/words/html_xml_blocklist.txt, and not already
 * in discovered_words.txt from a previous run.
 *
 * Never touches public/definitions/ or the *_words.txt lists — output goes
 * only to discovered_words.txt (append-safe across multiple book runs).
 *
 * Usage:
 *   tsx scripts/words/extractFromBook.ts <es|en> [bookFile]
 *
 * If bookFile is omitted, every .txt/.pdf/.epub file in ops/books/{locale}/
 * is processed.
 */

import { readFile, appendFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { PDFParse } from 'pdf-parse';
import { parse as parseHtml } from 'node-html-parser';

const ROOT = process.cwd();
const LOCALES = ['es', 'en'] as const;
type Locale = (typeof LOCALES)[number];
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const BOOK_EXTENSIONS = ['.txt', '.pdf', '.epub'];

const VALID_RE: Record<Locale, RegExp> = {
    es: /[\p{L}]+/gu,
    en: /[a-zA-Z]+/g,
};

async function loadWordSet(filePath: string): Promise<Set<string>> {
    if (!existsSync(filePath)) return new Set();
    const content = await readFile(filePath, 'utf-8');
    return new Set(
        content.split('\n')
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 0 && !w.startsWith('#'))
    );
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

async function extractTextFromPdf(filePath: string): Promise<string> {
    const data = await readFile(filePath);
    const parser = new PDFParse({ data });
    try {
        const result = await parser.getText();
        return result.text;
    } finally {
        await parser.destroy();
    }
}

async function extractTextFromEpub(filePath: string): Promise<string> {
    const zip = new AdmZip(filePath);
    const chunks: string[] = [];

    for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue;
        if (!/\.(x?html|htm)$/i.test(entry.entryName)) continue;

        const html = zip.readAsText(entry, 'utf-8');
        const root = parseHtml(html);
        root.querySelectorAll('script, style').forEach(el => el.remove());
        const body = root.querySelector('body');
        chunks.push((body ?? root).textContent);
    }

    return chunks.join('\n');
}

async function extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') return extractTextFromPdf(filePath);
    if (ext === '.epub') return extractTextFromEpub(filePath);
    return readFile(filePath, 'utf-8');
}

async function resolveBookFiles(loc: Locale, bookFile: string | undefined): Promise<string[]> {
    if (bookFile) {
        if (!existsSync(bookFile)) {
            console.error(`Book file not found: ${bookFile}`);
            process.exit(1);
        }
        return [bookFile];
    }

    const booksDir = path.join(ROOT, 'ops/books', loc);
    if (!existsSync(booksDir)) {
        console.error(`No book file given and ${booksDir} does not exist.`);
        process.exit(1);
    }

    const files = (await readdir(booksDir))
        .filter(file => BOOK_EXTENSIONS.includes(path.extname(file).toLowerCase()))
        .map(file => path.join(booksDir, file));

    if (files.length === 0) {
        console.error(`No .txt/.pdf/.epub files found in ${booksDir}`);
        process.exit(1);
    }

    return files;
}

async function main(): Promise<void> {
    const [, , locale, bookFile] = process.argv;

    if (!locale || !(LOCALES as readonly string[]).includes(locale)) {
        console.error('Usage: tsx scripts/words/extractFromBook.ts <es|en> [bookFile]');
        process.exit(1);
    }

    const loc = locale as Locale;
    const bookFiles = await resolveBookFiles(loc, bookFile);

    const wordsDir = path.join(ROOT, 'ops/scripts/words', loc);
    const outputDir = path.join(ROOT, 'ops/crawl-output', loc);
    const outputFile = path.join(outputDir, 'discovered_words.txt');

    await mkdir(outputDir, { recursive: true });
    if (!existsSync(outputFile)) await writeFile(outputFile, '', 'utf-8');

    const wordsRoot = path.join(ROOT, 'ops/scripts/words');
    const blocklistShared = path.join(wordsRoot, 'html_xml_blocklist.txt');
    const blocklistLocale = path.join(wordsRoot, `html_xml_blocklist_${loc}.txt`);

    console.log(`Loading known words for ${loc}...`);
    const known = new Set<string>();
    const sets = await Promise.all([
        loadDefinedWords(loc),
        loadWordSet(path.join(outputDir, 'not-found.txt')),
        loadWordSet(outputFile),
        loadWordSet(blocklistShared),
        loadWordSet(blocklistLocale),
        ...LEVELS.map(level => loadWordSet(path.join(wordsDir, `${level}_words.txt`))),
    ]);
    for (const set of sets) {
        for (const w of set) known.add(w);
    }
    console.log(`Known words: ${known.size}`);

    const discovered = new Set<string>();
    for (const file of bookFiles) {
        console.log(`Reading ${file}...`);
        const text = await extractText(file);
        const matches = text.match(VALID_RE[loc]) ?? [];

        for (const raw of matches) {
            const word = raw.toLowerCase();
            if (known.has(word) || discovered.has(word)) continue;
            discovered.add(word);
        }
    }

    if (discovered.size === 0) {
        console.log('Nothing new found.');
        return;
    }

    await appendFile(outputFile, [...discovered].join('\n') + '\n', 'utf-8');
    console.log(`Discovered ${discovered.size} new words → ${outputFile}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
