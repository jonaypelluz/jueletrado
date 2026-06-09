/**
 * Reads ops/scripts/words/{locale}/{level}_words.txt,
 * sorts + deduplicates, writes 100k-chunk JSON arrays to public/words/{locale}/,
 * and updates config/LevelConfig.ts (totalChunks + minimumPopulatedCount).
 *
 * Usage:
 *   tsx scripts/words/transformToJSON.ts            — all locales + levels
 *   tsx scripts/words/transformToJSON.ts es          — all ES levels
 *   tsx scripts/words/transformToJSON.ts es beginner — ES beginner only
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const WORDS_SOURCE = path.join(ROOT, 'ops/scripts/words');
const WORDS_OUTPUT = path.join(ROOT, 'public/words');
const LEVEL_CONFIG = path.join(ROOT, 'config/LevelConfig.ts');
const CHUNK_SIZE = 100_000;

const LOCALES = ['es', 'en'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

const COLLATORS: Record<string, Intl.Collator> = {
    es: new Intl.Collator('es-ES', { sensitivity: 'base' }),
    en: new Intl.Collator('en-GB', { sensitivity: 'base' }),
};

async function transformLevel(locale: string, level: string): Promise<{ count: number; chunks: number } | null> {
    const inputPath = path.join(WORDS_SOURCE, locale, `${level}_words.txt`);
    if (!existsSync(inputPath)) {
        console.log(`  skip ${locale}/${level} — not found`);
        return null;
    }

    console.log(`\nProcessing ${locale}/${level}...`);
    const content = await readFile(inputPath, 'utf-8');

    const words = [...new Set(
        content.split('\n').map(w => w.trim()).filter(Boolean),
    )].sort(COLLATORS[locale].compare);

    const outputDir = path.join(WORDS_OUTPUT, locale);
    await mkdir(outputDir, { recursive: true });

    const totalChunks = Math.ceil(words.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE + 1;
        const end = (i + 1) * CHUNK_SIZE;
        const chunk = words.slice(i * CHUNK_SIZE, end);
        const filename = `${level}_words_from_${start}_to_${end}.json`;
        const outputPath = path.join(outputDir, filename);
        await writeFile(outputPath, JSON.stringify(chunk), 'utf-8');
        console.log(`  ${filename} (${chunk.length} words)`);
    }

    return { count: words.length, chunks: totalChunks };
}

async function updateLevelConfig(locale: string, level: string, count: number, chunks: number): Promise<void> {
    let config = await readFile(LEVEL_CONFIG, 'utf-8');

    config = config.replace(
        new RegExp(`(level: '${level}'[\\s\\S]*?totalChunks: \\{[^}]*?${locale}: )\\d+`),
        `$1${chunks}`,
    );
    config = config.replace(
        new RegExp(`(level: '${level}'[\\s\\S]*?minimumPopulatedCount: \\{[^}]*?${locale}: )\\d+`),
        `$1${count}`,
    );

    await writeFile(LEVEL_CONFIG, config, 'utf-8');
    console.log(`  LevelConfig.ts updated: ${level}.${locale} → totalChunks=${chunks}, count=${count}`);
}

async function main(): Promise<void> {
    const [, , filterLocale, filterLevel] = process.argv;

    const locales = filterLocale ? [filterLocale] : LOCALES;
    const levels = filterLevel ? [filterLevel] : LEVELS;

    for (const locale of locales) {
        for (const level of levels) {
            const result = await transformLevel(locale, level);
            if (result) {
                await updateLevelConfig(locale, level, result.count, result.chunks);
            }
        }
    }

    console.log('\nDone.');
}

main().catch((err) => { console.error(err); process.exit(1); });
