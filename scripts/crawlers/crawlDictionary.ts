/**
 * Fetches EN definitions from api.dictionaryapi.dev and writes them to
 * public/definitions/en/{letter}_definitions.json.
 *
 * Usage:
 *   tsx scripts/crawlers/crawlDictionary.ts <wordsFile> [--start <word>]
 *   tsx scripts/crawlers/crawlDictionary.ts ops/scripts/words/en/beginner_words.txt
 *   tsx scripts/crawlers/crawlDictionary.ts ops/scripts/words/en/beginner_words.txt --start apple
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
    type_extra?: string;
    definition_extra?: DefinitionExtra[];
}

type DefinitionsFile = Record<string, { definitions: Definition[] }>;

function beautify(text: string): string {
    let t = text.trim().replace(/\s+/g, ' ').replace(/ ([,.:;)])/g, '$1');
    if (!t.endsWith('.')) t += '.';
    return t;
}

function formatDefinitions(meanings: ApiMeaning[]): Definition[] {
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

async function updateDefinitionsFile(word: string, definitions: Definition[]): Promise<void> {
    if (definitions.length === 0) return;

    const letter = word[0]?.toLowerCase() ?? 'a';
    const filePath = path.join(DEFINITIONS_DIR, `${letter}_definitions.json`);

    await mkdir(DEFINITIONS_DIR, { recursive: true });

    let data: DefinitionsFile = {};
    if (existsSync(filePath)) {
        data = JSON.parse(await readFile(filePath, 'utf-8')) as DefinitionsFile;
    }

    data[word] = { definitions };
    await writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
    const [, , wordsFile, ...flags] = process.argv;

    if (!wordsFile) {
        console.error('Usage: tsx scripts/crawlers/crawlDictionary.ts <wordsFile> [--start <word>]');
        process.exit(1);
    }

    const startIdx = flags.indexOf('--start');
    const startWord = startIdx !== -1 ? flags[startIdx + 1] : null;

    const words = (await readFile(wordsFile, 'utf-8'))
        .split('\n').map(w => w.trim()).filter(Boolean);

    let processing = !startWord;
    let processed = 0;

    for (const word of words) {
        if (!processing) {
            if (word === startWord) processing = true;
            else continue;
        }

        const data = await fetchDefinitions(word);

        if (data) {
            const defs = formatDefinitions(data.flatMap(e => e.meanings));
            await updateDefinitionsFile(word, defs);
            console.log(`${word}: ${defs.length} def(s)`);
        } else {
            console.log(`${word}: not found`);
        }

        processed++;
        await sleep(1000 + Math.random() * 4000);
    }

    console.log(`\nProcessed ${processed} words.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
