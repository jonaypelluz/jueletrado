import { dbService } from '@services/DBService';
import {
    clearWordGroupCaches,
    getSessionWords,
    getLevelWordSet,
    isLevelPopulated,
    loadDailyWordForLocale,
} from '@services/WordsService';
import StorageService from '@store/StorageService';

// Do NOT import 'fake-indexeddb/auto' here — it conflicts with spies on dbService.
// All dbService methods are mocked individually.

describe('WordsService session operations tests', () => {
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
            StorageService.setItem(StorageService.LOCALE, 'es');
            StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });

            clearWordGroupCaches();

            expect(StorageService.getItem(StorageService.WORDS_DAILY)).toBeNull();
            expect(StorageService.getItem(StorageService.WORDS_FINDER)).toBeNull();
            expect(StorageService.getItem(StorageService.WORDS_TOWER)).toBeNull();
            expect(StorageService.getItem(StorageService.WORDS_RAIN)).toBeNull();
            // These should still have values
            expect(StorageService.getItem(StorageService.LOCALE)).toBe('es');
            expect(StorageService.getItem(StorageService.LEVELS_POPULATED)).toEqual({
                es: { beginner: true },
            });
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
        test('draws session from full pool, saves remainder without fetching', async () => {
            const pool = Array.from({ length: 50 }, (_, i) => `word${i}`);

            jest.spyOn(StorageService, 'getItem').mockImplementation((key) =>
                key === StorageService.WORDS_FINDER ? (pool as unknown as null) : null,
            );
            const mockSetItem = jest.spyOn(StorageService, 'setItem');
            const mockGetRandomWordsWithMaxLength = jest.spyOn(
                dbService,
                'getRandomWordsWithMaxLength',
            );

            const result = await getSessionWords(
                StorageService.WORDS_FINDER,
                10,
                'beginner',
                'es',
                jest.fn(),
                { count: 60, maxLength: 9, minLength: 4 },
                20,
            );

            expect(result).toHaveLength(10);
            expect(result).toEqual(pool.slice(0, 10));
            expect(mockSetItem).toHaveBeenCalledWith(
                StorageService.WORDS_FINDER,
                pool.slice(10),
            );
            expect(mockGetRandomWordsWithMaxLength).not.toHaveBeenCalled();
        });

        test('fetches from DB when pool is empty', async () => {
            const fetched = Array.from({ length: 60 }, (_, i) => `fetched${i}`);

            jest.spyOn(StorageService, 'getItem').mockReturnValue(null);
            jest.spyOn(dbService, 'setStoreName').mockImplementation(() => {});
            jest.spyOn(dbService, 'initDB').mockResolvedValue(undefined);
            const mockGetRandomWordsWithMaxLength = jest
                .spyOn(dbService, 'getRandomWordsWithMaxLength')
                .mockResolvedValue(fetched);

            const result = await getSessionWords(
                StorageService.WORDS_FINDER,
                10,
                'beginner',
                'es',
                jest.fn(),
                { count: 60, maxLength: 9, minLength: 4 },
                20,
            );

            expect(result).toHaveLength(10);
            expect(mockGetRandomWordsWithMaxLength).toHaveBeenCalled();
        });

        test('triggers background refetch when remaining pool drops below threshold', async () => {
            const smallPool = Array.from({ length: 15 }, (_, i) => `poolWord${i}`);
            const newWords = Array.from({ length: 60 }, (_, i) => `newWord${i}`);

            // First call returns smallPool (pool); subsequent calls return null (for the
            // background refetch's StorageService.getItem to merge with).
            let getItemCallCount = 0;
            jest.spyOn(StorageService, 'getItem').mockImplementation((key) => {
                if (key === StorageService.WORDS_FINDER) {
                    getItemCallCount += 1;
                    return getItemCallCount === 1
                        ? (smallPool as unknown as null)
                        : null;
                }
                return null;
            });
            jest.spyOn(StorageService, 'setItem');
            jest.spyOn(dbService, 'setStoreName').mockImplementation(() => {});
            jest.spyOn(dbService, 'initDB').mockResolvedValue(undefined);
            const mockGetRandomWordsWithMaxLength = jest
                .spyOn(dbService, 'getRandomWordsWithMaxLength')
                .mockResolvedValue(newWords);

            const result = await getSessionWords(
                StorageService.WORDS_FINDER,
                10,
                'beginner',
                'es',
                jest.fn(),
                { count: 60, maxLength: 9, minLength: 4 },
                20,
            );

            expect(result).toHaveLength(10);

            // Allow the background promise (fire-and-forget) to resolve
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(mockGetRandomWordsWithMaxLength).toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────
    // getLevelWordSet
    // ─────────────────────────────────────────────────────────
    describe('getLevelWordSet', () => {
        test('returns a Set of all words and caches it on repeated calls', async () => {
            jest.spyOn(dbService, 'setStoreName').mockImplementation(() => {});
            jest.spyOn(dbService, 'initDB').mockResolvedValue(undefined);
            const mockGetAllWords = jest
                .spyOn(dbService, 'getAllWords')
                .mockResolvedValue(['apple', 'banana', 'cherry']);

            const first = await getLevelWordSet('beginner', 'es');
            expect(first).toEqual(new Set(['apple', 'banana', 'cherry']));
            expect(mockGetAllWords).toHaveBeenCalledTimes(1);

            const second = await getLevelWordSet('beginner', 'es');
            expect(second).toEqual(new Set(['apple', 'banana', 'cherry']));
            // Cache hit — DB should NOT be queried again
            expect(mockGetAllWords).toHaveBeenCalledTimes(1);
        });
    });

    // ─────────────────────────────────────────────────────────
    // loadDailyWordForLocale
    // ─────────────────────────────────────────────────────────
    describe('loadDailyWordForLocale', () => {
        test('returns stored word when SELECTED_DAY_WORD is in storage', async () => {
            jest.spyOn(StorageService, 'getItem').mockImplementation((key) =>
                key === StorageService.SELECTED_DAY_WORD ? ('hola' as unknown as null) : null,
            );
            const mockGetRandomWords = jest.spyOn(dbService, 'getRandomWords');

            const result = await loadDailyWordForLocale('es');

            expect(result).toBe('hola');
            expect(mockGetRandomWords).not.toHaveBeenCalled();
        });

        test('loads from beginner DB and stores when no daily word saved', async () => {
            jest.spyOn(StorageService, 'getItem').mockReturnValue(null);

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(['uno', 'dos', 'tres']),
            });

            jest.spyOn(dbService, 'setStoreName').mockImplementation(() => {});
            jest.spyOn(dbService, 'initDB').mockResolvedValue(undefined);
            jest.spyOn(dbService, 'checkIfPopulated').mockResolvedValue(false);
            jest.spyOn(dbService, 'addWords').mockResolvedValue(undefined);
            jest.spyOn(dbService, 'getRandomWords').mockResolvedValue(['palabra']);
            const mockSetItem = jest.spyOn(StorageService, 'setItem');

            const result = await loadDailyWordForLocale('es');

            expect(result).toBe('palabra');
            expect(mockSetItem).toHaveBeenCalledWith(
                StorageService.SELECTED_DAY_WORD,
                'palabra',
                86400000,
            );
        });
    });
});
