/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import LevelsConfig from '../../../config/LevelConfig';

// transformToJSON.ts dedups and collator-sorts <level>_words.txt, writes 100k-word chunks named
// <level>_words_from_<start>_to_<end>.json and records the word count and chunk count in
// config/LevelConfig.ts. The .txt itself is not kept in collator order, so the served words are
// compared with the transform of the source, not with the raw file order.
const ROOT = path.join(__dirname, '../../..');
const LOCALES = ['es', 'en'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const COLLATORS: Record<string, Intl.Collator> = {
    es: new Intl.Collator('es-ES', { sensitivity: 'base' }),
    en: new Intl.Collator('en-GB', { sensitivity: 'base' }),
};
const CHUNK_PATTERN = /^(\w+)_words_from_(\d+)_to_(\d+)\.json$/;

const readSourceWords = (locale: string, level: string): string[] =>
    [...new Set(
        fs.readFileSync(path.join(ROOT, 'ops/scripts/words', locale, `${level}_words.txt`), 'utf-8')
            .split('\n').map((w) => w.trim()).filter(Boolean),
    )].sort(COLLATORS[locale].compare);

const chunkFiles = (locale: string, level: string): string[] =>
    fs.readdirSync(path.join(ROOT, 'public/words', locale))
        .map((name) => ({ name, match: CHUNK_PATTERN.exec(name) }))
        .filter(({ match }) => match?.[1] === level)
        .sort((a, b) => Number(a.match![2]) - Number(b.match![2]))
        .map(({ name }) => name);

const readChunkWords = (locale: string, files: string[]): string[] =>
    files.flatMap((name) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/words', locale, name), 'utf-8')) as string[]);

describe.each(LOCALES)('word data sync (%s)', (locale) => {
    test.each(LEVELS)('%s: source list, served chunks and LevelConfig agree', (level) => {
        const files = chunkFiles(locale, level);
        const source = readSourceWords(locale, level);
        const served = readChunkWords(locale, files);
        const config = LevelsConfig.find((c) => c.level === level)!;

        expect(served.length).toBe(source.length);
        const firstMismatch = source.findIndex((word, i) => word !== served[i]);
        expect(firstMismatch === -1 ? null : { index: firstMismatch, source: source[firstMismatch], served: served[firstMismatch] }).toBeNull();
        expect(config.minimumPopulatedCount[locale]).toBe(source.length);
        expect(config.totalChunks[locale]).toBe(files.length);
    });
});
