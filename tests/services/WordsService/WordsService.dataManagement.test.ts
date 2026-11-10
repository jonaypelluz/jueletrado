import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
import { deleteWordsDB, getWords, isLevelPopulated, populateWordsDB } from '@services/WordsService';
import { WordQuery } from '@models/types';
import StorageService from '@store/StorageService';
import '@testing-library/jest-dom';
import 'core-js/stable/structured-clone';
import 'fake-indexeddb/auto';
import { IDBObjectStore } from 'fake-indexeddb';
import { resetLevelRows, setLevelChunks, setLevelRows } from '../../fixtures/levelConfigMock';

// Each level is served as one two-word chunk unless a test sets its size (levelConfigMock).
jest.mock('@config/LevelConfig', () => require('../../fixtures/levelConfigMock').levelConfigModule);

const serveTwoWordLevels = () => {
    resetLevelRows();
    ['beginner', 'intermediate', 'advanced'].forEach((level) => setLevelRows('es', level, 2));
};

const FIELDS = ['word', 'freqRank', 'levels', 'flags', 'syllables', 'stressedSyllable', 'pos', 'senseCount', 'source'];
const LEVEL_BIT: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 4 };

/** A served v2 chunk: rows of [word, freqRank, levels] (trailing fields trimmed). */
const v2Chunk = (level: string, words: string[]) => ({
    version: 2,
    locale: 'es',
    level,
    fields: FIELDS,
    rows: words.map((word) => [word, null, LEVEL_BIT[level]]),
});

const serveChunk = (body: unknown) => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) });
};

describe('WordsService data management tests', () => {
    beforeAll(() => {
        global.fetch = jest.fn(
            () =>
                Promise.resolve({
                    json: () => Promise.resolve(['abajo', 'abandona', 'abandonada']),
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers(),
                    type: 'default',
                    url: '',
                }) as unknown as Promise<Response>,
        );
    });

    beforeEach(serveTwoWordLevels);

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('Successful populate database', async () => {
        const setErrorMock = jest.fn();
        const setLoadingProgressMock = jest.fn();
        const level = 'beginner';
        const locale = 'es';

        const mockCheckIfPopulated = jest
            .spyOn(dbService, 'checkIfPopulated')
            .mockImplementation(() => Promise.resolve(true));

        const mockSetItem = jest.spyOn(StorageService, 'setItem');

        const result = await populateWordsDB(level, locale, setErrorMock, setLoadingProgressMock);

        expect(setErrorMock).not.toHaveBeenCalled();
        expect(mockSetItem).toHaveBeenCalled();
        expect(mockCheckIfPopulated).toHaveBeenCalled();
        expect(setLoadingProgressMock).not.toHaveBeenCalled();
        expect(result).toBe(true);
    });

    test('Error handling for invalid level in Populate Database', async () => {
        const setErrorMock = jest.fn();
        const setLoadingProgressMock = jest.fn();
        const invalidLevel = 'invalid_level';
        const locale = 'es';

        const mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(() => {});

        const result = await populateWordsDB(
            invalidLevel,
            locale,
            setErrorMock,
            setLoadingProgressMock,
        );

        expect(mockLoggerError).toHaveBeenCalled();
        expect(setErrorMock).toHaveBeenCalledWith(expect.any(Error));
        expect(setErrorMock.mock.calls[0][0].message).toBe('Invalid level specified');
        expect(result).toBe(false);
        expect(setLoadingProgressMock).not.toHaveBeenCalled();
    });

    test('slow path stores every chunk of the level at consecutive positions and marks the level populated', async () => {
        await dbService.deleteDatabase();
        localStorage.clear();
        setLevelChunks('es', 'beginner', 2);
        setLevelRows('es', 'beginner', 3);
        const chunks: Record<string, unknown> = {
            '/words/es/beginner_1.json': v2Chunk('beginner', ['casa', 'perro']),
            '/words/es/beginner_2.json': v2Chunk('beginner', ['mesa']),
        };
        global.fetch = jest.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(chunks[url]) })) as unknown as typeof fetch;
        const putChunk = jest.spyOn(dbService as unknown as { putChunk: (...args: unknown[]) => Promise<void> }, 'putChunk');
        const setErrorMock = jest.fn();
        const setLoadingProgressMock = jest.fn();

        const result = await populateWordsDB('beginner', 'es', setErrorMock, setLoadingProgressMock);

        expect(result).toBe(true);
        expect(setErrorMock).not.toHaveBeenCalled();
        // Raw served rows, positioned across chunks: the second chunk starts after the first one's rows.
        expect(putChunk.mock.calls).toEqual([
            ['es', 'beginner', 0, [['casa', null, 1], ['perro', null, 1]]],
            ['es', 'beginner', 2, [['mesa', null, 1]]],
        ]);
        expect(isLevelPopulated('beginner', 'es')).toBe(true);
        expect(setLoadingProgressMock).toHaveBeenLastCalledWith(100);
    });

    test('a chunk that fails to load leaves the level not populated, and a retry with every chunk served populates it', async () => {
        await dbService.deleteDatabase();
        localStorage.clear();
        setLevelChunks('es', 'beginner', 3);
        setLevelRows('es', 'beginner', 3);
        const chunks: Record<string, unknown> = {
            '/words/es/beginner_1.json': v2Chunk('beginner', ['casa']),
            '/words/es/beginner_2.json': v2Chunk('beginner', ['perro']),
            '/words/es/beginner_3.json': v2Chunk('beginner', ['mesa']),
        };
        const serve = (failing?: string) =>
            jest.fn((url: string) => Promise.resolve(url === failing ? { ok: false, status: 500 } : { ok: true, status: 200, json: () => Promise.resolve(chunks[url]) })) as unknown as typeof fetch;
        jest.spyOn(Logger, 'error').mockImplementation(() => {});
        global.fetch = serve('/words/es/beginner_2.json');
        const setErrorMock = jest.fn();

        await expect(populateWordsDB('beginner', 'es', setErrorMock, jest.fn())).resolves.toBe(false);
        expect(setErrorMock).toHaveBeenCalledWith(expect.any(Error));
        expect(isLevelPopulated('beginner', 'es')).toBe(false);

        global.fetch = serve();

        await expect(populateWordsDB('beginner', 'es', jest.fn(), jest.fn())).resolves.toBe(true);
        expect(isLevelPopulated('beginner', 'es')).toBe(true);
    });

    test('a chunk in the v1 format is reported and the level is not populated', async () => {
        await dbService.deleteDatabase();
        localStorage.clear();
        serveChunk(['casa', 'perro']);
        jest.spyOn(Logger, 'error').mockImplementation(() => {});
        const setErrorMock = jest.fn();

        const result = await populateWordsDB('beginner', 'es', setErrorMock, jest.fn());

        expect(result).toBe(false);
        expect(setErrorMock).toHaveBeenCalledWith(new Error('Unsupported word chunk format'));
        expect(isLevelPopulated('beginner', 'es')).toBe(false);
    });

    test('getWords on an unpopulated level (v1 storage, empty database) loads the level first', async () => {
        await dbService.deleteDatabase();
        localStorage.clear();
        serveChunk(v2Chunk('beginner', ['casa', 'perro']));

        const words = await getWords({ locale: 'es', level: 'beginner', count: 5 }, jest.fn());

        expect(global.fetch).toHaveBeenCalledWith('/words/es/beginner_1.json');
        expect([...words].sort()).toEqual(['casa', 'perro']);
    });

    test('getWords without a level reports "Invalid level specified" and loads nothing', async () => {
        global.fetch = jest.fn() as unknown as typeof fetch;
        jest.spyOn(Logger, 'error').mockImplementation(() => {});
        const setErrorMock = jest.fn();

        const words = await getWords({ locale: 'es', count: 10 } as WordQuery, setErrorMock);

        expect(words).toEqual([]);
        expect(setErrorMock).toHaveBeenCalledWith(new Error('Invalid level specified'));
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('a database that fails to open is reported through setError and the level is not populated', async () => {
        const blocked = new Error('Database error: VersionError');
        jest.spyOn(dbService, 'initDB').mockRejectedValue(blocked);
        jest.spyOn(Logger, 'error').mockImplementation(() => {});
        const setErrorMock = jest.fn();

        const result = await populateWordsDB('beginner', 'es', setErrorMock, jest.fn());

        expect(result).toBe(false);
        expect(setErrorMock).toHaveBeenCalledWith(blocked);
    });

    test('Successful database deletion', async () => {
        const mockDeleteDatabase = jest
            .spyOn(dbService, 'deleteDatabase')
            .mockImplementation(() => Promise.resolve());
        const mockLoggerLog = jest.spyOn(Logger, 'log').mockImplementation(() => {});
        const setErrorMock = jest.fn();

        await deleteWordsDB(setErrorMock);

        expect(mockDeleteDatabase).toHaveBeenCalled();
        expect(mockLoggerLog).toHaveBeenCalledWith('Words database successfully deleted');
        expect(setErrorMock).not.toHaveBeenCalled();
    });

    test('Error handling in database deletion', async () => {
        const testError = new Error('Test error');

        jest.spyOn(Logger, 'log').mockImplementation(() => {});

        const mockDeleteDatabase = jest
            .spyOn(dbService, 'deleteDatabase')
            .mockRejectedValue(testError);
        const mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(() => {});
        const setErrorMock = jest.fn();

        await deleteWordsDB(setErrorMock);

        expect(mockDeleteDatabase).toHaveBeenCalled();
        expect(mockLoggerError).toHaveBeenCalledWith('Error deleting words database:', testError);
        expect(setErrorMock).toHaveBeenCalledWith(testError);
    });
});

describe('WordsService after an aborted chunk store', () => {
    beforeEach(serveTwoWordLevels);

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('populate reports the abort and the next locked call is not stuck behind it', async () => {
        await dbService.deleteDatabase();
        localStorage.clear();
        serveChunk(v2Chunk('beginner', ['casa', 'perro']));
        jest.spyOn(Logger, 'error').mockImplementation(() => {});
        const realPut = IDBObjectStore.prototype.put;
        const putSpy = jest.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
            const request = realPut.apply(this, args);
            request.addEventListener('success', () => this.transaction.abort());
            return request;
        });
        const setErrorMock = jest.fn();

        await expect(populateWordsDB('beginner', 'es', setErrorMock, jest.fn())).resolves.toBe(false);
        expect(setErrorMock).toHaveBeenCalled();
        putSpy.mockRestore();

        const words = await getWords({ locale: 'es', level: 'beginner', count: 5 }, jest.fn());
        expect([...words].sort()).toEqual(['casa', 'perro']);
    });
});

describe('WordsService populated state follows IndexedDB, not only storage', () => {
    beforeEach(serveTwoWordLevels);

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('a stale LEVELS_POPULATED flag over an empty database still loads the level before drawing', async () => {
        await dbService.deleteDatabase();
        localStorage.clear();
        StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });
        serveChunk(v2Chunk('beginner', ['casa', 'perro']));

        const words = await getWords({ locale: 'es', level: 'beginner', count: 5 }, jest.fn());

        expect(global.fetch).toHaveBeenCalledWith('/words/es/beginner_1.json');
        expect([...words].sort()).toEqual(['casa', 'perro']);
    });

    test('deleteWordsDB also forgets the populated levels and the word queues', async () => {
        jest.spyOn(Logger, 'log').mockImplementation(() => {});
        StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });
        StorageService.setItem(StorageService.WORDS_FINDER, ['casa']);

        await deleteWordsDB(jest.fn());

        expect(StorageService.getItem(StorageService.LEVELS_POPULATED)).toBeNull();
        expect(StorageService.getItem(StorageService.WORDS_FINDER)).toBeNull();
    });
});
