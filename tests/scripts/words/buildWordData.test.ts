/**
 * @jest-environment node
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { buildLocale, runCli } from '../../../scripts/words/buildWordData';

// Fixture tree: the audit fixture lists + definitions, plus wordfreq_<locale>.txt ranking
// casa (1), mesa (2), acción (3). mesa is only in the advanced list, so its rank makes it a
// beginner word (an override); madrid is unranked and in the beginner and advanced lists.
const FIXTURE_ROOT = path.join(__dirname, '../../fixtures/words');
const LEVEL_CONFIG = path.join(__dirname, '../../../config/LevelConfig.ts');
const FIELDS = ['word', 'freqRank', 'levels', 'flags', 'syllables', 'stressedSyllable', 'pos', 'senseCount', 'source'];
const ES_COLLATOR = new Intl.Collator('es-ES', { sensitivity: 'base' });
const EN_COLLATOR = new Intl.Collator('en-GB', { sensitivity: 'base' });

type Chunk = { version: number; locale: string; level: string; fields: string[]; rows: (string | number | null)[][] };

let root: string;

const wordsDir = (locale: string) => path.join(root, 'public/words', locale);
const readChunk = (locale: string, name: string): Chunk => JSON.parse(fs.readFileSync(path.join(wordsDir(locale), name), 'utf-8'));
const sourceList = (level: string, locale = 'es'): string[] =>
    fs.readFileSync(path.join(root, 'ops/scripts/words', locale, `${level}_words.txt`), 'utf-8').split('\n').map((w) => w.trim()).filter(Boolean);
const levelConfig = () => fs.readFileSync(path.join(root, 'config/LevelConfig.ts'), 'utf-8');
/** `<field>: { en: N, es: M }` of one level block in LevelConfig.ts. */
const configValue = (level: string, field: string, locale: string): number => {
    const block = levelConfig().split(`level: '${level}'`)[1];
    return Number(new RegExp(`${field}: \\{[^}]*?${locale}: (\\d+)`).exec(block)![1]);
};
const snapshotDir = (dir: string): Record<string, string> =>
    Object.fromEntries(fs.readdirSync(dir).sort().map((name) => [name, fs.readFileSync(path.join(dir, name), 'utf-8')]));

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'words-build-'));
    fs.cpSync(FIXTURE_ROOT, root, { recursive: true });
    fs.mkdirSync(path.join(root, 'config'), { recursive: true });
    fs.copyFileSync(LEVEL_CONFIG, path.join(root, 'config/LevelConfig.ts'));
    fs.mkdirSync(wordsDir('es'), { recursive: true });
    fs.mkdirSync(wordsDir('en'), { recursive: true });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
});

describe('buildLocale', () => {
    test('writes one v2 chunk per level, rows in collator order', async () => {
        await buildLocale(root, 'es');

        expect(fs.readdirSync(wordsDir('es')).sort()).toEqual(['advanced_1.json', 'beginner_1.json', 'intermediate_1.json']);
        const intermediate = readChunk('es', 'intermediate_1.json');
        expect(intermediate).toEqual(expect.objectContaining({ version: 2, locale: 'es', level: 'intermediate', fields: FIELDS }));
        expect(intermediate.rows.map((row) => row[0])).toEqual([...new Set(sourceList('intermediate'))].sort(ES_COLLATOR.compare));
    });

    test('a ranked word whose list disagrees is reported and served only in its frequency band', async () => {
        const report = await buildLocale(root, 'es');

        expect(report.overrides).toEqual([{ word: 'mesa', lists: ['advanced'], level: 'beginner' }]);
        const beginnerWords = readChunk('es', 'beginner_1.json').rows.map((row) => row[0]);
        expect(beginnerWords).toEqual([...new Set([...sourceList('beginner'), 'mesa'])].sort(ES_COLLATOR.compare));
        expect(readChunk('es', 'advanced_1.json').rows.map((row) => row[0])).toEqual(['madrid']);
    });

    test('an unranked word in two lists gets the identical row, with both level bits, in each level file', async () => {
        await buildLocale(root, 'es');

        const rowOf = (name: string) => readChunk('es', name).rows.find((row) => row[0] === 'madrid');
        const beginnerRow = rowOf('beginner_1.json');
        expect(beginnerRow).toEqual(rowOf('advanced_1.json'));
        expect(beginnerRow?.[FIELDS.indexOf('levels')]).toBe(1 | 4);
    });

    test('reads the senses of an accented word from its base-letter definition file', async () => {
        await buildLocale(root, 'es');

        const árbol = readChunk('es', 'beginner_1.json').rows.find((row) => row[0] === 'árbol')!;
        expect(árbol[FIELDS.indexOf('senseCount')]).toBe(1);
        expect(árbol[FIELDS.indexOf('source')]).toBe('rae');
    });

    test('`constructor` in a list is served with no senses and no pos (no Object.prototype lookup)', async () => {
        fs.appendFileSync(path.join(root, 'ops/scripts/words/es/advanced_words.txt'), 'constructor\n');

        await buildLocale(root, 'es');

        const row = readChunk('es', 'advanced_1.json').rows.find((r) => r[0] === 'constructor')!;
        expect(row[FIELDS.indexOf('senseCount')] ?? 0).toBe(0);
        expect(row[FIELDS.indexOf('pos')] ?? null).toBeNull();
    });

    test('en rows follow en-GB order, take their rank from wordfreq_en.txt and have no source', async () => {
        await buildLocale(root, 'en');

        const rows = readChunk('en', 'beginner_1.json').rows;
        expect(rows.map((row) => row[0])).toEqual([...new Set(sourceList('beginner', 'en'))].sort(EN_COLLATOR.compare));
        expect(rows.find((row) => row[0] === 'cat')?.[FIELDS.indexOf('freqRank')]).toBe(1);
        expect(rows.map((row) => row[FIELDS.indexOf('source')] ?? null)).toEqual(rows.map(() => null));
    });

    test('reports a definition key that is in no list and does not serve it', async () => {
        const report = await buildLocale(root, 'es');

        expect(report.orphanDefinitions).toEqual(['perro']);
        const served = fs.readdirSync(wordsDir('es')).flatMap((name) => readChunk('es', name).rows.map((row) => row[0]));
        expect(served).not.toContain('perro');
    });

    test('deletes stale legacy and orphan chunk files', async () => {
        fs.writeFileSync(path.join(wordsDir('es'), 'beginner_words_from_1_to_100000.json'), '[]');
        fs.writeFileSync(path.join(wordsDir('es'), 'advanced_9.json'), '{}');

        await buildLocale(root, 'es');

        expect(fs.readdirSync(wordsDir('es')).sort()).toEqual(['advanced_1.json', 'beginner_1.json', 'intermediate_1.json']);
    });

    test('a rebuild is byte-identical', async () => {
        await buildLocale(root, 'es');
        const first = { words: snapshotDir(wordsDir('es')), config: levelConfig() };

        await buildLocale(root, 'es');

        expect({ words: snapshotDir(wordsDir('es')), config: levelConfig() }).toEqual(first);
    });
});

describe('runCli', () => {
    test('--locale es rewrites the es LevelConfig counts from the chunks and leaves en untouched', async () => {
        const enBefore = ['beginner', 'intermediate', 'advanced'].flatMap((level) =>
            ['minimumPopulatedCount', 'totalChunks'].map((field) => configValue(level, field, 'en')),
        );

        await expect(runCli(['--locale', 'es', '--root', root])).resolves.toBe(0);

        // minimumPopulatedCount = rows served for the level (what the IndexedDB levels index counts).
        expect(configValue('beginner', 'minimumPopulatedCount', 'es')).toBe(readChunk('es', 'beginner_1.json').rows.length);
        expect(configValue('intermediate', 'minimumPopulatedCount', 'es')).toBe(4);
        expect(configValue('advanced', 'minimumPopulatedCount', 'es')).toBe(1);
        expect(configValue('advanced', 'totalChunks', 'es')).toBe(1);
        expect(
            ['beginner', 'intermediate', 'advanced'].flatMap((level) =>
                ['minimumPopulatedCount', 'totalChunks'].map((field) => configValue(level, field, 'en')),
            ),
        ).toEqual(enBefore);
        expect(fs.readdirSync(wordsDir('en'))).toEqual([]);
    });

    test('exits 2 on an unknown flag', async () => {
        await expect(runCli(['--bogus'])).resolves.toBe(2);
    });

    test('exits 1 when a source list is missing', async () => {
        fs.rmSync(path.join(root, 'ops/scripts/words/es/beginner_words.txt'));

        await expect(runCli(['--locale', 'es', '--root', root])).resolves.toBe(1);
    });

    test('exits 1 when the frequency file is missing', async () => {
        fs.rmSync(path.join(root, 'ops/scripts/frequency/wordfreq_es.txt'));

        await expect(runCli(['--locale', 'es', '--root', root])).resolves.toBe(1);
    });
});
