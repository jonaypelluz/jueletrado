import { renderHook, waitFor } from '@testing-library/react';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useWordsRain from '@games/wordsRain/useWordsRain';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getFullWordSet: jest.fn().mockResolvedValue(new Set<string>()),
}));
jest.mock('@hooks/useWordProcessor', () => ({
    useWordProcessor: () => ({
        processWords: (words: string[]) => words.map((w) => [w, w + 'x']),
        processLastWords: (words: string[][]) => words,
        processWordsWithAccents: (words: string[]) => words,
        filterWordsByLetters: async () => [],
    }),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: null as string | null,
    error: null,
    setError: jest.fn(),
    ...overrides,
});

describe('useWordsRain', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    test('does not set words when gameLevel is null', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: null }));
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);

        const { result } = renderHook(() => useWordsRain());

        await waitFor(() => {
            expect(result.current.showButton).toBe(false);
        });
    });

    test('sets words and showButton when gameLevel is set and WORDS_RAIN exists', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));

        const storedWords = ['gato', 'perro', 'pato', 'rato', 'peto'];
        jest.spyOn(StorageService, 'getItem').mockImplementation((key) =>
            key === StorageService.WORDS_RAIN ? (storedWords as unknown as null) : null,
        );

        const { result } = renderHook(() => useWordsRain());

        await waitFor(() => {
            expect(result.current.showButton).toBe(true);
        });
    });

    test('returns gameLevel from context', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'advanced' }));
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);

        const { result } = renderHook(() => useWordsRain());

        expect(result.current.gameLevel).toBe('advanced');
    });
});
