import 'core-js/stable/structured-clone';
import { waitFor } from '@testing-library/react';
import { WORD_GROUP_FETCH_CONFIG } from '@config/WordGroupConfig';
import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
import {
    clearWordGroupCaches,
    getSessionWords,
    isLevelPopulated,
    loadDailyWordForLocale,
    prefetchWordGroups,
} from '@services/WordsService';
import StorageService from '@store/StorageService';
import { resetLevelRows } from '../../fixtures/levelConfigMock';
import { storeLevel } from '../../fixtures/storeLevel';
import { plainRecord } from '../../fixtures/wordRecords';

// Real dbService on the fake-indexeddb global (tests/settings/env-setup.ts), seeded with records;
// each level serves exactly the rows stored with storeLevel, so the seeded level counts as populated.
jest.mock('@config/LevelConfig', () => require('../../fixtures/levelConfigMock').levelConfigModule);

const FINDER_QUERY = { locale: 'es', level: 'beginner', count: 60, minLen: 4, maxLen: 9 };
const inFinderWindow = (word: string) => word.length >= 4 && word.length <= 9;

/** Beginner records of 3 to 10 letters, marked as a populated level. */
const SEEDED = ['sol', 'casa', 'perro', 'camino', 'ventana', 'caramelo', 'mariposa', 'chocolate', 'computador'];
const seedBeginner = async () => {
    await storeLevel('es', 'beginner', SEEDED.map((word) => plainRecord(word)));
    StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });
};

describe('WordsService session operations tests', () => {
    beforeEach(async () => {
        await dbService.deleteDatabase();
        resetLevelRows();
        jest.spyOn(Logger, 'log').mockImplementation(() => {});
        jest.spyOn(Logger, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        localStorage.clear();
    });

    // ─────────────────────────────────────────────────────────
    // clearWordGroupCaches
    // ─────────────────────────────────────────────────────────
    describe('clearWordGroupCaches', () => {
        test('removes word group keys but leaves locale and levels-populated intact', () => {
            // Populate several keys in real localStorage via StorageService
            StorageService.setItem(StorageService.WORDS_DAILY, ['wordA']);
            StorageService.setItem(StorageService.WORDS_FINDER, ['wordB']);
            StorageService.setItem(StorageService.WORDS_TOWER, ['wordC']);
            StorageService.setItem(StorageService.WORDS_RAIN, ['wordD']);
            StorageService.setItem(StorageService.WORDS_SYLLABLE, ['wordE']);
            StorageService.setItem(StorageService.LOCALE, 'es');
            StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });

            clearWordGroupCaches();

            expect(StorageService.getItem(StorageService.WORDS_DAILY)).toBeNull();
            expect(StorageService.getItem(StorageService.WORDS_FINDER)).toBeNull();
            expect(StorageService.getItem(StorageService.WORDS_TOWER)).toBeNull();
            expect(StorageService.getItem(StorageService.WORDS_RAIN)).toBeNull();
            expect(StorageService.getItem(StorageService.WORDS_SYLLABLE)).toBeNull();
            // These should still have values
            expect(StorageService.getItem(StorageService.LOCALE)).toBe('es');
            expect(StorageService.getItem(StorageService.LEVELS_POPULATED)).toEqual({
                es: { beginner: true },
            });
        });

        test('keeps the wordChain best scores', () => {
            const bestKey = StorageService.WORD_CHAIN_BEST;
            StorageService.setItem(bestKey, { es: { beginner: 7 } });
            StorageService.setItem(StorageService.WORDS_TOWER, ['wordC']);

            clearWordGroupCaches();

            expect(StorageService.getItem(bestKey)).toEqual({ es: { beginner: 7 } });
            expect(StorageService.getItem(StorageService.WORDS_TOWER)).toBeNull();
        });
    });

    // ─────────────────────────────────────────────────────────
    // isLevelPopulated
    // ─────────────────────────────────────────────────────────
    describe('isLevelPopulated', () => {
        test('returns false when nothing is stored', () => {
            expect(isLevelPopulated('beginner', 'es')).toBe(false);
        });

        test('returns true for a stored level and false for an unstored one', () => {
            StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });

            expect(isLevelPopulated('beginner', 'es')).toBe(true);
            expect(isLevelPopulated('intermediate', 'es')).toBe(false);
        });
    });

    // ─────────────────────────────────────────────────────────
    // getSessionWords
    // ─────────────────────────────────────────────────────────
    describe('getSessionWords', () => {
        test('draws the session from a full pool and saves the remainder without querying the database', async () => {
            const pool = Array.from({ length: 50 }, (_, i) => `word${i}`);
            StorageService.setItem(StorageService.WORDS_FINDER, pool);
            const initDB = jest.spyOn(dbService, 'initDB');

            const result = await getSessionWords(StorageService.WORDS_FINDER, 10, FINDER_QUERY, jest.fn(), 20);

            expect(result).toEqual(pool.slice(0, 10));
            expect(StorageService.getItem(StorageService.WORDS_FINDER)).toEqual(pool.slice(10));
            expect(initDB).not.toHaveBeenCalled();
        });

        test('an empty pool is filled from the database with the query', async () => {
            await seedBeginner();

            const result = await getSessionWords(StorageService.WORDS_FINDER, 3, FINDER_QUERY, jest.fn(), 1);

            expect(result).toHaveLength(3);
            result.forEach((word) => expect(inFinderWindow(word)).toBe(true));
        });

        test('a pool below the threshold is topped up in the background with words matching the query', async () => {
            await seedBeginner();
            StorageService.setItem(StorageService.WORDS_FINDER, ['uno1', 'dos2', 'tres', 'cuat', 'cinc']);

            const result = await getSessionWords(StorageService.WORDS_FINDER, 2, FINDER_QUERY, jest.fn(), 20);

            expect(result).toEqual(['uno1', 'dos2']);
            const matches = SEEDED.filter(inFinderWindow);
            await waitFor(() => expect(StorageService.getItem<string[]>(StorageService.WORDS_FINDER)).toHaveLength(3 + matches.length));
            const refetched = StorageService.getItem<string[]>(StorageService.WORDS_FINDER)!.slice(3);
            expect([...refetched].sort()).toEqual([...matches].sort());
        });
    });

    // ─────────────────────────────────────────────────────────
    // prefetchWordGroups
    // ─────────────────────────────────────────────────────────
    describe('prefetchWordGroups', () => {
        test('WORD_GROUP_FETCH_CONFIG keeps the per-group counts and length windows as queries', () => {
            expect(WORD_GROUP_FETCH_CONFIG).toEqual([
                { key: StorageService.WORDS_DAILY, count: 7, query: { minLen: 4 } },
                { key: StorageService.WORDS_FINDER, count: 60, query: { minLen: 4, maxLen: 9 } },
                { key: StorageService.WORDS_TOWER, count: 120, query: { minLen: 4 } },
                { key: StorageService.WORDS_RAIN, count: 150, query: { minLen: 4 } },
                { key: StorageService.WORDS_ACCENT, count: 80, query: { minLen: 4 } },
                { key: StorageService.WORDS_MATCHER, count: 80, query: { minLen: 4 } },
                { key: StorageService.WORDS_SYLLABLE, count: 60, query: { minLen: 4 } },
            ]);
        });

        test('fills every group of the level with the words its window allows', async () => {
            await seedBeginner();

            await expect(prefetchWordGroups('beginner', 'es', jest.fn())).resolves.toBe(true);

            // 9 seeded words, every group asks for more: each group gets all its matches (7 or fewer).
            const minLen4 = SEEDED.filter((word) => word.length >= 4).sort();
            const stored = (key: Parameters<typeof StorageService.getItem>[0]) => [...(StorageService.getItem<string[]>(key) ?? [])].sort();
            expect(stored(StorageService.WORDS_FINDER)).toEqual(SEEDED.filter(inFinderWindow).sort());
            expect(stored(StorageService.WORDS_DAILY)).toHaveLength(7);
            stored(StorageService.WORDS_DAILY).forEach((word) => expect(minLen4).toContain(word));
            for (const key of [StorageService.WORDS_TOWER, StorageService.WORDS_RAIN, StorageService.WORDS_ACCENT, StorageService.WORDS_MATCHER, StorageService.WORDS_SYLLABLE]) {
                expect(stored(key)).toEqual(minLen4);
            }
        });
    });

    // ─────────────────────────────────────────────────────────
    // loadDailyWordForLocale
    // ─────────────────────────────────────────────────────────
    describe('loadDailyWordForLocale', () => {
        test('returns the stored daily word without loading anything', async () => {
            StorageService.setItem(StorageService.SELECTED_DAY_WORD, 'hola');
            global.fetch = jest.fn();

            await expect(loadDailyWordForLocale('es')).resolves.toBe('hola');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        test('loads the beginner chunk, draws one word and stores it for 24h', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve({
                        version: 2,
                        locale: 'es',
                        level: 'beginner',
                        fields: ['word', 'freqRank', 'levels', 'flags', 'syllables', 'stressedSyllable', 'pos', 'senseCount', 'source'],
                        rows: [['uno', null, 1], ['dos', null, 1], ['tres', null, 1]],
                    }),
            });
            const setItem = jest.spyOn(StorageService, 'setItem');

            const word = await loadDailyWordForLocale('es');

            expect(global.fetch).toHaveBeenCalledWith('/words/es/beginner_1.json');
            expect(['uno', 'dos', 'tres']).toContain(word);
            expect(setItem).toHaveBeenCalledWith(StorageService.SELECTED_DAY_WORD, word, 86400000);
        });
    });
});

describe('implicit level load', () => {
    beforeEach(async () => {
        await dbService.deleteDatabase();
        localStorage.clear();
        resetLevelRows();
        jest.spyOn(Logger, 'log').mockImplementation(() => {});
        jest.spyOn(Logger, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        localStorage.clear();
    });

    test('the daily word loading beginner keeps the queues of the level being played', async () => {
        StorageService.setItem(StorageService.WORDS_FINDER, ['ventana', 'camino']);
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    version: 2,
                    locale: 'es',
                    level: 'beginner',
                    fields: ['word', 'freqRank', 'levels', 'flags', 'syllables', 'stressedSyllable', 'pos', 'senseCount', 'source'],
                    rows: [['uno', null, 1], ['dos', null, 1]],
                }),
        });

        const word = await loadDailyWordForLocale('es');

        expect(['uno', 'dos']).toContain(word);
        expect(StorageService.getItem(StorageService.WORDS_FINDER)).toEqual(['ventana', 'camino']);
    });
});
