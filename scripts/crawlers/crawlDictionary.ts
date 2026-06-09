/**
 * Fetches EN definitions from api.dictionaryapi.dev and writes them to
 * public/definitions/en/{letter}_definitions.json.
 *
 * Usage:
 *   tsx scripts/crawlers/crawlDictionary.ts <wordsFile> [options]
 *
 * Options:
 *   --start <word>        Resume from this word
 *   --letter <l>          Only process words starting with this letter
 *   --level <level>       Tag each definition with this level (beginner|intermediate|advanced)
 *   --skip-existing       Skip words that already have definitions in the output file
 *   --force-update        Re-fetch and overwrite definitions for words that already exist
 *
 * Examples:
 *   tsx scripts/crawlers/crawlDictionary.ts ops/scripts/words/en/beginner_words.txt --level beginner
 *   tsx scripts/crawlers/crawlDictionary.ts ops/scripts/words/en/intermediate_words.txt --letter j --level intermediate
 *   tsx scripts/crawlers/crawlDictionary.ts ops/scripts/words/en/beginner_words.txt --skip-existing --level beginner
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const DEFINITIONS_DIR = path.join(ROOT, 'public/definitions/en');

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

type DefinitionsFile = Record<string, { definitions: Definition[] }>;

const fileCache = new Map<string, DefinitionsFile>();

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

async function loadFile(filePath: string): Promise<DefinitionsFile> {
    if (fileCache.has(filePath)) return fileCache.get(filePath)!;
    if (!existsSync(filePath)) {
        fileCache.set(filePath, {});
        return {};
    }
    const data = JSON.parse(await readFile(filePath, 'utf-8')) as DefinitionsFile;
    fileCache.set(filePath, data);
    return data;
}

async function wordHasDefinitions(word: string): Promise<boolean> {
    const letter = word[0]?.toLowerCase() ?? 'a';
    const filePath = path.join(DEFINITIONS_DIR, `${letter}_definitions.json`);
    const data = await loadFile(filePath);
    return Boolean(data[word]);
}

async function updateDefinitionsFile(word: string, definitions: Definition[]): Promise<void> {
    if (definitions.length === 0) return;

    const letter = word[0]?.toLowerCase() ?? 'a';
    const filePath = path.join(DEFINITIONS_DIR, `${letter}_definitions.json`);

    await mkdir(DEFINITIONS_DIR, { recursive: true });

    const data = await loadFile(filePath);

    if (!data[word]) {
        data[word] = { definitions };
    } else {
        for (const def of definitions) {
            const existing = data[word].definitions.find(d => d.number === def.number);
            if (!existing) {
                data[word].definitions.push(def);
            } else {
                Object.assign(existing, def);
            }
        }
    }

    await writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
    const [, , wordsFile, ...flags] = process.argv;

    if (!wordsFile) {
        console.error('Usage: tsx scripts/crawlers/crawlDictionary.ts <wordsFile> [--start <word>] [--letter <l>] [--level <level>] [--skip-existing] [--force-update]');
        process.exit(1);
    }

    const startIdx = flags.indexOf('--start');
    const startWord = startIdx !== -1 ? flags[startIdx + 1] : null;

    const letterIdx = flags.indexOf('--letter');
    const letterFilter = letterIdx !== -1 ? flags[letterIdx + 1]?.toLowerCase() : null;

    const levelIdx = flags.indexOf('--level');
    const levelTag = levelIdx !== -1 ? flags[levelIdx + 1] : undefined;

    const skipExisting = flags.includes('--skip-existing');
    const forceUpdate = flags.includes('--force-update');

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
            await updateDefinitionsFile(word, defs);
            console.log(`${word}: ${defs.length} def(s)${levelTag ? ` [${levelTag}]` : ''}`);
        } else {
            console.log(`${word}: not found`);
        }

        processed++;
        await sleep(1000 + Math.random() * 4000);
    }

    console.log(`\nProcessed: ${processed}  Skipped: ${skipped}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
