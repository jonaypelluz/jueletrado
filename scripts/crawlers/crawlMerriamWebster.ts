/**
 * Fetches EN definitions from Merriam-Webster Collegiate Dictionary API and writes
 * them to per-letter JSONL staging files. Run mergeDefinitions.ts afterwards.
 *
 * Second-pass crawler: runs after crawlDictionary.ts to cover words that returned 404
 * from dictionaryapi.dev. By default reads ops/crawl-output/en/not-found.txt.
 *
 * Output: ops/crawl-output/en/{letter}.jsonl (appends to existing files).
 *
 * Usage:
 *   tsx scripts/crawlers/crawlMerriamWebster.ts [wordsFile] [options]
 *
 * Defaults (no args needed):
 *   wordsFile  = ops/crawl-output/en/not-found.txt
 *   delay      = 500-1500 ms
 *
 * Options:
 *   --output-dir <dir>    JSONL output folder (default: ops/crawl-output/en)
 *   --start <word>        Resume from this word
 *   --letter <l>          Only process words starting with this letter
 *   --level <level>       Tag entries with this level (beginner|intermediate|advanced)
 *   --skip-existing       Skip words already in public/definitions/en/
 *   --force-update        Fetch even if word already exists in public/definitions/en/
 *   --delay <min>-<max>   Random delay range in ms (default: 500-1500)
 *   --quiet-skip          Suppress per-word skip messages
 *   --not-found-file <f>  Track words still not found (default: ops/crawl-output/en/not-found.txt)
 */

import { readFile, writeFile, appendFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ROOT = process.cwd();
const DEFINITIONS_DIR = path.join(ROOT, 'public/definitions/en');
const OUTPUT_DIR = path.join(ROOT, 'ops/crawl-output/en');

const MW_API_KEY = process.env.MW_API_KEY;
if (!MW_API_KEY) {
    console.error('MW_API_KEY not set in .env.local');
    process.exit(1);
}

interface MWDefinition {
    number: number;
    type: string;
    definition: string;
    level?: string;
    definition_extra?: { type: string; content: string }[];
}

interface CrawlEntry {
    word: string;
    locale: 'en';
    level?: string;
    source: 'merriam-webster';
    crawledAt: string;
    definitions: MWDefinition[];
}

type DefinitionsFile = Record<string, { definitions: MWDefinition[] }>;

const existingCache = new Map<string, DefinitionsFile>();

function beautify(text: string): string {
    let t = text.trim().replace(/\s+/g, ' ').replace(/ ([,.:;)])/g, '$1');
    if (!t.endsWith('.')) t += '.';
    return t;
}

// MW API returns definitions in a complex nested structure — extract plain text defs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractDefs(entries: any[], levelTag?: string): MWDefinition[] {
    const defs: MWDefinition[] = [];
    let num = 1;

    for (const entry of entries) {
        if (typeof entry !== 'object' || !entry.fl || !entry.def) continue;
        const partOfSpeech: string = entry.fl;

        for (const defBlock of entry.def ?? []) {
            for (const sseq of defBlock.sseq ?? []) {
                for (const sense of sseq) {
                    if (!Array.isArray(sense) || sense[0] !== 'sense') continue;
                    const senseData = sense[1];
                    const dtArr = senseData?.dt;
                    if (!dtArr) continue;

                    const textParts: string[] = [];
                    const synonyms: string[] = [];

                    for (const dt of dtArr) {
                        if (dt[0] === 'text') {
                            // Strip MW markup: {bc}, {it}, {/it}, {sx|word||}, etc.
                            const raw: string = dt[1] ?? '';
                            const clean = raw
                                .replace(/\{bc\}/g, '')
                                .replace(/\{[^}]*\|([^|]*)\|[^}]*\}/g, '$1')
                                .replace(/\{[^}]+\}/g, '')
                                .trim();
                            if (clean) textParts.push(clean);
                        } else if (dt[0] === 'syns') {
                            const synList = dt[1]?.pt ?? [];
                            for (const pt of synList) {
                                if (pt[0] === 'text') {
                                    const raw: string = pt[1] ?? '';
                                    const clean = raw
                                        .replace(/\{[^}]*\|([^|]*)\|[^}]*\}/g, '$1')
                                        .replace(/\{[^}]+\}/g, '')
                                        .replace(/^[:\s]+/, '')
                                        .trim();
                                    if (clean) synonyms.push(clean);
                                }
                            }
                        }
                    }

                    const text = textParts.join(' ').trim();
                    if (!text) continue;

                    const def: MWDefinition = {
                        number: num++,
                        type: partOfSpeech,
                        definition: beautify(text),
                    };
                    if (levelTag) def.level = levelTag;
                    if (synonyms.length) {
                        def.definition_extra = [{ type: 'Synonyms', content: synonyms.join(', ') + '.' }];
                    }
                    defs.push(def);
                }
            }
        }
    }

    return defs;
}

interface FetchResult {
    status: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[] | null;
}

async function fetchDefinitions(word: string): Promise<FetchResult> {
    try {
        const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(word)}?key=${MW_API_KEY}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'jueletrado-wordgame/1.0' },
        });
        if (!res.ok) return { status: res.status, data: null };
        const data = await res.json();
        // If suggestions returned instead of entries, treat as not found
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
            return { status: 404, data: null };
        }
        return { status: 200, data: data as unknown[] };
    } catch {
        return { status: 0, data: null };
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
    const letter = word[0]?.toLowerCase() ?? 'a';
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
        console.error(`Invalid --delay "${raw}". Expected: <min>-<max> ms, e.g. 1000-3000`);
        process.exit(1);
    }
    return { min, max };
}

function randomDelay(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

async function main(): Promise<void> {
    const [, , firstArg, ...rest] = process.argv;

    // firstArg is optional wordsFile; if it starts with '--' it's a flag, not a file
    const wordsFile = firstArg && !firstArg.startsWith('--')
        ? firstArg
        : path.join(ROOT, 'ops/crawl-output/en/not-found.txt');
    const flags = firstArg && !firstArg.startsWith('--') ? rest : [firstArg, ...rest].filter(Boolean);

    const startIdx = flags.indexOf('--start');
    const startWord = startIdx !== -1 ? flags[startIdx + 1] : null;

    const letterIdx = flags.indexOf('--letter');
    const letterFilter = letterIdx !== -1 ? flags[letterIdx + 1]?.toLowerCase() : null;

    const levelIdx = flags.indexOf('--level');
    const levelTag = levelIdx !== -1 ? flags[levelIdx + 1] : undefined;

    const outputDirIdx = flags.indexOf('--output-dir');
    const outputDir = outputDirIdx !== -1 ? flags[outputDirIdx + 1] : OUTPUT_DIR;

    const skipExisting = flags.includes('--skip-existing');
    const forceUpdate = flags.includes('--force-update');
    const quietSkip = flags.includes('--quiet-skip');

    const delayIdx = flags.indexOf('--delay');
    const { min: delayMin, max: delayMax } = delayIdx !== -1
        ? parseDelayFlag(flags[delayIdx + 1] ?? '')
        : { min: 500, max: 1500 };

    const notFoundIdx = flags.indexOf('--not-found-file');
    const notFoundFile = notFoundIdx !== -1
        ? flags[notFoundIdx + 1]
        : path.join(ROOT, 'ops/crawl-output/en/not-found.txt');

    await mkdir(outputDir, { recursive: true });
    await mkdir(path.dirname(notFoundFile), { recursive: true });

    const notFoundWords = new Set<string>();
    if (existsSync(notFoundFile)) {
        const lines = (await readFile(notFoundFile, 'utf-8')).split('\n').filter(Boolean);
        for (const l of lines) notFoundWords.add(l.trim());
        console.log(`Loaded ${notFoundWords.size} known not-found words`);
    }

    const alreadyCrawled = new Set<string>();
    try {
        const existing = (await readdir(outputDir)).filter(f => f.endsWith('.jsonl'));
        for (const file of existing) {
            const content = await readFile(path.join(outputDir, file), 'utf-8');
            for (const line of content.split('\n')) {
                if (!line.trim()) continue;
                try {
                    const entry = JSON.parse(line) as { word?: string };
                    if (entry.word) alreadyCrawled.add(entry.word);
                } catch { /* skip malformed */ }
            }
        }
        if (alreadyCrawled.size > 0) console.log(`${alreadyCrawled.size} already-crawled words loaded`);
    } catch { /* outputDir doesn't exist yet */ }

    const initialisedLetters = new Set<string>();
    async function letterFile(letter: string): Promise<string> {
        const file = path.join(outputDir, `${letter}.jsonl`);
        if (!initialisedLetters.has(letter)) {
            if (!existsSync(file)) await writeFile(file, '', 'utf-8');
            initialisedLetters.add(letter);
        }
        return file;
    }

    const words = (await readFile(wordsFile, 'utf-8'))
        .split('\n').map(w => w.trim()).filter(Boolean);

    let processing = !startWord;
    let processed = 0;
    let skipped = 0;
    let notFound = 0;
    let errors = 0;

    for (const word of words) {
        if (!processing) {
            if (word === startWord) processing = true;
            else continue;
        }

        const letter = word[0]?.toLowerCase() ?? 'a';
        if (letterFilter && letter !== letterFilter) continue;

        if (!forceUpdate && alreadyCrawled.has(word)) {
            if (!quietSkip) console.log(`${word}: skipped (already crawled)`);
            skipped++;
            continue;
        }

        if (skipExisting && !forceUpdate && await wordHasDefinitions(word)) {
            if (!quietSkip) console.log(`${word}: skipped (has definitions)`);
            skipped++;
            continue;
        }

        const { status, data } = await fetchDefinitions(word);

        if (data && data.length > 0) {
            const defs = extractDefs(data, levelTag);
            if (defs.length > 0) {
                const entry: CrawlEntry = {
                    word,
                    locale: 'en',
                    source: 'merriam-webster',
                    crawledAt: new Date().toISOString(),
                    definitions: defs,
                };
                if (levelTag) entry.level = levelTag;
                const out = await letterFile(letter);
                await appendFile(out, JSON.stringify(entry) + '\n', 'utf-8');
                alreadyCrawled.add(word);
                console.log(`${word}: ${defs.length} def(s)${levelTag ? ` [${levelTag}]` : ''}`);
            } else {
                await appendFile(notFoundFile, word + '\n', 'utf-8');
                notFoundWords.add(word);
                console.log(`${word}: no definitions parsed`);
                notFound++;
            }
        } else if (status === 404 || status === 200) {
            // 200 with suggestion strings = not found
            await appendFile(notFoundFile, word + '\n', 'utf-8');
            notFoundWords.add(word);
            console.log(`${word}: not found`);
            notFound++;
        } else if (status === 429 || status === 503) {
            console.warn(`${word}: rate limited (${status}) — waiting 60s`);
            await sleep(60000);
            errors++;
            continue;
        } else {
            console.log(`${word}: HTTP ${status || 'network error'}`);
            errors++;
        }

        processed++;
        await sleep(randomDelay(delayMin, delayMax));
    }

    console.log(`\nProcessed: ${processed}  Skipped: ${skipped}  Not found: ${notFound}  Errors: ${errors}`);
    console.log(`Output: ${outputDir}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
