/**
 * Re-classifies words from all levels of a locale into beginner/intermediate/advanced
 * based on a frequency corpus file.
 *
 * Frequency file format: one word per line, ordered most-frequent first (rank = line index).
 * OR a two-column TSV: `word\tfrequency` (higher frequency = more common).
 *
 * Thresholds (by rank, 1 = most common):
 *   beginner:     rank 1 – BEGINNER_LIMIT
 *   intermediate: rank BEGINNER_LIMIT+1 – INTERMEDIATE_LIMIT
 *   advanced:     rank INTERMEDIATE_LIMIT+1 and beyond (or "not in corpus")
 *
 * Words not found in the corpus are left in their current level (no-op).
 * Pass --move-unknown to push them to advanced instead.
 *
 * Usage:
 *   tsx scripts/words/sortByFrequency.ts <locale> <frequencyFile> [options]
 *
 *   Options:
 *     --beginner-limit <n>      default: 3000
 *     --intermediate-limit <n>  default: 10000
 *     --move-unknown            move words not in corpus to advanced
 *     --dry-run                 print counts without writing files
 *
 * Example:
 *   tsx scripts/words/sortByFrequency.ts es ops/scripts/frequency/crea_es.txt
 *   tsx scripts/words/sortByFrequency.ts en ops/scripts/frequency/subtlex_en.tsv --beginner-limit 2000
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const WORDS_SOURCE = path.join(ROOT, 'ops/scripts/words');
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
type Level = (typeof LEVELS)[number];

function parseArgs(): {
    locale: string;
    freqFile: string;
    beginnerLimit: number;
    intermediateLimit: number;
    moveUnknown: boolean;
    dryRun: boolean;
} {
    const args = process.argv.slice(2);
    const locale = args[0];
    const freqFile = args[1];

    if (!locale || !freqFile) {
        console.error(
            'Usage: tsx scripts/words/sortByFrequency.ts <locale> <frequencyFile> [options]',
        );
        process.exit(1);
    }

    const idx = (flag: string) => args.indexOf(flag);
    const numArg = (flag: string, def: number) => {
        const i = idx(flag);
        return i !== -1 ? parseInt(args[i + 1], 10) : def;
    };

    return {
        locale,
        freqFile,
        beginnerLimit: numArg('--beginner-limit', 3000),
        intermediateLimit: numArg('--intermediate-limit', 10000),
        moveUnknown: args.includes('--move-unknown'),
        dryRun: args.includes('--dry-run'),
    };
}

async function loadFrequencyMap(freqFile: string): Promise<Map<string, number>> {
    const content = await readFile(freqFile, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const map = new Map<string, number>();

    for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(/\t/);
        const word = parts[0].toLowerCase().trim();
        if (word) map.set(word, i + 1);
    }

    return map;
}

async function loadWords(locale: string, level: Level): Promise<string[]> {
    const filePath = path.join(WORDS_SOURCE, locale, `${level}_words.txt`);
    if (!existsSync(filePath)) return [];
    const content = await readFile(filePath, 'utf-8');
    return content.split('\n').map(w => w.trim()).filter(Boolean);
}

async function saveWords(locale: string, level: Level, words: string[], dryRun: boolean): Promise<void> {
    const filePath = path.join(WORDS_SOURCE, locale, `${level}_words.txt`);
    if (dryRun) return;
    await writeFile(filePath, words.join('\n') + '\n', 'utf-8');
}

function classifyWord(
    word: string,
    freqMap: Map<string, number>,
    beginnerLimit: number,
    intermediateLimit: number,
    moveUnknown: boolean,
    currentLevel: Level,
): Level {
    const rank = freqMap.get(word.toLowerCase());

    if (rank === undefined) {
        return moveUnknown ? 'advanced' : currentLevel;
    }

    if (rank <= beginnerLimit) return 'beginner';
    if (rank <= intermediateLimit) return 'intermediate';
    return 'advanced';
}

async function main(): Promise<void> {
    const { locale, freqFile, beginnerLimit, intermediateLimit, moveUnknown, dryRun } = parseArgs();

    if (!existsSync(freqFile)) {
        console.error(`Frequency file not found: ${freqFile}`);
        process.exit(1);
    }

    console.log(`Loading frequency corpus: ${freqFile}`);
    const freqMap = await loadFrequencyMap(freqFile);
    console.log(`Loaded ${freqMap.size} frequency entries`);
    console.log(`Thresholds — beginner: ≤${beginnerLimit}, intermediate: ≤${intermediateLimit}`);

    const buckets: Record<Level, string[]> = { beginner: [], intermediate: [], advanced: [] };
    const stats: Record<Level, Record<Level | 'unknown', number>> = {
        beginner:     { beginner: 0, intermediate: 0, advanced: 0, unknown: 0 },
        intermediate: { beginner: 0, intermediate: 0, advanced: 0, unknown: 0 },
        advanced:     { beginner: 0, intermediate: 0, advanced: 0, unknown: 0 },
    };

    for (const level of LEVELS) {
        const words = await loadWords(locale, level);
        console.log(`\n${level}: ${words.length} words`);

        for (const word of words) {
            const rank = freqMap.get(word.toLowerCase());
            const newLevel = classifyWord(word, freqMap, beginnerLimit, intermediateLimit, moveUnknown, level);
            buckets[newLevel].push(word);
            if (rank === undefined) stats[level].unknown++;
            else stats[level][newLevel]++;
        }
    }

    console.log('\n--- Reclassification summary ---');
    for (const level of LEVELS) {
        const s = stats[level];
        console.log(
            `${level}: beginner→${s.beginner} intermediate→${s.intermediate} advanced→${s.advanced} unknown(kept)→${s.unknown}`,
        );
    }

    console.log('\n--- New bucket sizes ---');
    for (const level of LEVELS) {
        console.log(`${level}: ${buckets[level].length} words`);
    }

    if (dryRun) {
        console.log('\nDry run — no files written.');
        return;
    }

    for (const level of LEVELS) {
        await saveWords(locale, level, buckets[level], false);
        console.log(`Written: ${level}_words.txt (${buckets[level].length} words)`);
    }

    console.log('\nDone. Run `npm run words:transform` to regenerate JSON chunks.');
}

main().catch((err) => { console.error(err); process.exit(1); });
