import { act, renderHook, waitFor } from '@testing-library/react';
import { getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useSpellTower from '@games/spellTower/useSpellTower';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getSessionWords: jest.fn(),
    getLevelWordSet: jest.fn().mockResolvedValue(new Set<string>()),
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
const mockGetSessionWords = getSessionWords as jest.Mock;

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: null as string | null,
    error: null,
    setError: jest.fn(),
    ...overrides,
});

describe('useSpellTower', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('does not call getSessionWords when gameLevel is null', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: null }));

        renderHook(() => useSpellTower());

        await waitFor(() => {
            expect(mockGetSessionWords).not.toHaveBeenCalled();
        });
    });

    test('calls getSessionWords and sets showButton when gameLevel is set', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));

        const fakeWords = Array.from({ length: 15 }, (_, i) => `word${i}`);
        mockGetSessionWords.mockResolvedValue(fakeWords);
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);

        const { result } = renderHook(() => useSpellTower());

        await waitFor(() => {
            expect(mockGetSessionWords).toHaveBeenCalledWith(
                StorageService.WORDS_TOWER,
                15,
                'beginner',
                'es',
                expect.any(Function),
                { count: 120, minLength: 4 },
                30,
            );
            expect(result.current.showButton).toBe(true);
        });
    });

    test('returns gameLevel from context', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'intermediate' }));
        mockGetSessionWords.mockResolvedValue([]);

        const { result } = renderHook(() => useSpellTower());

        expect(result.current.gameLevel).toBe('intermediate');
    });

    test('handleGameStartClick starts game and resets state', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(['word0', 'word1']);

        const { result } = renderHook(() => useSpellTower());

        await waitFor(() => expect(result.current.showButton).toBe(true));

        act(() => { result.current.handleGameStartClick(); });

        expect(result.current.gameStarted).toBe(true);
        expect(result.current.correctAnswers).toBe(0);
        expect(result.current.incorrectAnswers).toHaveLength(0);
        expect(result.current.currentWordIndex).toBe(0);
    });

    test('correct answer increments correctAnswers', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(['gato', 'perro']);

        const { result } = renderHook(() => useSpellTower());

        await waitFor(() => expect(result.current.showButton).toBe(true));

        act(() => { result.current.handleGameStartClick(); });

        await waitFor(() => expect(result.current.randomizedVariations.length).toBeGreaterThan(0));

        const correctWord = result.current.words?.[0]?.[0];
        const correctIndex = result.current.randomizedVariations.indexOf(correctWord ?? '');

        act(() => { result.current.handleWordClick(correctIndex); });

        await waitFor(() => expect(result.current.correctAnswers).toBe(1));
    });

    test('wrong answer decrements correctAnswers and records error', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(['gato', 'perro']);

        const { result } = renderHook(() => useSpellTower());

        await waitFor(() => expect(result.current.showButton).toBe(true));

        act(() => { result.current.handleGameStartClick(); });

        await waitFor(() => expect(result.current.randomizedVariations.length).toBeGreaterThan(0));

        const correctWord = result.current.words?.[0]?.[0];
        const wrongIndex = result.current.randomizedVariations.findIndex(v => v !== correctWord);

        act(() => { result.current.handleWordClick(wrongIndex); });

        await waitFor(() => {
            expect(result.current.correctAnswers).toBe(0);
            expect(result.current.incorrectAnswers.length).toBe(1);
        });
    });
});
