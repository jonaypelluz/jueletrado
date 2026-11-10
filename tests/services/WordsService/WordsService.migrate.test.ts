import { WORDS_DATA_VERSION } from '@config/WordsDataVersion';
import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
import { migrateWordsData } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { WORD_CHUNK_VERSION } from '@utils/WordRecord';

// The stamp of the stored word data: chunk format and the hash of the served chunks (config/WordsDataVersion.ts).
const STAMP = `${WORD_CHUNK_VERSION}:${WORDS_DATA_VERSION}`;

describe('migrateWordsData', () => {
    let clear: jest.SpyInstance;

    beforeEach(() => {
        localStorage.clear();
        clear = jest.spyOn(dbService, 'clearWordStores').mockResolvedValue(undefined);
        StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });
        StorageService.setItem(StorageService.WORDS_TOWER, ['casa']);
        StorageService.setItem(StorageService.WORD_CHAIN_BEST, { es: { beginner: 4 } });
    });

    afterEach(() => jest.restoreAllMocks());

    test.each([
        ['nothing stored (first visit, or the v1 layout)', null],
        ['the v1 layout version', 2],
        ['another hash of the chunks (the served words changed)', `${WORD_CHUNK_VERSION}:0000000000000000`],
    ])('%s: drops the stored word data, then writes the stamp', async (_case, stored) => {
        if (stored !== null) StorageService.setItem(StorageService.WORDS_DATA_VERSION, stored);

        await migrateWordsData();

        expect(clear).toHaveBeenCalledTimes(1);
        expect(StorageService.getItem(StorageService.LEVELS_POPULATED)).toBeNull();
        expect(StorageService.getItem(StorageService.WORDS_TOWER)).toBeNull();
        expect(StorageService.getItem(StorageService.WORD_CHAIN_BEST)).toEqual({ es: { beginner: 4 } }); // kept
        expect(StorageService.getItem(StorageService.WORDS_DATA_VERSION)).toBe(STAMP);
    });

    test('the same stamp leaves everything as it is', async () => {
        StorageService.setItem(StorageService.WORDS_DATA_VERSION, STAMP);

        await migrateWordsData();

        expect(clear).not.toHaveBeenCalled();
        expect(StorageService.getItem(StorageService.LEVELS_POPULATED)).toEqual({ es: { beginner: true } });
    });

    test('a failed clear keeps the old stamp, so the next load tries again', async () => {
        clear.mockRejectedValue(new Error('blocked'));
        jest.spyOn(Logger, 'error').mockImplementation(() => {});

        await migrateWordsData();

        expect(StorageService.getItem(StorageService.WORDS_DATA_VERSION)).toBeNull();
    });
});
