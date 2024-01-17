import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
import { deleteWordsDB, populateWordsDB } from '@services/WordsService';
import StorageService from '@store/StorageService';
import '@testing-library/jest-dom';
import 'core-js/stable/structured-clone';
import 'fake-indexeddb/auto';

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

    afterAll(() => {
        jest.restoreAllMocks();
    });

    test('Successful populate database', async () => {
        const setErrorMock = jest.fn();
        const setLoadingProgressMock = jest.fn();
        const level = 'basic';
        const locale = 'es';

        const mockCheckIfPopulated = jest
            .spyOn(dbService, 'checkIfPopulated')
            .mockImplementation(() => Promise.resolve(true));

        const mockGetItem = jest.spyOn(StorageService, 'getItem').mockReturnValue([]);
        const mockSetItem = jest.spyOn(StorageService, 'setItem');
        const mockClearStorage = jest.spyOn(StorageService, 'clearStorage');

        const result = await populateWordsDB(level, locale, setErrorMock, setLoadingProgressMock);

        expect(setErrorMock).not.toHaveBeenCalled();
        expect(mockClearStorage).toHaveBeenCalled();
        expect(mockSetItem).toHaveBeenCalled();
        expect(mockCheckIfPopulated).toHaveBeenCalled();
        expect(mockGetItem).toHaveBeenCalled();
        expect(setLoadingProgressMock).toHaveBeenCalledWith(100);
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

    test('Error handling for already loaded chunk in Populate Database', async () => {
        const CHUNK = 0;
        const setErrorMock = jest.fn();
        const setLoadingProgressMock = jest.fn();
        const level = 'basic';
        const locale = 'es';

        jest.spyOn(StorageService, 'getItem').mockReturnValue([CHUNK]);
        jest.spyOn(dbService, 'checkIfPopulated').mockImplementation(() => Promise.resolve(true));
        const mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(() => {});

        const result = await populateWordsDB(level, locale, setErrorMock, setLoadingProgressMock);

        expect(result).toBe(false);
        expect(mockLoggerError).toHaveBeenCalled();
        expect(setErrorMock).toHaveBeenCalledWith(expect.any(Error));
        expect(setErrorMock.mock.calls[0][0].message).toBe(
            `Error: Chunk ${CHUNK} is already loaded.`,
        );
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
