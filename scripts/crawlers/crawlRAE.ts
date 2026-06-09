/**
 * Fetches ES definitions from rae-api.com (unofficial RAE API) and writes them
 * to per-letter JSONL staging files. Run mergeDefinitions.ts afterwards.
 *
 * Output: ops/crawl-output/es/{letter}.jsonl (one file per letter, no timestamp folder).
 * Appends to existing files so interrupted runs resume cleanly.
 *
 * Requires RAE_API_KEY in .env.local (never commit this file).
 * Free tier: 10 req/min, 100 req/day.
 *
 * Usage:
 *   tsx scripts/crawlers/crawlRAE.ts <wordsFile> [options]
 *
 * Options:
 *   --output-dir <dir>         JSONL output folder (default: ops/crawl-output/es)
 *   --start <word>             Resume from this word
 *   --letter <l>               Only process words starting with this letter
 *   --level <level>            Tag entries with this level (beginner|intermediate|advanced)
 *   --skip-existing            Skip words already in public/definitions/es/
 *   --force-update             Fetch even if word already exists in public/definitions/es/
 *   --delay <min>-<max>        Random delay in ms between requests (default: 7000-15000)
 *   --quiet-skip               Suppress per-word skip messages (shows total at end)
 *   --not-found-file <file>    Track words with no RAE entry (default: ops/crawl-output/es/not-found.txt)
 */

import { readFile, writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env') });
loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const ROOT = process.cwd();
const DEFINITIONS_DIR = path.join(ROOT, 'public/definitions/es');
const OUTPUT_DIR = path.join(ROOT, 'ops/crawl-output/es');
const RAE_API_BASE = 'https://rae-api.com/api/words';

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

interface RaeApiSense {
    meaning_number: number;
    category: string;
    gender?: string;
    usage?: string;
    description: string;
    usage_notes?: string[];
    synonyms?: string[];
    antonyms?: string[];
}

interface RaeApiMeaning {
    homonym_index: number;
    senses: RaeApiSense[];
}

interface RaeApiResponse {
    ok: boolean;
    data?: {
        word: string;
        meanings: RaeApiMeaning[];
    };
    error?: string;
    message?: string;
}

interface CrawlEntry {
    word: string;
    locale: 'es';
    level?: string;
    source: 'rae-api';
    crawledAt: string;
    definitions: Definition[];
}

type DefinitionsFile = Record<string, { definitions: Definition[] }>;

const existingCache = new Map<string, DefinitionsFile>();

function beautify(text: string): string {
    let t = text.trim().replace(/\s+/g, ' ').replace(/ ([,.:;)])/g, '$1').replace(/\( /g, '(');
    if (!t.endsWith('.')) t += '.';
    return t;
}

function formatDefinitions(meanings: RaeApiMeaning[], level?: string): Definition[] {
    const defs: Definition[] = [];
    let num = 1;

    for (const meaning of meanings) {
        for (const sense of meaning.senses) {
            if (!sense.description) continue;

            const def: Definition = {
                number: String(num++),
                type: sense.category ?? '',
                definition: beautify(sense.description),
            };

            if (level) def.level = level;
            if (sense.usage) def.type_extra = sense.usage;

            const extra: DefinitionExtra[] = [];
            if (sense.synonyms?.length) extra.push({ type: 'Sinónimos', content: sense.synonyms.join(', ') + '.' });
            if (sense.antonyms?.length) extra.push({ type: 'Antónimos', content: sense.antonyms.join(', ') + '.' });
            if (extra.length > 0) def.definition_extra = extra;

            defs.push(def);
        }
    }

    return defs;
}

interface FetchResult {
    status: number;
    data: RaeApiResponse | null;
    dailyLimitExceeded: boolean;
}

async function fetchWord(word: string, apiKey?: string): Promise<FetchResult> {
    const url = `${RAE_API_BASE}/${encodeURIComponent(word)}${apiKey ? `?api_key=${apiKey}` : ''}`;
    try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) {
            let body: RaeApiResponse | null = null;
            try { body = await res.json() as RaeApiResponse; } catch { /* ignore */ }
            const msg = (body?.message ?? body?.error ?? '').toLowerCase();
            const dailyLimitExceeded = res.status === 403 ||
                (res.status === 429 && (msg.includes('daily') || msg.includes('quota') || msg.includes('exceeded')));
            return { status: res.status, data: body, dailyLimitExceeded };
        }
        return { status: res.status, data: await res.json() as RaeApiResponse, dailyLimitExceeded: false };
    } catch {
        return { status: 0, data: null, dailyLimitExceeded: false };
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
        console.error(`Invalid --delay value "${raw}". Expected: <min>-<max> in ms, e.g. 7000-15000`);
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

    const apiKey = process.env.RAE_API_KEY;
    if (!apiKey) {
        console.warn('Warning: RAE_API_KEY not set in .env.local — using anonymous tier (100 req/day)');
    } else {
        console.log('RAE API key loaded.');
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
        : { min: 7000, max: 15000 };

    const notFoundIdx = flags.indexOf('--not-found-file');
    const notFoundFile = notFoundIdx !== -1
        ? flags[notFoundIdx + 1]
        : path.join(ROOT, 'ops/crawl-output/es/not-found.txt');

    await mkdir(outputDir, { recursive: true });
    await mkdir(path.dirname(notFoundFile), { recursive: true });

    const notFoundWords = new Set<string>();
    if (existsSync(notFoundFile)) {
        const lines = (await readFile(notFoundFile, 'utf-8')).split('\n').filter(Boolean);
        for (const l of lines) notFoundWords.add(l.trim());
        console.log(`Loaded ${notFoundWords.size} known not-found words from ${notFoundFile}`);
    }

    // Track which letter files have been initialised this run (avoid stat per word)
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

        const letter = firstLetter(word);
        if (letterFilter && letter !== letterFilter) continue;

        if (notFoundWords.has(word)) {
            if (!quietSkip) console.log(`${word}: skipped (not found)`);
            skipped++;
            continue;
        }

        if (skipExisting && !forceUpdate && await wordHasDefinitions(word)) {
            if (!quietSkip) console.log(`${word}: skipped`);
            skipped++;
            continue;
        }

        const { status, data, dailyLimitExceeded } = await fetchWord(word, apiKey);

        if (dailyLimitExceeded) {
            console.error(`\nRAE API daily limit reached. Stopping — resume tomorrow or upgrade plan.\n`);
            process.exit(2);
        }

        if (data?.ok && data.data) {
            const defs = formatDefinitions(data.data.meanings, levelTag);
            if (defs.length > 0) {
                const entry: CrawlEntry = {
                    word,
                    locale: 'es',
                    source: 'rae-api',
                    crawledAt: new Date().toISOString(),
                    definitions: defs,
                };
                if (levelTag) entry.level = levelTag;
                const out = await letterFile(letter);
                await appendFile(out, JSON.stringify(entry) + '\n', 'utf-8');
                console.log(`${word}: ${defs.length} def(s)${levelTag ? ` [${levelTag}]` : ''}`);
            } else {
                await appendFile(notFoundFile, word + '\n', 'utf-8');
                notFoundWords.add(word);
                console.log(`${word}: no definitions (added to not-found)`);
                notFound++;
            }
        } else if (status === 404 || data?.error === 'NOT_FOUND') {
            await appendFile(notFoundFile, word + '\n', 'utf-8');
            notFoundWords.add(word);
            if (!quietSkip) console.log(`${word}: not found (added to not-found)`);
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
