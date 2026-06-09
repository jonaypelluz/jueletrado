/**
 * Fetches EN definitions from api.dictionaryapi.dev and writes them to a JSONL
 * staging file. Run mergeDefinitions.ts afterwards to incorporate into public/.
 *
 * Usage:
 *   tsx scripts/crawlers/crawlDictionary.ts <wordsFile> [options]
 *
 * Options:
 *   --output <file>       JSONL output path (default: ops/crawl-output/en/{timestamp}.jsonl)
 *   --start <word>        Resume from this word (appends to --output file)
 *   --letter <l>          Only process words starting with this letter
 *   --level <level>       Tag entries with this level (beginner|intermediate|advanced)
 *   --skip-existing       Skip words already in public/definitions/en/
 *   --force-update        Fetch even if word already exists in public/definitions/en/
 *
 * Examples:
 *   tsx scripts/crawlers/crawlDictionary.ts ops/scripts/words/en/beginner_words.txt --level beginner
 *   tsx scripts/crawlers/crawlDictionary.ts ops/scripts/words/en/beginner_words.txt --letter j --level beginner
 *   tsx scripts/crawlers/crawlDictionary.ts ops/scripts/words/en/beginner_words.txt --skip-existing --level beginner
 *   tsx scripts/crawlers/crawlDictionary.ts ops/scripts/words/en/beginner_words.txt --start apple --output ops/crawl-output/en/my-run.jsonl
 */

import { readFile, writeFile, appendFile, mkdir } from 'fs/promises';
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

            if (level) def.level = level;

            const extra: DefinitionExtra[] = [];
            if (d.synonyms?.length) extra.push({ type: 'Synonyms', content: d.synonyms.join(', ') + '.' });
            if (d.antonyms?.length) extra.push({ type: 'Antonyms', content: d.antonyms.join(', ') + '.' });
            if (extra.length > 0) def.definition_extra = extra;

            defs.push(def);
        }
    }

    return defs;
}

async function fetchDefinitions(word: string): Promise<ApiResponse[] | null> {
    try {
        const res = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } },
        );
        if (!res.ok) return null;
        return await res.json() as ApiResponse[];
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
    const letter = word[0]?.toLowerCase() ?? 'a';
    const data = await loadExistingFile(letter);
    return Boolean(data[word]);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

    const outputIdx = flags.indexOf('--output');
    const outputFile = outputIdx !== -1
        ? flags[outputIdx + 1]
        : path.join(OUTPUT_DIR, `${Date.now()}.jsonl`);

    const skipExisting = flags.includes('--skip-existing');
    const forceUpdate = flags.includes('--force-update');

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

        if (letterFilter && word[0]?.toLowerCase() !== letterFilter) continue;

        if (skipExisting && !forceUpdate && await wordHasDefinitions(word)) {
            console.log(`${word}: skipped`);
            skipped++;
            continue;
        }

        const data = await fetchDefinitions(word);

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
                await appendFile(outputFile, JSON.stringify(entry) + '\n', 'utf-8');
                console.log(`${word}: ${defs.length} def(s)${levelTag ? ` [${levelTag}]` : ''}`);
            } else {
                console.log(`${word}: no definitions parsed`);
            }
        } else {
            console.log(`${word}: not found`);
        }

        processed++;
        await sleep(1000 + Math.random() * 4000);
    }

    console.log(`\nProcessed: ${processed}  Skipped: ${skipped}  Output: ${outputFile}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
