import 'core-js/stable/structured-clone';
import { IDBCursor, IDBIndex, IDBObjectStore } from 'fake-indexeddb';
import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
import { getFullWordSet, getWordRecords, getWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { resetLevelRows, setLevelRows } from '../../fixtures/levelConfigMock';
import { storeLevel } from '../../fixtures/storeLevel';
import { plainRecord } from '../../fixtures/wordRecords';

// Real dbService on fake-indexeddb (tests/settings/env-setup.ts); each level serves exactly the rows
// a test stored with storeLevel (minimumPopulatedCount), as the real config serves the chunk rows.
jest.mock('@config/LevelConfig', () => require('../../fixtures/levelConfigMock').levelConfigModule);

const BEGINNER = ['sol', 'casa', 'perro', 'mariposa'].map((word) => plainRecord(word));
const ADVANCED_ONLY = plainRecord('mesa', { level: 'advanced', levels: ['advanced'] });
const INTERMEDIATE = plainRecord('gobierno', { level: 'intermediate', levels: ['intermediate'] });

const seed = async () => {
    await storeLevel('es', 'beginner', BEGINNER);
    await storeLevel('es', 'intermediate', [INTERMEDIATE]);
    await storeLevel('es', 'advanced', [ADVANCED_ONLY]);
    await storeLevel('en', 'beginner', [plainRecord('house', { locale: 'en' })]);
    StorageService.setItem(StorageService.LEVELS_POPULATED, {
        es: { beginner: true, intermediate: true, advanced: true },
        en: { beginner: true, intermediate: true, advanced: true },
    });
};

beforeEach(async () => {
    await dbService.deleteDatabase();
    localStorage.clear();
    resetLevelRows();
    jest.spyOn(Logger, 'log').mockImplementation(() => {});
    jest.spyOn(Logger, 'info').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('getWords(query)', () => {
    test('returns every word of the level that matches, when there are fewer matches than count', async () => {
        await seed();
        const setError = jest.fn();

        const words = await getWords({ locale: 'es', level: 'beginner', count: 10, minLen: 4, maxLen: 5 }, setError);

        // mesa (4 letters) is advanced only; sol and mariposa are outside the window.
        expect([...words].sort()).toEqual(['casa', 'perro']);
        expect(setError).not.toHaveBeenCalled();
    });

    test('returns exactly count distinct matching words when there are more matches', async () => {
        const many = Array.from({ length: 30 }, (_, i) => plainRecord(`pal${String(i).padStart(2, '0')}`));
        await storeLevel('es', 'beginner', many);
        StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });

        const words = await getWords({ locale: 'es', level: 'beginner', count: 7, minLen: 5 });

        expect(words).toHaveLength(7);
        expect(new Set(words).size).toBe(7);
        words.forEach((word) => expect(many.map((r) => r.word)).toContain(word));
    });

    test('an invalid level reports "Invalid level specified" and returns no words', async () => {
        jest.spyOn(Logger, 'error').mockImplementation(() => {});
        const setError = jest.fn();

        const words = await getWords({ locale: 'es', level: 'expert', count: 5 }, setError);

        expect(words).toEqual([]);
        expect(setError).toHaveBeenCalledWith(new Error('Invalid level specified'));
    });
});

describe('getWords(query) on a database failure', () => {
    test('reports the error through setError and returns no words', async () => {
        await seed();
        const failure = new Error('IndexedDB read failed');
        jest.spyOn(IDBObjectStore.prototype, 'get').mockImplementation(() => {
            throw failure;
        });
        jest.spyOn(Logger, 'error').mockImplementation(() => {});
        const setError = jest.fn();

        const words = await getWords({ locale: 'es', level: 'beginner', count: 5 }, setError);

        expect(words).toEqual([]);
        expect(setError).toHaveBeenCalledWith(failure);
    });
});

describe('getWordRecords', () => {
    test('returns the stored records in input order and drops unknown words', async () => {
        await seed();

        const records = await getWordRecords(['perro', 'zzz', 'casa'], 'es');

        expect(records.map((r) => r.word)).toEqual(['perro', 'casa']);
        expect(records[0]).toEqual(BEGINNER[2]);
    });
});

describe('getFullWordSet', () => {
    test('is the union of every level of the locale', async () => {
        await seed();

        const words = await getFullWordSet('es');

        expect(words).toEqual(new Set(['sol', 'casa', 'perro', 'mariposa', 'mesa', 'gobierno']));
    });
});

describe('getFullWordSet cache', () => {
    test('returns the same set until the store changes, then a set with the new word', async () => {
        await seed();

        const first = await getFullWordSet('es');
        expect(await getFullWordSet('es')).toBe(first);

        await storeLevel('es', 'beginner', [plainRecord('ventana')], BEGINNER.length);

        const after = await getFullWordSet('es');
        expect(after).not.toBe(first);
        expect(after.has('ventana')).toBe(true);
    });
});

describe('getWords(query) draw cost', () => {
    // A level of N served rows, one in ten matching (no hasTl): a draw reads O(count / matchRate) entries.
    const N = 6000;
    const level = Array.from({ length: N }, (_, i) => plainRecord(`pal${String(i).padStart(4, '0')}`, { hasTl: i % 10 === 0 ? 0 : 1 }));

    beforeEach(async () => {
        await storeLevel('es', 'beginner', level);
        StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });
    });

    test('a level draw never walks a cursor nor reads every key or value of the level, and reads far fewer than N entries', async () => {
        const walks = [
            ...(['openCursor', 'openKeyCursor', 'getAll', 'getAllKeys'] as const).flatMap((method) => [jest.spyOn(IDBObjectStore.prototype, method), jest.spyOn(IDBIndex.prototype, method)]),
            jest.spyOn(IDBIndex.prototype, 'count'),
            jest.spyOn(IDBCursor.prototype, 'advance'),
            jest.spyOn(IDBCursor.prototype, 'continue'),
        ];
        const count = jest.spyOn(IDBObjectStore.prototype, 'count');
        const gets = [jest.spyOn(IDBObjectStore.prototype, 'get'), jest.spyOn(IDBIndex.prototype, 'get')];

        const words = await getWords({ locale: 'es', level: 'beginner', count: 20, exclude: { hasTl: true } });

        expect(words).toHaveLength(20);
        expect(new Set(words).size).toBe(20);
        walks.forEach((spy) => expect(spy).not.toHaveBeenCalled());
        // A count of one exact key is a lookup; a count of a range or of the whole store is a walk.
        count.mock.calls.forEach(([query]) => expect(Array.isArray(query)).toBe(true));
        // ~200 positions for 20 matches, read in batches: a few hundred gets, never a pass over the level.
        expect(gets.reduce((total, spy) => total + spy.mock.calls.length, 0)).toBeLessThan(N / 4);
    });
});

describe('getWords(query) on a large level with few matches', () => {
    test('uses up every position across batches and returns exactly the matching words', async () => {
        const matching = [5, 500, 999];
        const level = Array.from({ length: 1000 }, (_, i) => plainRecord(`pal${String(i).padStart(4, '0')}`, { hasTl: matching.includes(i) ? 0 : 1 }));
        await storeLevel('es', 'beginner', level);
        StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });

        const words = await getWords({ locale: 'es', level: 'beginner', count: 10, exclude: { hasTl: true } });

        expect([...words].sort()).toEqual(['pal0005', 'pal0500', 'pal0999']);
    });
});

describe('getWords(query) on a level with more stored positions than it serves', () => {
    test('draws only from the served positions [0, minimumPopulatedCount)', async () => {
        const level = ['uno', 'dos', 'tres', 'cuatro', 'cinco'].map((word) => plainRecord(word));
        await storeLevel('es', 'beginner', level);
        setLevelRows('es', 'beginner', 3);
        StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });

        const drawn = new Set<string>();
        for (let i = 0; i < 50; i++) (await getWords({ locale: 'es', level: 'beginner', count: 2 })).forEach((word) => drawn.add(word));

        // A sampler over all 5 positions leaks cuatro or cinco with probability 1 - 0.3^50.
        expect([...drawn].sort()).toEqual(['dos', 'tres', 'uno']);
    });
});

describe('getWords(query) uniformity', () => {
    test('draws reach every part of the level, not only its first positions', async () => {
        const level = Array.from({ length: 300 }, (_, i) => plainRecord(`pal${String(i).padStart(3, '0')}`));
        await storeLevel('es', 'beginner', level);
        StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });
        const tail = new Set(level.slice(256).map((record) => record.word));

        const drawn = new Set<string>();
        for (let i = 0; i < 20; i++) (await getWords({ locale: 'es', level: 'beginner', count: 10 })).forEach((word) => drawn.add(word));

        // 200 uniform draws over 300 words: ~146 distinct words, ~29 of them from the last 44 positions.
        expect(drawn.size).toBeGreaterThan(100);
        expect([...drawn].some((word) => tail.has(word))).toBe(true);
    });

    test('a draw does not take a run of neighbouring positions', async () => {
        const level = Array.from({ length: 300 }, (_, i) => plainRecord(`pal${String(i).padStart(3, '0')}`));
        await storeLevel('es', 'beginner', level);
        StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });

        let adjacentPairs = 0;
        for (let i = 0; i < 20; i++) {
            const positions = new Set((await getWords({ locale: 'es', level: 'beginner', count: 10 })).map((word) => Number(word.slice(3))));
            positions.forEach((position) => {
                if (positions.has(position + 1)) adjacentPairs++;
            });
        }

        // Uniform: 45 pairs per draw, each adjacent with p = 2/300, so ~6 over 20 draws (P(≥ 40) < 1e-15).
        // A window of 10 consecutive positions gives 9 per draw, 180 in all.
        expect(adjacentPairs).toBeLessThan(40);
    });
});
