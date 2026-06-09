/**
 * Removes invalid entries from word files in-place.
 *
 * A valid word contains only letters (including accented/ñ for ES).
 * Rejects: apostrophes, hyphens, numbers, spaces, dots, or any non-letter char.
 * Also deduplicates and lowercases.
 *
 * Usage:
 *   tsx scripts/words/cleanWords.ts                        — all locales + levels
 *   tsx scripts/words/cleanWords.ts es                     — all ES levels
 *   tsx scripts/words/cleanWords.ts es beginner            — ES beginner only
 *   tsx scripts/words/cleanWords.ts es beginner --dry-run  — report without writing
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const WORDS_SOURCE = path.join(ROOT, 'ops/scripts/words');
const LOCALES = ['es', 'en'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
type Locale = (typeof LOCALES)[number];
type Level = (typeof LEVELS)[number];

// Letters allowed per locale (unicode property \p{L} covers all letters)
const VALID_RE: Record<Locale, RegExp> = {
    es: /^[\p{L}]+$/u,
    en: /^[a-zA-Z]+$/,
};

function parseArgs(): { locale: Locale | null; level: Level | null; dryRun: boolean } {
    const args = process.argv.slice(2).filter(a => a !== '--dry-run');
    const dryRun = process.argv.includes('--dry-run');
    const locale = (args[0] as Locale) ?? null;
    const level = (args[1] as Level) ?? null;
    return { locale, level, dryRun };
}

async function cleanFile(locale: Locale, level: Level, dryRun: boolean): Promise<void> {
    const filePath = path.join(WORDS_SOURCE, locale, `${level}_words.txt`);
    if (!existsSync(filePath)) {
        console.log(`  skip: ${filePath} not found`);
        return;
    }

    const raw = (await readFile(filePath, 'utf-8')).split('\n').map(w => w.trim());
    const re = VALID_RE[locale];

    const seen = new Set<string>();
    const valid: string[] = [];
    const removed: string[] = [];

    for (const word of raw) {
        if (!word) continue;
        const lower = word.toLowerCase();
        if (!re.test(lower)) {
            removed.push(word);
        } else if (!seen.has(lower)) {
            seen.add(lower);
            valid.push(lower);
        }
    }

    const removedCount = removed.length;
    const dupCount = raw.filter(Boolean).length - removedCount - valid.length;

    console.log(`  ${locale}/${level}: ${raw.filter(Boolean).length} → ${valid.length} words  (removed: ${removedCount} invalid, ${dupCount} dups)`);
    if (removed.length > 0) {
        console.log(`    examples: ${removed.slice(0, 8).join(', ')}`);
    }

    if (!dryRun) {
        await writeFile(filePath, valid.join('\n') + '\n', 'utf-8');
    }
}

async function main(): Promise<void> {
    const { locale, level, dryRun } = parseArgs();

    if (dryRun) console.log('Dry run — no files will be written.\n');

    const localesToProcess = locale ? [locale] : [...LOCALES];
    const levelsToProcess = level ? [level] : [...LEVELS];

    for (const loc of localesToProcess) {
        console.log(`\n[${loc}]`);
        for (const lvl of levelsToProcess) {
            await cleanFile(loc, lvl, dryRun);
        }
    }

    if (dryRun) {
        console.log('\nDry run done. Run without --dry-run to apply.');
    } else {
        console.log('\nDone. Run `npm run words:transform` to regenerate JSON chunks.');
    }
}

main().catch((err) => { console.error(err); process.exit(1); });
