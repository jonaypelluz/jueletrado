/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import LevelsConfig from '../../../config/LevelConfig';

// buildWordData.ts (yarn words:build) dedups and collator-sorts <level>_words.txt, writes v2
// chunks named <level>_<n>.json (n from 1, rows [word, freqRank, levels, …]) and records the row
// count and chunk count in config/LevelConfig.ts. The .txt itself is not kept in collator order,
// so the served words are compared with the sorted source, not with the raw file order.
const ROOT = path.join(__dirname, '../../..');
const LOCALES = ['es', 'en'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const CHUNK_SIZE = 100000;
const LEVEL_BIT: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 4 };
const COLLATORS: Record<string, Intl.Collator> = {
    es: new Intl.Collator('es-ES', { sensitivity: 'base' }),
    en: new Intl.Collator('en-GB', { sensitivity: 'base' }),
};

type Chunk = { version: number; fields: string[]; rows: (string | number | null)[][] };

const readSourceWords = (locale: string, level: string): string[] =>
    [...new Set(
        fs.readFileSync(path.join(ROOT, 'ops/scripts/words', locale, `${level}_words.txt`), 'utf-8')
            .split('\n').map((w) => w.trim()).filter(Boolean),
    )].sort(COLLATORS[locale].compare);

const levelFiles = (locale: string, level: string): string[] =>
    fs.readdirSync(path.join(ROOT, 'public/words', locale)).filter((name) => name.startsWith(`${level}_`));

const readChunks = (locale: string, files: string[]): Chunk[] =>
    files.map((name) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/words', locale, name), 'utf-8')) as Chunk);

describe.each(LOCALES)('word data sync (%s)', (locale) => {
    test.each(LEVELS)('%s: source list, served chunks and LevelConfig agree', (level) => {
        const config = LevelsConfig.find((c) => c.level === level)!;
        const files = levelFiles(locale, level);
        const expectedFiles = Array.from({ length: config.totalChunks[locale] }, (_, i) => `${level}_${i + 1}.json`);
        expect([...files].sort()).toEqual([...expectedFiles].sort());

        const chunks = readChunks(locale, expectedFiles);
        chunks.forEach((chunk) => expect(chunk.version).toBe(2));
        // Only the last chunk of a level may be partial.
        expect(chunks.map((chunk) => chunk.rows.length <= CHUNK_SIZE)).toEqual(chunks.map(() => true));
        expect(chunks.slice(0, -1).map((chunk) => chunk.rows.length)).toEqual(chunks.slice(0, -1).map(() => CHUNK_SIZE));
        const levelsField = chunks[0].fields.indexOf('levels');
        const rows = chunks.flatMap((chunk) => chunk.rows);
        const served = rows.map((row) => row[0] as string);
        const source = readSourceWords(locale, level);

        expect(served.length).toBe(source.length);
        const firstMismatch = source.findIndex((word, i) => word !== served[i]);
        expect(firstMismatch === -1 ? null : { index: firstMismatch, source: source[firstMismatch], served: served[firstMismatch] }).toBeNull();
        expect(rows.filter((row) => ((row[levelsField] as number) & LEVEL_BIT[level]) === 0).map((row) => row[0])).toEqual([]);
        expect(config.minimumPopulatedCount[locale]).toBe(source.length);
    });
});
