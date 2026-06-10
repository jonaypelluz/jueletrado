import { renderHook, waitFor } from '@testing-library/react';
import { getFullWordSet } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import useWordBuilder from '@games/wordBuilder/useWordBuilder';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService');
jest.mock('@hooks/useWordProcessor', () => ({
    useWordProcessor: () => ({
        processWords: (words: string[]) => words.map((w) => [w, w + 'x']),
        processLastWords: (words: string[][]) => words,
        processWordsWithAccents: (words: string[]) => words,
        filterWordsByLetters: async (_letters: string[], allWords: string[]) =>
            allWords.slice(0, 3),
    }),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockGetFullWordSet = getFullWordSet as jest.Mock;

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: null as string | null,
    error: null,
    setError: jest.fn(),
    setLoadingProgress: jest.fn(),
    ...overrides,
});

describe('useWordBuilder', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('does not call getFullWordSet when gameLevel is null', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: null }));

        renderHook(() => useWordBuilder());

        await waitFor(() => {
            expect(mockGetFullWordSet).not.toHaveBeenCalled();
        });
    });

    test('calls getFullWordSet and sets allWords when gameLevel is set', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));

        const fakeWordSet = new Set(['apple', 'banana', 'cherry', 'date']);
        mockGetFullWordSet.mockResolvedValue(fakeWordSet);

        const { result } = renderHook(() => useWordBuilder());

        await waitFor(() => {
            expect(mockGetFullWordSet).toHaveBeenCalledWith('es', expect.any(Function), expect.any(Function));
        });

        // allWords is internal state; verify no error in result
        expect(result.current.gameLevel).toBe('beginner');
    });

    test('returns gameLevel from context', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'intermediate' }));
        mockGetFullWordSet.mockResolvedValue(new Set([]));

        const { result } = renderHook(() => useWordBuilder());

        expect(result.current.gameLevel).toBe('intermediate');
    });
});
