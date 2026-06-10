/**
 * Orchestrates the "learn words from a book" pipeline:
 * 1. extractFromBook.ts  — find new words, append to discovered_words.txt
 * 2. mergeWords.ts        — append discovered words into advanced_words.txt
 * 3. sortByFrequency.ts   — reclassify all levels using the frequency corpus
 *
 * Usage:
 *   tsx scripts/words/fromBook.ts <es|en> <bookFile>
 */

import { spawnSync } from 'child_process';
import * as path from 'path';

const ROOT = process.cwd();

function run(args: string[]): boolean {
    const result = spawnSync('tsx', args, { stdio: 'inherit', cwd: ROOT });
    return result.status === 0;
}

function main(): void {
    const [, , locale, bookFile] = process.argv;

    if (!locale || !bookFile) {
        console.error('Usage: tsx scripts/words/fromBook.ts <es|en> <bookFile>');
        process.exit(1);
    }

    const discoveredFile = path.join(ROOT, 'ops/crawl-output', locale, 'discovered_words.txt');
    const advancedFile = path.join(ROOT, 'ops/scripts/words', locale, 'advanced_words.txt');
    const freqFile = path.join(ROOT, 'ops/scripts/frequency', `wordfreq_${locale}.txt`);

    if (!run([path.join(ROOT, 'scripts/words/extractFromBook.ts'), locale, bookFile])) process.exit(1);
    if (!run([path.join(ROOT, 'scripts/words/mergeWords.ts'), discoveredFile, advancedFile])) process.exit(1);
    if (!run([path.join(ROOT, 'scripts/words/sortByFrequency.ts'), locale, freqFile])) process.exit(1);

    console.log('\nDone. Run `yarn words:transform` to regenerate JSON chunks.');
}

main();
