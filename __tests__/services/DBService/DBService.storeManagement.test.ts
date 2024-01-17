import { dbService } from '@services/DBService';
import 'core-js/stable/structured-clone';
import 'fake-indexeddb/auto';

describe('DBService Store Management', () => {
    test('addWords stores words and getAllWords retrive them successfully', async () => {
        await dbService.initDB();

        const level: string = 'basic';
        const locale: string = 'es';
        const testWords: string[] = ['testWord1', 'testWord2'];
        const minimumPopulatedCount = { es: 0 };

        dbService.setStoreName(level, locale);
        await dbService.addWords(level, locale, testWords, minimumPopulatedCount);

        const retrievedWords = await dbService.getAllWords();
        expect(retrievedWords).toEqual(expect.arrayContaining(testWords));
    });

    test('addWords skips adding words if the database is already populated and getAllWords retrive an empty array', async () => {
        jest.spyOn(dbService, 'checkIfPopulated').mockResolvedValue(true);

        await dbService.initDB();

        const level: string = 'basic';
        const locale: string = 'es';
        const testWords: string[] = ['testWord1', 'testWord2'];
        const noWordsWillBeStored: string[] = [];
        const minimumPopulatedCount = { es: 0 };

        dbService.setStoreName(level, locale);
        await dbService.addWords(level, locale, testWords, minimumPopulatedCount);

        const retrievedWords = await dbService.getAllWords();
        expect(retrievedWords).toEqual(expect.arrayContaining(noWordsWillBeStored));
    });

    test('getRandomWordsWithMaxLength returns an array with words of the correct length', async () => {
        const mockGetRandomWords = jest
            .fn()
            .mockResolvedValue([
                'tWrd1',
                'tWrd2',
                'testWord3',
                'tWrd4',
                'tWrd5',
                'tWrd6',
                'testWord7',
            ]);

        await dbService.initDB();
        dbService.getRandomWords = mockGetRandomWords;

        const count = 3;
        const maxLength = 6;

        const result = await dbService.getRandomWordsWithMaxLength(count, maxLength);

        expect(mockGetRandomWords.mock.calls.length).not.toBeLessThan(1);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(count);
        expect(result.every((word: string) => word.length < maxLength)).toBe(true);
    });

    test('getRandomWordsWithMaxLength reaches max attempts when filtering words', async () => {
        const mockGetRandomWords = jest
            .fn()
            .mockResolvedValue([
                'testWord1',
                'testWord2',
                'testWord3',
                'testWord4',
                'testWord5',
                'testWord6',
                'testWord7',
            ]);

        await dbService.initDB();
        dbService.getRandomWords = mockGetRandomWords;

        const count: number = 3;
        const maxLength: number = 6;

        const result = await dbService.getRandomWordsWithMaxLength(count, maxLength);

        expect(mockGetRandomWords).toHaveBeenCalledTimes(5);
        expect(result).toHaveLength(0);
    });
});
