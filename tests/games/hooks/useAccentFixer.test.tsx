import { act, renderHook } from '@testing-library/react';
import { getFullWordSet, getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useAccentFixer from '@games/accentFixer/useAccentFixer';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getSessionWords: jest.fn(),
    getFullWordSet: jest.fn().mockResolvedValue(new Set<string>()),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockGetSessionWords = getSessionWords as jest.Mock;
const mockGetFullWordSet = getFullWordSet as jest.Mock;

// 6 words carrying a single tilde + 6 words without any accent, all >=2 vowels,
// none of which become ambiguous against an empty fullWordSet.
const ACCENTED_WORDS = ['canción', 'árbol', 'cantó', 'rápido', 'médico', 'jamón'];
const UNACCENTED_WORDS = ['ventana', 'perro', 'gato', 'mesa', 'silla', 'lampara'];
const MIXED_POOL = [...ACCENTED_WORDS, ...UNACCENTED_WORDS];

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: null as string | null,
    isLoading: false,
    error: null,
    setError: jest.fn(),
    setLoadingProgress: jest.fn(),
    ...overrides,
});

describe('useAccentFixer', () => {
    let randomSpy: jest.SpyInstance;

    beforeEach(() => {
        // Math.random() - 0.5 === 0 keeps Array.sort's relative order stable,
        // so selectChallenges' insertion order (accented first, then unaccented) is preserved.
        randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
        mockGetFullWordSet.mockResolvedValue(new Set<string>());
    });

    afterEach(() => {
        randomSpy.mockRestore();
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    test('start builds 10 challenges with both accented and non-accented words', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(MIXED_POOL);

        const { result } = renderHook(() => useAccentFixer());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        expect(mockGetSessionWords).toHaveBeenCalledWith(
            StorageService.WORDS_ACCENT,
            30,
            'beginner',
            'es',
            expect.any(Function),
            { count: 80, minLength: 4, maxLength: 6 },
        );
        expect(result.current.challenges).toHaveLength(10);
        expect(result.current.challenges?.some((c) => c.accentIndex !== -1)).toBe(true);
        expect(result.current.challenges?.some((c) => c.accentIndex === -1)).toBe(true);
        expect(result.current.gameStarted).toBe(true);
    });

    test('does not show the play button while the level data is still loading', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner', isLoading: true }));

        const { result, rerender } = renderHook(() => useAccentFixer());
        expect(result.current.showButton).toBe(false);
        expect(result.current.isLevelLoading).toBe(true);

        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner', isLoading: false }));
        rerender();

        expect(result.current.showButton).toBe(true);
        expect(result.current.isLevelLoading).toBe(false);
    });

    test('selects an 80/20 accented/unaccented split when enough of each are available', async () => {
        const LARGE_ACCENTED = ['canción', 'árbol', 'cantó', 'rápido', 'médico', 'jamón', 'camión', 'sábana'];
        const LARGE_UNACCENTED = ['ventana', 'perro', 'gato', 'mesa', 'silla', 'lampara', 'mochila', 'cocina'];

        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue([...LARGE_ACCENTED, ...LARGE_UNACCENTED]);

        const { result } = renderHook(() => useAccentFixer());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        const challenges = result.current.challenges!;
        expect(challenges).toHaveLength(10);
        expect(challenges.filter((c) => c.accentIndex !== -1)).toHaveLength(8);
        expect(challenges.filter((c) => c.accentIndex === -1)).toHaveLength(2);
    });

    test('correct vowel click increments score', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(MIXED_POOL);

        const { result } = renderHook(() => useAccentFixer());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        const challenge = result.current.challenges?.[0];
        expect(challenge?.original).toBe('canción');

        act(() => {
            result.current.handleVowelClick(challenge!.accentIndex);
        });

        expect(result.current.correctAnswers).toBe(1);
        expect(result.current.pendingResult).toEqual({
            clickedIndex: challenge!.accentIndex,
            correctIndex: challenge!.accentIndex,
        });
    });

    test('wrong vowel click keeps score floored at 0 and records the failure', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(MIXED_POOL);

        const { result } = renderHook(() => useAccentFixer());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        const challenge = result.current.challenges?.[0];
        const wrongIndex = challenge!.vowelIndices.find((i) => i !== challenge!.accentIndex)!;

        act(() => {
            result.current.handleVowelClick(wrongIndex);
        });

        expect(result.current.correctAnswers).toBe(0);
        expect(result.current.incorrectAnswers).toEqual([[challenge!.displayed, challenge!.original]]);
    });

    test('"no accent" click is correct when the word has no tilde', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(UNACCENTED_WORDS);

        const { result } = renderHook(() => useAccentFixer());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        const challenge = result.current.challenges?.[0];
        expect(challenge?.accentIndex).toBe(-1);

        act(() => {
            result.current.handleNoAccentClick();
        });

        expect(result.current.correctAnswers).toBe(1);
        expect(result.current.pendingResult).toEqual({ clickedIndex: -2, correctIndex: -1 });
    });

    test('"no accent" click is incorrect when the word carries a tilde', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(MIXED_POOL);

        const { result } = renderHook(() => useAccentFixer());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        const challenge = result.current.challenges?.[0];
        expect(challenge?.accentIndex).not.toBe(-1);

        act(() => {
            result.current.handleNoAccentClick();
        });

        expect(result.current.correctAnswers).toBe(0);
        expect(result.current.incorrectAnswers).toEqual([[challenge!.displayed, challenge!.original]]);
    });

    test('input is ignored before the game starts and while a result is pending', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(MIXED_POOL);

        const { result } = renderHook(() => useAccentFixer());

        act(() => {
            result.current.handleVowelClick(0);
        });
        expect(result.current.correctAnswers).toBe(0);

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        const challenge = result.current.challenges?.[0];

        act(() => {
            result.current.handleVowelClick(challenge!.accentIndex);
        });
        expect(result.current.correctAnswers).toBe(1);

        // pendingResult is now set — a second click before the 800ms timeout must be ignored.
        act(() => {
            result.current.handleVowelClick(challenge!.accentIndex);
        });
        expect(result.current.correctAnswers).toBe(1);
    });

    test('timer reaching 0 ends the game', async () => {
        jest.useFakeTimers();
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(MIXED_POOL);

        const { result } = renderHook(() => useAccentFixer());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        expect(result.current.gameStarted).toBe(true);

        // Advance one second at a time so each tick's effect can schedule the next timeout.
        for (let i = 0; i < 60; i++) {
            act(() => {
                jest.advanceTimersByTime(1000);
            });
        }

        expect(result.current.gameStarted).toBe(false);
        expect(result.current.showButton).toBe(true);
    });
});
