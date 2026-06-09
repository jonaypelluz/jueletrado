/**
 * Crawls dle.rae.es for each word in a file and writes them to a JSONL
 * staging file. Run mergeDefinitions.ts afterwards to incorporate into public/.
 *
 * Usage:
 *   tsx scripts/crawlers/crawlRAE.ts <wordsFile> [options]
 *
 * Options:
 *   --output <file>       JSONL output path (default: ops/crawl-output/es/{timestamp}.jsonl)
 *   --start <word>        Resume from this word (appends to --output file)
 *   --letter <l>          Only process words starting with this letter
 *   --level <level>       Tag entries with this level (beginner|intermediate|advanced)
 *   --skip-existing       Skip words already in public/definitions/es/
 *   --force-update        Fetch even if word already exists in public/definitions/es/
 *   --delay <min>-<max>   Random delay range in ms between requests (default: 4000-12000)
 *   --quiet-skip          Suppress per-word skip messages (shows total at end)
 *
 * Examples:
 *   tsx scripts/crawlers/crawlRAE.ts ops/scripts/words/es/beginner_words.txt --level beginner
 *   tsx scripts/crawlers/crawlRAE.ts ops/scripts/words/es/intermediate_words.txt --letter x --level intermediate
 *   tsx scripts/crawlers/crawlRAE.ts ops/scripts/words/es/beginner_words.txt --skip-existing --level beginner
 *   tsx scripts/crawlers/crawlRAE.ts ops/scripts/words/es/beginner_words.txt --start abeja --output ops/crawl-output/es/my-run.jsonl
 *   tsx scripts/crawlers/crawlRAE.ts ops/scripts/words/es/beginner_words.txt --delay 6000-15000
 */

import { parse as parseHTML } from 'node-html-parser';
import { readFile, writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const DEFINITIONS_DIR = path.join(ROOT, 'public/definitions/es');
const OUTPUT_DIR = path.join(ROOT, 'ops/crawl-output/es');

const ACCENT_MAP: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' };

function firstLetter(word: string): string {
    const ch = word[0]?.toLowerCase() ?? 'a';
    return ACCENT_MAP[ch] ?? ch;
}

interface DefinitionExtra {
    type: string;
    content: string;
}

interface Definition {
    number: string;
    type: string;
    level?: string;
    type_extra?: string;
    definition: string;
    definition_extra?: DefinitionExtra[];
}

interface CrawlEntry {
    word: string;
    locale: 'es';
    level?: string;
    source: 'rae';
    crawledAt: string;
    definitions: Definition[];
}

type DefinitionsFile = Record<string, { definitions: Definition[] }>;

const existingCache = new Map<string, DefinitionsFile>();

function beautify(text: string): string {
    let t = text
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/ ([,.:;)])/g, '$1')
        .replace(/\( /g, '(')
        .replace(/,\./g, '.');
    if (!t.endsWith('.')) t += '.';
    return t;
}

function parseDefinitions(html: string, level?: string): Definition[] {
    const root = parseHTML(html);
    const definitions: Definition[] = [];
    const seen = new Set<string>();

    for (const p of root.querySelectorAll('p')) {
        const numSpan = p.querySelector('span.n_acep');
        if (!numSpan) continue;

        const number = numSpan.text.trim().replace(/\.$/, '');
        if (seen.has(number)) continue;
        seen.add(number);

        numSpan.remove();

        const abbrs = p.querySelectorAll('abbr');
        const type = abbrs[0]?.getAttribute('title')?.trim() ?? '';
        const typeExtraParts = abbrs.slice(1)
            .map(a => a.getAttribute('title')?.trim())
            .filter((t): t is string => Boolean(t));

        for (const abbr of abbrs) abbr.remove();

        const definition = beautify(p.text);
        if (!definition || definition === '.') continue;

        const def: Definition = { number, type, definition };
        if (level) def.level = level;
        if (typeExtraParts.length > 0) def.type_extra = typeExtraParts.join(', ');

        definitions.push(def);
    }

    return definitions;
}

async function fetchHTML(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            },
        });
        if (!res.ok) return null;
        return await res.text();
    } catch {
        return null;
    }
}

async function loadExistingFile(letter: string): Promise<DefinitionsFile> {
    if (existingCache.has(letter)) return existingCache.get(letter)!;
    const filePath = path.join(DEFINITIONS_DIR, `${letter}_definitions.json`);
    if (!existsSync(filePath)) {
        existingCache.set(letter, {});
        return {};
    }
    const data = JSON.parse(await readFile(filePath, 'utf-8')) as DefinitionsFile;
    existingCache.set(letter, data);
    return data;
}

async function wordHasDefinitions(word: string): Promise<boolean> {
    const letter = firstLetter(word);
    const data = await loadExistingFile(letter);
    return Boolean(data[word]);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseDelayFlag(raw: string): { min: number; max: number } {
    const [minStr, maxStr] = raw.split('-');
    const min = parseInt(minStr, 10);
    const max = parseInt(maxStr, 10);
    if (isNaN(min) || isNaN(max) || min < 0 || max <= min) {
        console.error(`Invalid --delay value "${raw}". Expected format: <min>-<max> in ms, e.g. 4000-12000`);
        process.exit(1);
    }
    return { min, max };
}

function randomDelay(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

async function main(): Promise<void> {
    const [, , wordsFile, ...flags] = process.argv;

    if (!wordsFile) {
        console.error('Usage: tsx scripts/crawlers/crawlRAE.ts <wordsFile> [options]');
        process.exit(1);
    }

    const startIdx = flags.indexOf('--start');
    const startWord = startIdx !== -1 ? flags[startIdx + 1] : null;

    const letterIdx = flags.indexOf('--letter');
    const letterFilter = letterIdx !== -1 ? flags[letterIdx + 1]?.toLowerCase() : null;

    const levelIdx = flags.indexOf('--level');
    const levelTag = levelIdx !== -1 ? flags[levelIdx + 1] : undefined;

    const outputIdx = flags.indexOf('--output');
    const outputFile = outputIdx !== -1
        ? flags[outputIdx + 1]
        : path.join(OUTPUT_DIR, `${Date.now()}.jsonl`);

    const skipExisting = flags.includes('--skip-existing');
    const forceUpdate = flags.includes('--force-update');
    const quietSkip = flags.includes('--quiet-skip');

    const delayIdx = flags.indexOf('--delay');
    const { min: delayMin, max: delayMax } = delayIdx !== -1
        ? parseDelayFlag(flags[delayIdx + 1] ?? '')
        : { min: 4000, max: 12000 };

    await mkdir(path.dirname(outputFile), { recursive: true });

    // Initialise output file if new
    if (!existsSync(outputFile)) {
        await writeFile(outputFile, '', 'utf-8');
    }

    const words = (await readFile(wordsFile, 'utf-8'))
        .split('\n').map(w => w.trim()).filter(Boolean);

    let processing = !startWord;
    let processed = 0;
    let skipped = 0;

    for (const word of words) {
        if (!processing) {
            if (word === startWord) processing = true;
            else continue;
        }

        const letter = firstLetter(word);
        if (letterFilter && letter !== letterFilter) continue;

        if (skipExisting && !forceUpdate && await wordHasDefinitions(word)) {
            if (!quietSkip) console.log(`${word}: skipped`);
            skipped++;
            continue;
        }

        const url = `https://dle.rae.es/${encodeURIComponent(word)}`;
        const html = await fetchHTML(url);

        if (html) {
            const defs = parseDefinitions(html, levelTag);
            if (defs.length > 0) {
                const entry: CrawlEntry = {
                    word,
                    locale: 'es',
                    source: 'rae',
                    crawledAt: new Date().toISOString(),
                    definitions: defs,
                };
                if (levelTag) entry.level = levelTag;
                await appendFile(outputFile, JSON.stringify(entry) + '\n', 'utf-8');
                console.log(`${word}: ${defs.length} def(s)${levelTag ? ` [${levelTag}]` : ''}`);
            } else {
                console.log(`${word}: no definitions parsed`);
            }
        } else {
            console.log(`${word}: fetch failed`);
        }

        processed++;
        const delay = randomDelay(delayMin, delayMax);
        await sleep(delay);
    }

    console.log(`\nProcessed: ${processed}  Skipped: ${skipped}  Output: ${outputFile}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
