import { act, renderHook, waitFor } from '@testing-library/react';
import { getFullWordSet, getWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useWordChain from '@games/wordChain/useWordChain';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getFullWordSet: jest.fn(),
    getWords: jest.fn(),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockGetFullWordSet = getFullWordSet as jest.Mock;
const mockGetWords = getWords as jest.Mock;

const bulk = (letter: string, n: number): string[] =>
    Array.from({ length: n }, (_, i) => `${letter}aa${i}`);

// 'a' and 'o' have >= 50 words; 'r' (reloj) and 'p' (perro) do not, so 'reloj' ends in a dead-end.
const FULL_SET = new Set([
    ...bulk('a', 50),
    ...bulk('o', 50),
    'arpa',
    'arco',
    'oso',
    'ola',
    'perro',
    'reloj',
]);

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: 'beginner' as string | null,
    error: null,
    setError: jest.fn(),
    setLoadingProgress: jest.fn(),
    ...overrides,
});

type HookResult = { current: ReturnType<typeof useWordChain> };

const renderLoaded = async () => {
    const hook = renderHook(() => useWordChain());
    await waitFor(() => expect(hook.result.current.showButton).toBe(true));
    return hook;
};

const startGame = async (result: HookResult) => {
    await act(async () => {
        await result.current.handleGameStartClick();
    });
};

const submit = (result: HookResult, value: string) => {
    act(() => {
        result.current.handleInputChange(value);
    });
    act(() => {
        result.current.handleSubmit();
    });
};

const tick = (seconds: number) => {
    for (let i = 0; i < seconds; i++) {
        act(() => {
            jest.advanceTimersByTime(1000);
        });
    }
};

const storeBest = (value: unknown) => StorageService.setItem(StorageService.WORD_CHAIN_BEST, value);

describe('useWordChain', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockUseWordsContext.mockReturnValue(makeContext());
        mockGetFullWordSet.mockResolvedValue(FULL_SET);
        mockGetWords.mockResolvedValue(['reloj', 'arpa']);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        localStorage.clear();
    });

    describe('loading', () => {
        test('does not load the word set without a level', () => {
            mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: null }));

            const { result } = renderHook(() => useWordChain());

            expect(mockGetFullWordSet).not.toHaveBeenCalled();
            expect(result.current.showButton).toBe(false);
        });

        test('loads the full word set once and enables Play when it resolves', async () => {
            let resolveSet: (set: Set<string>) => void = () => {};
            mockGetFullWordSet.mockReturnValue(
                new Promise<Set<string>>((resolve) => {
                    resolveSet = resolve;
                }),
            );
            const context = makeContext();
            mockUseWordsContext.mockReturnValue(context);

            const { result, rerender } = renderHook(() => useWordChain());

            expect(result.current.isLoading).toBe(true);
            expect(result.current.showButton).toBe(false);

            await act(async () => {
                resolveSet(FULL_SET);
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.showButton).toBe(true);
            expect(mockGetFullWordSet).toHaveBeenCalledTimes(1);
            expect(mockGetFullWordSet).toHaveBeenCalledWith(
                'es',
                context.setError,
                context.setLoadingProgress,
            );

            mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'advanced' }));
            rerender();
            await act(async () => {});

            expect(mockGetFullWordSet).toHaveBeenCalledTimes(1);
        });
    });

    describe('start', () => {
        test('draws the seed with getWords, skipping candidates that end in a dead-end letter', async () => {
            const context = makeContext();
            mockUseWordsContext.mockReturnValue(context);
            const { result } = await renderLoaded();

            await startGame(result);

            expect(mockGetWords).toHaveBeenCalledWith('beginner', 'es', 20, context.setError, null, 4);
            expect(result.current.gameStarted).toBe(true);
            expect(result.current.chain).toEqual(['arpa']);
            expect(result.current.requiredLetter).toBe('A');
            expect(result.current.score).toBe(0);
        });

        test.each([[[]], [undefined], [['reloj']]])(
            'sets loadError and does not start when getWords gives no usable seed (%p)',
            async (candidates) => {
                mockGetWords.mockResolvedValue(candidates);
                const { result } = await renderLoaded();

                await startGame(result);

                expect(result.current.loadError).toBe(true);
                expect(result.current.gameStarted).toBe(false);
                expect(result.current.chain).toEqual([]);
            },
        );

        test('Play after a loadError clears it and starts the game', async () => {
            mockGetWords.mockResolvedValueOnce([]);
            const { result } = await renderLoaded();
            await startGame(result);
            expect(result.current.loadError).toBe(true);

            await startGame(result);

            expect(result.current.loadError).toBe(false);
            expect(result.current.gameStarted).toBe(true);
            expect(result.current.chain).toEqual(['arpa']);
        });

        test('reloads an empty word set on Play instead of looping on loadError', async () => {
            mockGetFullWordSet.mockResolvedValueOnce(new Set());
            const { result } = await renderLoaded();

            await startGame(result);

            expect(mockGetFullWordSet).toHaveBeenCalledTimes(2);
            expect(result.current.gameStarted).toBe(true);
            expect(result.current.chain).toEqual(['arpa']);
        });

        test('sets loadError when the reloaded word set is still empty', async () => {
            mockGetFullWordSet.mockResolvedValue(new Set());
            const { result } = await renderLoaded();

            await startGame(result);

            expect(mockGetWords).not.toHaveBeenCalled();
            expect(result.current.loadError).toBe(true);
            expect(result.current.gameStarted).toBe(false);
        });

        test('ignores a second Play while the seed is being drawn', async () => {
            const { result } = await renderLoaded();

            await act(async () => {
                await Promise.all([result.current.handleGameStartClick(), result.current.handleGameStartClick()]);
            });

            expect(mockGetWords).toHaveBeenCalledTimes(1);
            expect(result.current.gameStarted).toBe(true);
        });

        test('drops the start when the level changes while the seed is being drawn', async () => {
            let resolveWords: (words: string[]) => void = () => {};
            mockGetWords.mockReturnValue(
                new Promise<string[]>((resolve) => {
                    resolveWords = resolve;
                }),
            );
            const { result, rerender } = await renderLoaded();

            let start: Promise<void> = Promise.resolve();
            act(() => {
                start = result.current.handleGameStartClick();
            });
            mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'advanced' }));
            rerender();
            await act(async () => {
                resolveWords(['arpa']);
                await start;
            });

            expect(result.current.gameStarted).toBe(false);
            expect(result.current.chain).toEqual([]);
        });
    });

    describe('turns', () => {
        test.each([
            ['beginner', 30],
            ['intermediate', 20],
            ['advanced', 15],
        ])('on %s an accepted word extends the chain and resets the countdown to %i', async (gameLevel, turnTime) => {
            mockUseWordsContext.mockReturnValue(makeContext({ gameLevel }));
            const { result } = await renderLoaded();
            await startGame(result);
            expect(result.current.countdown).toBe(turnTime);

            tick(5);
            expect(result.current.countdown).toBe(turnTime - 5);
            submit(result, 'arco');

            expect(result.current.chain).toEqual(['arpa', 'arco']);
            expect(result.current.score).toBe(1);
            expect(result.current.countdown).toBe(turnTime);
            expect(result.current.input).toBe('');
            expect(result.current.rejection).toBeNull();
            expect(result.current.requiredLetter).toBe('O');
        });

        test.each([
            ['perro', 'wrong-letter'],
            ['arpa', 'repeated'],
        ])('rejects %s with %s, keeping input, score and countdown', async (word, reason) => {
            const { result } = await renderLoaded();
            await startGame(result);

            tick(5);
            submit(result, word);

            expect(result.current.rejection).toBe(reason);
            expect(result.current.input).toBe(word);
            expect(result.current.score).toBe(0);
            expect(result.current.chain).toEqual(['arpa']);
            expect(result.current.countdown).toBe(25);
        });

        test('ignores a blank submit', async () => {
            const { result } = await renderLoaded();
            await startGame(result);

            submit(result, '   ');

            expect(result.current.rejection).toBeNull();
            expect(result.current.chain).toEqual(['arpa']);
        });

        test('ends the game when the countdown reaches 0 and ignores later submits', async () => {
            const { result } = await renderLoaded();
            await startGame(result);

            tick(30);

            expect(result.current.gameStarted).toBe(false);
            expect(result.current.isGameOver).toBe(true);

            submit(result, 'arco');

            expect(result.current.chain).toEqual(['arpa']);
            expect(result.current.score).toBe(0);
        });

        test('a level change mid-game resets the game and the next game uses the new turn time', async () => {
            const { result, rerender } = await renderLoaded();
            await startGame(result);

            mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'intermediate' }));
            rerender();

            expect(result.current.gameStarted).toBe(false);
            expect(result.current.chain).toEqual([]);

            await startGame(result);

            expect(result.current.countdown).toBe(20);
            expect(mockGetWords).toHaveBeenLastCalledWith('intermediate', 'es', 20, expect.any(Function), null, 4);
        });
    });

    describe('best score', () => {
        const playOneWordAndExpire = async () => {
            const { result } = await renderLoaded();
            await startGame(result);
            submit(result, 'arco');
            tick(30);
            return result;
        };

        test('saves a beaten best for the locale and level and flags a new record', async () => {
            storeBest({ en: { beginner: 9 } });

            const result = await playOneWordAndExpire();

            expect(StorageService.getItem(StorageService.WORD_CHAIN_BEST)).toEqual({
                en: { beginner: 9 },
                es: { beginner: 1 },
            });
            expect(result.current.best).toBe(1);
            expect(result.current.isNewRecord).toBe(true);
        });

        test('keeps the stored best when the score does not beat it', async () => {
            const stored = { es: { beginner: 5 }, en: { beginner: 9 } };
            storeBest(stored);

            const result = await playOneWordAndExpire();

            expect(StorageService.getItem(StorageService.WORD_CHAIN_BEST)).toEqual(stored);
            expect(result.current.best).toBe(5);
            expect(result.current.isNewRecord).toBe(false);
        });

        test.each([
            [{ es: { beginner: 4, intermediate: 2 } }, 'es', 'beginner', 4],
            [{ es: { beginner: 4, intermediate: 2 } }, 'es', 'intermediate', 2],
            [{ es: { beginner: 4, intermediate: 2 } }, 'en', 'beginner', 0],
            ['x', 'es', 'beginner', 0],
            [{ es: { beginner: 'x' } }, 'es', 'beginner', 0],
        ])('reads best %p for %s/%s on mount as %i', (stored, locale, gameLevel, expected) => {
            storeBest(stored);
            mockUseWordsContext.mockReturnValue(makeContext({ locale, gameLevel }));

            const { result } = renderHook(() => useWordChain());

            expect(result.current.best).toBe(expected);
        });
    });
});
