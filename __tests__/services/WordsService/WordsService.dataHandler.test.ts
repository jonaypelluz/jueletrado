import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
import { getAllWords, getWords, loadDefinition, loadWords } from '@services/WordsService';

describe('WordsService data handler tests', () => {
    global.fetch = jest.fn();

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('Successfully load definitions with loadDefinition', async () => {
        const mockDefinition = {
            abajo: {
                definitions: [
                    {
                        number: '1',
                        type: 'adverbio',
                        definition: 'En un lugar que está más bajo o en la parte baja.',
                    },
                ],
            },
        };
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockDefinition),
            }),
        );

        const result = await loadDefinition('a');

        expect(global.fetch).toHaveBeenCalledWith('/definitions/a_definitions.json');
        expect(result).toEqual(mockDefinition);
    });

    test('Handles loadDefinition fetch error', async () => {
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
            }),
        );

        const mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(() => {});

        const result = await loadDefinition('a');

        expect(global.fetch).toHaveBeenCalledWith('/definitions/a_definitions.json');
        expect(mockLoggerError).toHaveBeenCalledWith(
            'Error fetching definitions:',
            expect.any(Error),
        );
        expect(result).toBeUndefined();
    });

    test('Successfully load words with loadWords', async () => {
        const mockWords = ['word1', 'word2', 'word3'];
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockWords),
            }),
        );

        const result = await loadWords('basic', 1, 3);

        expect(global.fetch).toHaveBeenCalledWith('/words/basic_words_from_1_to_3.json');
        expect(result).toEqual(mockWords);
    });

    test('Handles loadWords fetch error', async () => {
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
            }),
        );

        const mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(() => {});

        const result = await loadWords('basic', 1, 3);

        expect(global.fetch).toHaveBeenCalledWith('/words/basic_words_from_1_to_3.json');
        expect(mockLoggerError).toHaveBeenCalledWith('Error fetching words:', expect.any(Error));
        expect(result).toBeUndefined();
    });

    test('Successfully retrieves all words with getAllWords', async () => {
        const mockSetStoreName = jest.spyOn(dbService, 'setStoreName').mockImplementation(() => {});
        const mockInitDB = jest
            .spyOn(dbService, 'initDB')
            .mockImplementation(() => Promise.resolve());
        const mockGetAllWords = jest
            .spyOn(dbService, 'getAllWords')
            .mockImplementation(() => Promise.resolve(['word1', 'word2']));
        const setErrorMock = jest.fn();
        const level = 'basic';

        const result = await getAllWords(level, setErrorMock);

        expect(mockSetStoreName).toHaveBeenCalledWith(level);
        expect(mockInitDB).toHaveBeenCalled();
        expect(mockGetAllWords).toHaveBeenCalled();
        expect(result).toEqual(['word1', 'word2']);
        expect(setErrorMock).not.toHaveBeenCalled();
    });

    test('Error handling for invalid level in getAllWords', async () => {
        const setErrorMock = jest.fn();
        const invalidLevel = 'invalid_level';

        const mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(() => {});

        const result = await getAllWords(invalidLevel, setErrorMock);

        expect(mockLoggerError).toHaveBeenCalled();
        expect(setErrorMock).toHaveBeenCalledWith(expect.any(Error));
        expect(result).toBeUndefined();
        expect(setErrorMock.mock.calls[0][0].message).toBe('Invalid level specified');
    });

    test('Handles error during word retrieval in getAllWords', async () => {
        const mockSetStoreName = jest.spyOn(dbService, 'setStoreName').mockImplementation(() => {});
        const mockInitDB = jest
            .spyOn(dbService, 'initDB')
            .mockImplementation(() => Promise.resolve());
        const mockGetAllWords = jest
            .spyOn(dbService, 'getAllWords')
            .mockImplementation(() => Promise.reject(new Error('Database error')));
        const mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(() => {});
        const setErrorMock = jest.fn();
        const level = 'basic';

        const result = await getAllWords(level, setErrorMock);

        expect(mockSetStoreName).toHaveBeenCalledWith(level);
        expect(mockInitDB).toHaveBeenCalled();
        expect(mockGetAllWords).toHaveBeenCalled();
        expect(mockLoggerError).toHaveBeenCalledWith(
            'Error retrieving all words:',
            expect.any(Error),
        );
        expect(setErrorMock).toHaveBeenCalledWith(expect.any(Error));
        expect(result).toBeUndefined();
    });

    test('Successfully retrieves words with getWords', async () => {
        const mockSetStoreName = jest.spyOn(dbService, 'setStoreName').mockImplementation(() => {});
        const mockInitDB = jest
            .spyOn(dbService, 'initDB')
            .mockImplementation(() => Promise.resolve());
        const mockGetRandomWords = jest
            .spyOn(dbService, 'getRandomWords')
            .mockImplementation(() => Promise.resolve(['word1', 'word2']));
        const mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(() => {});
        const setErrorMock = jest.fn();
        const level = 'basic';
        const count = 2;

        const result = await getWords(level, count, setErrorMock);

        expect(mockSetStoreName).toHaveBeenCalledWith(level);
        expect(mockInitDB).toHaveBeenCalled();
        expect(mockGetRandomWords).toHaveBeenCalledWith(count);
        expect(result).toEqual(['word1', 'word2']);
        expect(setErrorMock).not.toHaveBeenCalled();
        expect(mockLoggerError).not.toHaveBeenCalled();
    });

    test('Handles invalid level error in getWords', async () => {
        const setErrorMock = jest.fn();
        const level = 'invalid_level';
        const count = 10;

        const mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(() => {});

        const result = await getWords(level, count, setErrorMock);

        expect(mockLoggerError).toHaveBeenCalledWith('Invalid level specified');
        expect(setErrorMock).toHaveBeenCalledWith(expect.any(Error));
        expect(result).toBeUndefined();
    });
});
