/**
 * Validates EN words against api.dictionaryapi.dev.
 * Words that return HTTP 200 are written to the output file (resumable).
 *
 * Usage:
 *   tsx scripts/crawlers/checkDictionary.ts <inputFile> [--output <file>]
 *   tsx scripts/crawlers/checkDictionary.ts my_words.txt --output valid_words.txt
 */

import { readFile, appendFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

async function checkWord(word: string): Promise<boolean> {
    try {
        const res = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } },
        );
        return res.status === 200;
    } catch {
        return false;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
    const [, , inputFile, ...flags] = process.argv;

    if (!inputFile) {
        console.error('Usage: tsx scripts/crawlers/checkDictionary.ts <inputFile> [--output <file>]');
        process.exit(1);
    }

    const outIdx = flags.indexOf('--output');
    const outputFile = outIdx !== -1 ? flags[outIdx + 1] : 'ops/scripts/dictionaryApiCrawler/output.txt';

    const words = (await readFile(inputFile, 'utf-8'))
        .split('\n').map(w => w.trim()).filter(Boolean);

    // Resume from last written word
    let lastProcessed: string | null = null;
    if (existsSync(outputFile)) {
        const lines = (await readFile(outputFile, 'utf-8')).split('\n').filter(Boolean);
        lastProcessed = lines.at(-1) ?? null;
        if (lastProcessed) console.log(`Resuming after "${lastProcessed}"`);
    } else {
        await writeFile(outputFile, '', 'utf-8');
    }

    let processing = !lastProcessed;
    let checked = 0;
    let valid = 0;

    for (const word of words) {
        if (!processing) {
            if (word === lastProcessed) processing = true;
            continue;
        }

        const found = await checkWord(word);
        checked++;

        if (found) {
            await appendFile(outputFile, word + '\n');
            valid++;
            console.log(`✓ ${word}`);
        } else {
            console.log(`✗ ${word}`);
        }

        await sleep(1000 + Math.random() * 9000);
    }

    console.log(`\nChecked: ${checked}  Valid: ${valid}  Written to: ${outputFile}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
