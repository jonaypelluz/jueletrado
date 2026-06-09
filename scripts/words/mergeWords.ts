/**
 * Appends words from <source> that are not already in <target>.
 *
 * Usage:
 *   tsx scripts/words/mergeWords.ts <source.txt> <target.txt>
 */

import { readFile, appendFile } from 'fs/promises';

async function main(): Promise<void> {
    const [, , source, target] = process.argv;

    if (!source || !target) {
        console.error('Usage: tsx scripts/words/mergeWords.ts <source.txt> <target.txt>');
        process.exit(1);
    }

    const sourceWords = new Set(
        (await readFile(source, 'utf-8')).split('\n').map(w => w.trim()).filter(Boolean),
    );
    const targetWords = new Set(
        (await readFile(target, 'utf-8')).split('\n').map(w => w.trim()).filter(Boolean),
    );

    const toAdd = [...sourceWords].filter(w => !targetWords.has(w));

    if (toAdd.length === 0) {
        console.log('Nothing new to add.');
        return;
    }

    await appendFile(target, '\n' + toAdd.join('\n'));
    console.log(`Added ${toAdd.length} words to ${target}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
