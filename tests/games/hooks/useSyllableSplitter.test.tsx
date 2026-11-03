import { act, renderHook } from '@testing-library/react';
import { getFullWordSet, getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useSyllableSplitter from '@games/syllableSplitter/useSyllableSplitter';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getSessionWords: jest.fn(),
    getFullWordSet: jest.fn().mockResolvedValue(new Set<string>()),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockGetSessionWords = getSessionWords as jest.Mock;
const mockGetFullWordSet = getFullWordSet as jest.Mock;

// 20-word session draw at the advanced level (6-12 letters): 12 eligible words (in this order) mixed
// with ineligible ones: one syllable (sol, pan, flor, tren), uppercase (Madrid), non-letter (co-che),
// prefix word (sublunar, R1), loanword y before a consonant (cyclocross, R4), longer than the level
// maximum (aproximadamente) and a `tl` word (atletismo).
const ELIGIBLE_IN_ORDER = [
    'instrucción',
    'ventana',
    'caramelo',
    'mariposa',
    'escuela',
    'camino',
    'pelota',
    'ciudad',
    'poesía',
    'abanico',
    'hermano', // 11th eligible: must not be used
    'tortuga',
];
const POOL = [
    'sol',
    'instrucción',
    'Madrid',
    'ventana',
    'caramelo',
    'co-che',
    'mariposa',
    'pan',
    'escuela',
    'sublunar',
    'camino',
    'aproximadamente',
    'pelota',
    'cyclocross',
    'ciudad',
    'flor',
    'poesía',
    'atletismo',
    'abanico',
    'tren',
    'hermano',
    'tortuga',
];
const INELIGIBLE_ONLY = ['sol', 'Madrid', 'co-che', 'pan', 'sublunar', 'cyclocross', 'flor', 'tren'];
const THREE_ELIGIBLE = ['sol', 'casa', 'pan', 'perro', 'Madrid', 'coche'];

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: 'beginner' as string | null,
    isLoading: false,
    error: null,
    setError: jest.fn(),
    setLoadingProgress: jest.fn(),
    ...overrides,
});

const startGame = async (pool: string[] = POOL, gameLevel = 'advanced') => {
    mockUseWordsContext.mockReturnValue(makeContext({ gameLevel }));
    mockGetSessionWords.mockResolvedValue(pool);

    const hook = renderHook(() => useSyllableSplitter());

    await act(async () => {
        await hook.result.current.handleGameStartClick();
    });

    return hook;
};

type HookResult = Awaited<ReturnType<typeof startGame>>['result'];

const clickGaps = (result: HookResult, positions: number[]) => {
    positions.forEach((position) => {
        act(() => {
            result.current.handleGapClick(position);
        });
    });
};

const check = (result: HookResult) => {
    act(() => {
        result.current.handleCheckClick();
    });
};

const next = (result: HookResult) => {
    act(() => {
        result.current.handleNextClick();
    });
};

describe('useSyllableSplitter', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('starting a game', () => {
        test('draws 20 session words from the syllable queue without loading the full word set', async () => {
            await startGame();

            expect(mockGetSessionWords).toHaveBeenCalledTimes(1);
            expect(mockGetSessionWords).toHaveBeenCalledWith(
                StorageService.WORDS_SYLLABLE,
                20,
                'advanced',
                'es',
                expect.any(Function),
                { count: 60, minLength: 6, maxLength: 12 },
            );
            expect(mockGetFullWordSet).not.toHaveBeenCalled();
        });

        // The prefetched queue is filled with minLength 4 and no maximum, so the level limits are
        // enforced when the words are drawn.
        test.each([
            ['beginner', ['casa', 'perro', 'abanico'], ['casa', 'perro']],
            ['intermediate', ['casa', 'perro', 'abanico', 'caramelos'], ['perro', 'abanico']],
            ['advanced', ['perro', 'camino', 'instrucción', 'aproximadamente'], ['camino', 'instrucción']],
        ])('keeps only words within the %s length limits', async (level, pool, expected) => {
            const { result } = await startGame(pool, level);

            expect(result.current.challenges?.map((c) => c.word)).toEqual(expected);
        });

        test('skips words containing tl (RAE accepts both a-tle-ta and at-le-ta)', async () => {
            const { result } = await startGame(['atleta', 'atlántico', 'camino']);

            expect(result.current.challenges?.map((c) => c.word)).toEqual(['camino']);
        });

        test('draws again until 10 eligible words are found', async () => {
            mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'advanced' }));
            mockGetSessionWords
                .mockResolvedValueOnce(['instrucción', 'sol', 'ventana', 'pan', 'caramelo'])
                .mockResolvedValueOnce(ELIGIBLE_IN_ORDER.slice(3));
            const { result } = renderHook(() => useSyllableSplitter());

            await act(async () => {
                await result.current.handleGameStartClick();
            });

            expect(mockGetSessionWords).toHaveBeenCalledTimes(2);
            expect(result.current.challenges?.map((c) => c.word)).toEqual(ELIGIBLE_IN_ORDER.slice(0, 10));
        });

        test('accepts fewer than 10 words when the pool is exhausted', async () => {
            mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'advanced' }));
            mockGetSessionWords.mockResolvedValueOnce(['instrucción', 'sol', 'ventana']).mockResolvedValueOnce([]);
            const { result } = renderHook(() => useSyllableSplitter());

            await act(async () => {
                await result.current.handleGameStartClick();
            });

            expect(mockGetSessionWords).toHaveBeenCalledTimes(2);
            expect(result.current.challenges?.map((c) => c.word)).toEqual(['instrucción', 'ventana']);
            expect(result.current.gameStarted).toBe(true);
        });

        test('stops drawing after a bounded number of draws and ignores repeated words', async () => {
            const { result } = await startGame(THREE_ELIGIBLE, 'beginner');

            expect(mockGetSessionWords).toHaveBeenCalledTimes(3);
            expect(result.current.challenges?.map((c) => c.word)).toEqual(['casa', 'perro', 'coche']);
        });

        test('keeps the first 10 eligible words in pool order and skips ineligible ones', async () => {
            const { result } = await startGame();

            expect(result.current.challenges?.map((c) => c.word)).toEqual(ELIGIBLE_IN_ORDER.slice(0, 10));
            expect(result.current.challenges?.map((c) => c.word)).not.toContain('hermano');
            expect(result.current.challenges?.[0]).toEqual({
                word: 'instrucción',
                syllables: ['ins', 'truc', 'ción'],
                dividers: [3, 7],
            });
            expect(result.current.challenges?.[1]).toEqual({
                word: 'ventana',
                syllables: ['ven', 'ta', 'na'],
                dividers: [3, 5],
            });
            expect(result.current.gameStarted).toBe(true);
            expect(result.current.currentIndex).toBe(0);
            expect(result.current.selectedDividers).toEqual([]);
        });

        test('skips loanwords ending in consonant + y', async () => {
            const { result } = await startGame(['penalty', 'ventana']);

            expect(result.current.challenges?.map((c) => c.word)).toEqual(['ventana']);
        });

        test('falls back to the rules screen when no word is eligible', async () => {
            const { result } = await startGame(INELIGIBLE_ONLY);

            expect(result.current.gameStarted).toBe(false);
            expect(result.current.challenges).toBeNull();
            expect(result.current.hasBeenPlayed).toBe(false);
            expect(result.current.showButton).toBe(true);
        });

        test('starting again after a session resets score, misses, check state and index', async () => {
            const { result } = await startGame(THREE_ELIGIBLE, 'beginner');
            // casa: correct, perro: wrong (no dividers), coche: correct
            clickGaps(result, [2]);
            check(result);
            next(result);
            check(result);
            next(result);
            clickGaps(result, [2]);
            check(result);
            next(result);
            expect(result.current.gameStarted).toBe(false);
            expect(result.current.correctAnswers).toBe(2);
            expect(result.current.incorrectAnswers).toHaveLength(1);

            await act(async () => {
                await result.current.handleGameStartClick();
            });

            expect(result.current.gameStarted).toBe(true);
            expect(result.current.correctAnswers).toBe(0);
            expect(result.current.incorrectAnswers).toEqual([]);
            expect(result.current.isChecked).toBe(false);
            expect(result.current.lastCheckCorrect).toBeNull();
            expect(result.current.currentIndex).toBe(0);
            expect(result.current.selectedDividers).toEqual([]);
        });
    });

    describe('gap selection', () => {
        test('a gap click toggles the divider on and off', async () => {
            const { result } = await startGame();

            clickGaps(result, [3]);
            expect(result.current.selectedDividers).toEqual([3]);

            clickGaps(result, [3]);
            expect(result.current.selectedDividers).toEqual([]);
        });

        test.each([0, 'instrucción'.length, -1])('ignores out-of-range gap position %i', async (position) => {
            const { result } = await startGame();

            clickGaps(result, [position]);

            expect(result.current.selectedDividers).toEqual([]);
        });

        test('ignores gap clicks before the game starts', () => {
            mockUseWordsContext.mockReturnValue(makeContext());
            const { result } = renderHook(() => useSyllableSplitter());

            clickGaps(result, [2]);

            expect(result.current.selectedDividers).toEqual([]);
        });

        test('ignores gap clicks after the word is checked', async () => {
            const { result } = await startGame();
            clickGaps(result, [3]);
            check(result);

            clickGaps(result, [7, 3]);

            expect(result.current.selectedDividers).toEqual([3]);
        });
    });

    describe('checking a word', () => {
        test('an exact divider set (any click order) scores one point', async () => {
            const { result } = await startGame();

            clickGaps(result, [7, 3]);
            check(result);

            expect(result.current.isChecked).toBe(true);
            expect(result.current.lastCheckCorrect).toBe(true);
            expect(result.current.correctAnswers).toBe(1);
            expect(result.current.incorrectAnswers).toEqual([]);
        });

        test('a wrong divider set keeps the score and records [player, correct] hyphenations', async () => {
            const { result } = await startGame();

            clickGaps(result, [2, 7]);
            check(result);

            expect(result.current.lastCheckCorrect).toBe(false);
            expect(result.current.correctAnswers).toBe(0);
            expect(result.current.incorrectAnswers).toEqual([['in-struc-ción', 'ins-truc-ción']]);
        });

        test('checking with no dividers is wrong and records the bare word as the player answer', async () => {
            const { result } = await startGame();

            check(result);

            expect(result.current.lastCheckCorrect).toBe(false);
            expect(result.current.correctAnswers).toBe(0);
            expect(result.current.incorrectAnswers).toEqual([['instrucción', 'ins-truc-ción']]);
        });

        test('a double check within one render is counted once', async () => {
            const { result } = await startGame();
            clickGaps(result, [3]);

            act(() => {
                result.current.handleCheckClick();
                result.current.handleCheckClick();
            });

            expect(result.current.correctAnswers).toBe(0);
            expect(result.current.incorrectAnswers).toEqual([['ins-trucción', 'ins-truc-ción']]);
        });

        test('a gap click and a check within one render use the fresh selection', async () => {
            const { result } = await startGame();

            act(() => {
                result.current.handleGapClick(3);
                result.current.handleCheckClick();
            });

            expect(result.current.incorrectAnswers).toEqual([['ins-trucción', 'ins-truc-ción']]);
        });

        test('checking before the game starts does nothing', () => {
            mockUseWordsContext.mockReturnValue(makeContext());
            const { result } = renderHook(() => useSyllableSplitter());

            check(result);

            expect(result.current.isChecked).toBe(false);
            expect(result.current.correctAnswers).toBe(0);
            expect(result.current.incorrectAnswers).toEqual([]);
        });
    });

    describe('moving to the next word', () => {
        test('next before checking does nothing', async () => {
            const { result } = await startGame();

            next(result);

            expect(result.current.currentIndex).toBe(0);
            expect(result.current.gameStarted).toBe(true);
        });

        test('next after checking advances and clears the selection and check state', async () => {
            const { result } = await startGame();
            clickGaps(result, [3, 7]);
            check(result);

            next(result);

            expect(result.current.currentIndex).toBe(1);
            expect(result.current.selectedDividers).toEqual([]);
            expect(result.current.isChecked).toBe(false);
            expect(result.current.lastCheckCorrect).toBeNull();
        });

        test.each([
            ['10 challenges from a full draw', POOL, 10],
            ['3 challenges when only 3 words are eligible', THREE_ELIGIBLE, 3],
        ])('ends the game after the last word (%s)', async (_label, pool, total) => {
            const { result } = await startGame(pool, total === 3 ? 'beginner' : 'advanced');
            expect(result.current.challenges).toHaveLength(total);

            for (let i = 0; i < total - 1; i++) {
                check(result);
                next(result);
                expect(result.current.gameStarted).toBe(true);
            }
            check(result);
            next(result);

            expect(result.current.gameStarted).toBe(false);
            expect(result.current.showButton).toBe(true);
        });
    });
});
