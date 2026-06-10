/**
 * Fetches EN definitions from api.dictionaryapi.dev and writes them to per-letter
 * JSONL staging files. Run mergeDefinitions.ts afterwards.
 *
 * Output: ops/crawl-output/en/{letter}.jsonl (one file per letter, no timestamp folder).
 * Appends to existing files so interrupted runs resume cleanly.
 *
 * Usage:
 *   tsx scripts/crawlers/crawlDictionary.ts <wordsFile> [options]
 *
 * Options:
 *   --output-dir <dir>    JSONL output folder (default: ops/crawl-output/en)
 *   --start <word>        Resume from this word
 *   --letter <l>          Only process words starting with this letter
 *   --level <level>       Tag entries with this level (beginner|intermediate|advanced)
 *   --skip-existing       Skip words already in public/definitions/en/
 *   --force-update        Fetch even if word already exists in public/definitions/en/
 *   --delay <min>-<max>   Random delay range in ms between requests (default: 3000-10000)
 *   --quiet-skip          Suppress per-word skip messages (shows total at end)
 *   --not-found-file <f>  Track words with no entry (default: ops/crawl-output/en/not-found.txt)
 */

import { readFile, writeFile, appendFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const DEFINITIONS_DIR = path.join(ROOT, 'public/definitions/en');
const OUTPUT_DIR = path.join(ROOT, 'ops/crawl-output/en');

interface ApiDefinition {
    definition: string;
    synonyms?: string[];
    antonyms?: string[];
}

interface ApiMeaning {
    partOfSpeech: string;
    definitions: ApiDefinition[];
}

interface ApiResponse {
    word: string;
    meanings: ApiMeaning[];
}

interface DefinitionExtra {
    type: string;
    content: string;
}

interface Definition {
    number: number;
    type: string;
    definition: string;
    level?: string;
    type_extra?: string;
    definition_extra?: DefinitionExtra[];
}

interface CrawlEntry {
    word: string;
    locale: 'en';
    level?: string;
    source: 'dictionaryapi';
    crawledAt: string;
    definitions: Definition[];
}

type DefinitionsFile = Record<string, { definitions: Definition[] }>;

const existingCache = new Map<string, DefinitionsFile>();

function beautify(text: string): string {
    let t = text.trim().replace(/\s+/g, ' ').replace(/ ([,.:;)])/g, '$1');
    if (!t.endsWith('.')) t += '.';
    return t;
}

function formatDefinitions(meanings: ApiMeaning[], level?: string): Definition[] {
    const defs: Definition[] = [];
    let num = 1;

    for (const meaning of meanings) {
        for (const d of meaning.definitions) {
            const def: Definition = {
                number: num++,
                type: meaning.partOfSpeech,
                definition: beautify(d.definition),
            };

            const extra: DefinitionExtra[] = [];
            if (d.synonyms?.length) extra.push({ type: 'Synonyms', content: d.synonyms.join(', ') + '.' });
            if (d.antonyms?.length) extra.push({ type: 'Antonyms', content: d.antonyms.join(', ') + '.' });
            if (extra.length > 0) def.definition_extra = extra;

            defs.push(def);
        }
    }

    return defs;
}

interface FetchResult {
    status: number;
    data: ApiResponse[] | null;
}

async function fetchDefinitions(word: string): Promise<FetchResult> {
    try {
        const res = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                },
            },
        );
        if (!res.ok) return { status: res.status, data: null };
        return { status: res.status, data: await res.json() as ApiResponse[] };
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
        console.error(`Invalid --delay value "${raw}". Expected format: <min>-<max> in ms, e.g. 3000-10000`);
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
        console.error('Usage: tsx scripts/crawlers/crawlDictionary.ts <wordsFile> [options]');
        process.exit(1);
    }

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
        : { min: 3000, max: 10000 };

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
        console.log(`Loaded ${notFoundWords.size} known not-found words from ${notFoundFile}`);
    }

    // Words already written to any JSONL in this outputDir (previous interrupted runs)
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
                } catch { /* skip malformed lines */ }
            }
        }
        if (alreadyCrawled.size > 0) {
            console.log(`Loaded ${alreadyCrawled.size} already-crawled words from JSONL output.`);
        }
    } catch { /* outputDir doesn't exist yet — fine */ }

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

        if (notFoundWords.has(word)) {
            if (!quietSkip) console.log(`${word}: skipped (not found)`);
            skipped++;
            continue;
        }

        if (!forceUpdate && alreadyCrawled.has(word)) {
            if (!quietSkip) console.log(`${word}: skipped (already in JSONL)`);
            skipped++;
            continue;
        }

        if (skipExisting && !forceUpdate && await wordHasDefinitions(word)) {
            if (!quietSkip) console.log(`${word}: skipped`);
            skipped++;
            continue;
        }

        const { status, data } = await fetchDefinitions(word);

        if (data) {
            const defs = formatDefinitions(data.flatMap(e => e.meanings), levelTag);
            if (defs.length > 0) {
                const entry: CrawlEntry = {
                    word,
                    locale: 'en',
                    source: 'dictionaryapi',
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
                console.log(`${word}: no definitions parsed (added to not-found)`);
                notFound++;
            }
        } else if (status === 404) {
            await appendFile(notFoundFile, word + '\n', 'utf-8');
            notFoundWords.add(word);
            console.log(`${word}: 404 (added to not-found)`);
            notFound++;
        } else if (status === 429) {
            console.warn(`${word}: 429 rate limited — waiting 60s`);
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
    console.log(`Output dir: ${outputDir}`);
    console.log(`Not-found list: ${notFoundFile}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
