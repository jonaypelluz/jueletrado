import { act, renderHook } from '@testing-library/react';
import { getFullWordSet, getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useLetterMatcher from '@games/letterMatcher/useLetterMatcher';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getSessionWords: jest.fn(),
    getFullWordSet: jest.fn().mockResolvedValue(new Set<string>()),
}));
// Two simple confusion rules so challenge building is predictable in tests.
jest.mock('@config/ChangeRules', () => ({
    __esModule: true,
    default: () => [{ ll: 'y' }, { rr: 'r' }],
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockGetSessionWords = getSessionWords as jest.Mock;
const mockGetFullWordSet = getFullWordSet as jest.Mock;

// 4 words match a rule (ll / rr), 2 match none and must be skipped.
const ELIGIBLE = ['pollo', 'calle', 'perro', 'carro'];
const INELIGIBLE = ['gato', 'mesa'];
const POOL = [...ELIGIBLE, ...INELIGIBLE];

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: null as string | null,
    isLoading: false,
    error: null,
    setError: jest.fn(),
    setLoadingProgress: jest.fn(),
    ...overrides,
});

describe('useLetterMatcher', () => {
    let randomSpy: jest.SpyInstance;

    beforeEach(() => {
        // Math.random() - 0.5 === 0 keeps Array.sort stable, so the first
        // applicable rule is used and options keep [gapAnswer, wrong] order.
        randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
        mockGetFullWordSet.mockResolvedValue(new Set<string>());
    });

    afterEach(() => {
        randomSpy.mockRestore();
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    test('start builds challenges from the oversampled pool, skipping ineligible words', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(POOL);

        const { result } = renderHook(() => useLetterMatcher());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        expect(mockGetSessionWords).toHaveBeenCalledWith(
            StorageService.WORDS_MATCHER,
            50,
            'beginner',
            'es',
            expect.any(Function),
            { count: 80, minLength: 4, maxLength: 6 },
        );
        expect(result.current.challenges).toHaveLength(ELIGIBLE.length);
        expect(result.current.gameStarted).toBe(true);
        result.current.challenges?.forEach((c) => {
            expect(c.prefix + c.gapAnswer + c.suffix).toBe(c.word);
            expect(c.options).toContain(c.gapAnswer);
        });
    });

    test('falls back to the rules screen when no eligible challenges are built', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(INELIGIBLE); // none match a rule

        const { result } = renderHook(() => useLetterMatcher());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        expect(result.current.gameStarted).toBe(false);
        expect(result.current.challenges).toBeNull();
        expect(result.current.hasBeenPlayed).toBe(false);
        expect(result.current.showButton).toBe(true);
    });

    test('correct click increments score; wrong click floors at 0 and records the failure', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(POOL);

        const { result } = renderHook(() => useLetterMatcher());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        const first = result.current.challenges![0];

        act(() => {
            result.current.handleOptionClick(first.gapAnswer);
        });
        expect(result.current.correctAnswers).toBe(1);
        expect(result.current.pendingResult).toEqual({
            clickedOption: first.gapAnswer,
            correct: true,
        });
    });

    test('wrong click records [chosenWord, correctWord] and floors score at 0', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(POOL);

        const { result } = renderHook(() => useLetterMatcher());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        const first = result.current.challenges![0];
        const wrong = first.options.find((o) => o !== first.gapAnswer)!;

        act(() => {
            result.current.handleOptionClick(wrong);
        });

        expect(result.current.correctAnswers).toBe(0);
        expect(result.current.incorrectAnswers).toEqual([
            [first.prefix + wrong + first.suffix, first.word],
        ]);
    });

    test('input is locked while a result is pending', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(POOL);

        const { result } = renderHook(() => useLetterMatcher());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        const first = result.current.challenges![0];

        act(() => {
            result.current.handleOptionClick(first.gapAnswer);
        });
        expect(result.current.correctAnswers).toBe(1);

        // pendingResult set — a second click before the 800ms timeout is ignored.
        act(() => {
            result.current.handleOptionClick(first.gapAnswer);
        });
        expect(result.current.correctAnswers).toBe(1);
    });

    test('timer reaching 0 ends the game', async () => {
        jest.useFakeTimers();
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue(POOL);

        const { result } = renderHook(() => useLetterMatcher());

        await act(async () => {
            await result.current.handleGameStartClick();
        });

        expect(result.current.gameStarted).toBe(true);

        for (let i = 0; i < 60; i++) {
            act(() => {
                jest.advanceTimersByTime(1000);
            });
        }

        expect(result.current.gameStarted).toBe(false);
        expect(result.current.showButton).toBe(true);
    });
});
