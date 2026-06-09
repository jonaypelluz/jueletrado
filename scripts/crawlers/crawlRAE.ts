/**
 * Crawls dle.rae.es for each word in a file and writes definitions to
 * public/definitions/es/{letter}_definitions.json.
 *
 * Usage:
 *   tsx scripts/crawlers/crawlRAE.ts <wordsFile> [--start <word>]
 *   tsx scripts/crawlers/crawlRAE.ts ops/scripts/words/es/beginner_words.txt
 *   tsx scripts/crawlers/crawlRAE.ts ops/scripts/words/es/beginner_words.txt --start abeja
 */

import { parse as parseHTML } from 'node-html-parser';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const DEFINITIONS_DIR = path.join(ROOT, 'public/definitions/es');

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
    type_extra?: string;
    definition: string;
    definition_extra?: DefinitionExtra[];
}

type DefinitionsFile = Record<string, { definitions: Definition[] }>;

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

function parseDefinitions(html: string): Definition[] {
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

async function updateDefinitionsFile(word: string, definitions: Definition[]): Promise<void> {
    if (definitions.length === 0) return;

    const letter = firstLetter(word);
    const filePath = path.join(DEFINITIONS_DIR, `${letter}_definitions.json`);

    await mkdir(DEFINITIONS_DIR, { recursive: true });

    let data: DefinitionsFile = {};
    if (existsSync(filePath)) {
        data = JSON.parse(await readFile(filePath, 'utf-8')) as DefinitionsFile;
    }

    if (!data[word]) data[word] = { definitions: [] };

    for (const def of definitions) {
        const existing = data[word].definitions.find(d => d.number === def.number);
        if (!existing) {
            data[word].definitions.push(def);
        } else {
            Object.assign(existing, def);
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
        console.error('Usage: tsx scripts/crawlers/crawlRAE.ts <wordsFile> [--start <word>]');
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

        const url = `https://dle.rae.es/${encodeURIComponent(word)}`;
        const html = await fetchHTML(url);

        if (html) {
            const defs = parseDefinitions(html);
            await updateDefinitionsFile(word, defs);
            console.log(`${word}: ${defs.length} def(s)`);
        } else {
            console.log(`${word}: fetch failed`);
        }

        processed++;
        await sleep(1000 + Math.random() * 2000);
    }

    console.log(`\nProcessed ${processed} words.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
