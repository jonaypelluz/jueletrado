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

    test('Populate database slow path loads chunks and marks level populated', async () => {
        const setErrorMock = jest.fn();
        const setLoadingProgressMock = jest.fn();
        const level = 'beginner';
        const locale = 'es';

        let checkIfPopulatedCallCount = 0;
        jest.spyOn(dbService, 'checkIfPopulated').mockImplementation(() => {
            checkIfPopulatedCallCount += 1;
            // First call: not yet populated → triggers slow path
            // Second call: now populated → marks level and returns true
            return Promise.resolve(checkIfPopulatedCallCount > 1);
        });

        jest.spyOn(dbService, 'addWords').mockResolvedValue(undefined);
        jest.spyOn(dbService, 'setStoreName').mockImplementation(() => {});
        jest.spyOn(dbService, 'initDB').mockResolvedValue(undefined);
        const mockSetItem = jest.spyOn(StorageService, 'setItem');

        const result = await populateWordsDB(level, locale, setErrorMock, setLoadingProgressMock);

        expect(result).toBe(true);
        expect(setErrorMock).not.toHaveBeenCalled();
        expect(setLoadingProgressMock).toHaveBeenCalled();
        expect(mockSetItem).toHaveBeenCalledWith(
            StorageService.LEVELS_POPULATED,
            expect.anything(),
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
