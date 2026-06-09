/**
 * Validates words from a file (or stdin) against the advanced word list for a locale.
 * Words found in advanced but missing from the target level are appended to it.
 *
 * Usage:
 *   tsx scripts/words/checkWords.ts <locale> <targetLevel> [inputFile]
 *   tsx scripts/words/checkWords.ts es beginner new_words.txt
 *   cat words.txt | tsx scripts/words/checkWords.ts en intermediate
 */

import { readFile, appendFile } from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';

const ROOT = process.cwd();
const WORDS_SOURCE = path.join(ROOT, 'ops/scripts/words');

async function loadWordSet(filePath: string): Promise<Set<string>> {
    const content = await readFile(filePath, 'utf-8');
    return new Set(content.split('\n').map(w => w.trim()).filter(Boolean));
}

async function main(): Promise<void> {
    const [, , locale, targetLevel, inputFile] = process.argv;

    if (!locale || !targetLevel) {
        console.error('Usage: tsx scripts/words/checkWords.ts <locale> <targetLevel> [inputFile]');
        process.exit(1);
    }

    const advancedPath = path.join(WORDS_SOURCE, locale, 'advanced_words.txt');
    const targetPath = path.join(WORDS_SOURCE, locale, `${targetLevel}_words.txt`);

    const advancedWords = await loadWordSet(advancedPath);
    const targetWords = await loadWordSet(targetPath);

    const added: string[] = [];

    const processWord = async (word: string): Promise<void> => {
        const w = word.trim();
        if (!w) return;
        if (advancedWords.has(w) && !targetWords.has(w)) {
            await appendFile(targetPath, w + '\n');
            targetWords.add(w);
            added.push(w);
            console.log(`+ ${w}`);
        }
    };

    if (inputFile) {
        const content = await readFile(inputFile, 'utf-8');
        for (const word of content.split('\n')) {
            await processWord(word);
        }
    } else {
        const rl = readline.createInterface({ input: process.stdin, terminal: false });
        for await (const line of rl) {
            if (line.trim() === 'exit') break;
            await processWord(line);
        }
    }

    console.log(`\nAdded ${added.length} words to ${targetLevel}_words.txt`);
}

main().catch((err) => { console.error(err); process.exit(1); });
