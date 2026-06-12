import { renderHook, waitFor } from '@testing-library/react';
import { getWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useWordsRain from '@games/wordsRain/useWordsRain';

const mockGetWords = getWords as jest.Mock;

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getFullWordSet: jest.fn().mockResolvedValue(new Set<string>()),
    getWords: jest.fn().mockResolvedValue([]),
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
    setLoading: jest.fn(),
    setLoadingProgress: jest.fn(),
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

    test('falls back to fetching words from the DB when WORDS_RAIN cache is empty', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'advanced' }));
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);
        jest.spyOn(StorageService, 'setItem').mockImplementation(() => {});
        mockGetWords.mockResolvedValueOnce(['gato', 'perro', 'pato', 'rato', 'peto']);

        const { result } = renderHook(() => useWordsRain());

        await waitFor(() => {
            expect(result.current.showButton).toBe(true);
        });
        expect(StorageService.setItem).toHaveBeenCalledWith(
            StorageService.WORDS_RAIN,
            expect.any(Array),
            expect.any(Number),
        );
    });

    test('sets an error when WORDS_RAIN cache is empty and the DB has no words either', async () => {
        const setError = jest.fn();
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'advanced', setError }));
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);
        mockGetWords.mockResolvedValueOnce([]);

        renderHook(() => useWordsRain());

        await waitFor(() => {
            expect(setError).toHaveBeenCalledWith(new Error('No words found for words rain'));
        });
    });

    test('toggles global loading state while words are being fetched', async () => {
        const setLoading = jest.fn();
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'advanced', setLoading }));
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);
        jest.spyOn(StorageService, 'setItem').mockImplementation(() => {});
        mockGetWords.mockResolvedValueOnce(['gato', 'perro']);

        const { result } = renderHook(() => useWordsRain());

        await waitFor(() => {
            expect(result.current.showButton).toBe(true);
        });
        expect(setLoading).toHaveBeenCalledWith(true);
        expect(setLoading).toHaveBeenLastCalledWith(false);
    });

    test('falls back to fetching with en locale when cache is empty', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ locale: 'en', gameLevel: 'beginner' }));
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);
        jest.spyOn(StorageService, 'setItem').mockImplementation(() => {});
        mockGetWords.mockResolvedValueOnce(['cat', 'dog', 'bird', 'fish', 'frog']);

        renderHook(() => useWordsRain());

        await waitFor(() => {
            expect(mockGetWords).toHaveBeenCalledWith(
                'beginner',
                'en',
                expect.any(Number),
                expect.any(Function),
                null,
                4,
            );
        });
    });

    test('returns gameLevel from context', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'advanced' }));
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);

        const { result } = renderHook(() => useWordsRain());

        expect(result.current.gameLevel).toBe('advanced');
    });
});
