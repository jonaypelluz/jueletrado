import { act, renderHook } from '@testing-library/react';
import { loadDefinition } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import useSpellingBee from '@games/spellingBee/useSpellingBee';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    loadDefinition: jest.fn(),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockLoadDefinition = loadDefinition as jest.Mock;

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: 'beginner' as string | null,
    error: null,
    setError: jest.fn(),
    ...overrides,
});

const LONG_DEFINITION = 'Definición suficientemente larga del término';

const dict = (word: string, definition = LONG_DEFINITION, type = 'sustantivo') => ({
    [word]: { definitions: [{ number: 1, type, definition }] },
});

type HookResult = { current: ReturnType<typeof useSpellingBee> };

const startGame = async (result: HookResult) => {
    await act(async () => {
        await result.current.handleGameStartClick();
    });
};

const submitGuess = (result: HookResult, value: string) => {
    act(() => {
        result.current.handleGuessChange(value);
    });
    act(() => {
        result.current.handleSubmit();
    });
};

const currentWord = (result: HookResult) => result.current.rounds[result.current.currentRound].word;

const renderStartedGame = async (impl: (letter: string) => Promise<unknown>) => {
    mockLoadDefinition.mockImplementation(impl);
    const { result } = renderHook(() => useSpellingBee());
    await startGame(result);
    return result;
};

describe('useSpellingBee', () => {
    beforeEach(() => {
        mockUseWordsContext.mockReturnValue(makeContext());
        mockLoadDefinition.mockImplementation(async (letter: string) => dict(`${letter}palabra`));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('loading', () => {
        test('does not load any definition on mount', () => {
            renderHook(() => useSpellingBee());

            expect(mockLoadDefinition).not.toHaveBeenCalled();
        });

        test.each([
            ['es', ['x']],
            ['en', ['j', 'k', 'l', 'x', 'z']],
        ])('start loads 5 distinct eligible letters in locale %s', async (locale, excluded) => {
            mockUseWordsContext.mockReturnValue(makeContext({ locale }));
            const { result } = renderHook(() => useSpellingBee());

            await startGame(result);

            const letters = mockLoadDefinition.mock.calls.map(([letter]) => letter);
            expect(letters).toHaveLength(5);
            expect(new Set(letters).size).toBe(5);
            letters.forEach((letter) => {
                expect(letter).toMatch(/^[a-z]$/);
                expect(excluded).not.toContain(letter);
            });
            mockLoadDefinition.mock.calls.forEach(([, callLocale]) => expect(callLocale).toBe(locale));
        });

        test('isLoadingLetter is true while definitions load and false once rounds are built', async () => {
            const resolvers: Array<(value: unknown) => void> = [];
            const pendingLetters: string[] = [];
            mockLoadDefinition.mockImplementation(
                (letter: string) =>
                    new Promise((resolve) => {
                        resolvers.push(resolve);
                        pendingLetters.push(letter);
                    }),
            );
            const { result } = renderHook(() => useSpellingBee());

            let startPromise: Promise<void> = Promise.resolve();
            act(() => {
                startPromise = result.current.handleGameStartClick();
            });

            expect(result.current.isGameStarted).toBe(true);
            expect(result.current.isLoadingLetter).toBe(true);

            await act(async () => {
                resolvers.forEach((resolve, i) => resolve(dict(`${pendingLetters[i]}palabra`)));
                await startPromise;
            });

            expect(result.current.isLoadingLetter).toBe(false);
            expect(result.current.rounds).toHaveLength(5);
            expect(result.current.currentRound).toBe(0);
        });

        test('builds each round from the formatted definition and the raw grammatical type', async () => {
            const result = await renderStartedGame(async (letter) =>
                dict(`${letter}palabra`, 'definición larga del término. Ejemplo de uso', 'sustantivo'),
            );

            expect(result.current.rounds[0]).toEqual({
                word: expect.stringMatching(/^[a-z]palabra$/),
                definition: 'Definición larga del término',
                type: 'sustantivo',
            });
        });

        test('sets loadError and builds no rounds when any initial load returns undefined', async () => {
            let call = 0;
            const result = await renderStartedGame(async (letter) => {
                call += 1;
                return call === 3 ? undefined : dict(`${letter}palabra`);
            });

            expect(result.current.loadError).toBe(true);
            expect(result.current.rounds).toEqual([]);
            expect(result.current.isLoadingLetter).toBe(false);
        });

        test('loads the next shuffled letter when a letter only has unusable candidates', async () => {
            let call = 0;
            const result = await renderStartedGame(async (letter) => {
                call += 1;
                if (call === 1) {
                    return {
                        // Too short, and an English type label in es: both unusable.
                        ...dict('sol'),
                        ...dict('aguacate', 'Fruta tropical de piel verde', 'noun'),
                    };
                }
                return dict(`${letter}palabra`);
            });

            expect(mockLoadDefinition).toHaveBeenCalledTimes(6);
            expect(result.current.rounds).toHaveLength(5);
            result.current.rounds.forEach((round) => expect(round.word).toMatch(/^[a-z]palabra$/));
            expect(result.current.loadError).toBe(false);
        });

        test('skips an es word whose only sense carries the unverified type marker', async () => {
            let call = 0;
            const result = await renderStartedGame(async (letter) => {
                call += 1;
                if (call === 1) {
                    return {
                        aguacate: {
                            definitions: [
                                { number: 1, type: 'nombre', type_extra: 'sin verificar', definition: 'Fruta tropical de piel verde' },
                            ],
                        },
                    };
                }
                return dict(`${letter}palabra`);
            });

            result.current.rounds.forEach((round) => expect(round.word).not.toBe('aguacate'));
        });

        test('plays the rounds it could build when letters run out before 5', async () => {
            let call = 0;
            const result = await renderStartedGame(async (letter) => {
                call += 1;
                return call <= 2 ? dict(`${letter}palabra`) : {};
            });

            expect(mockLoadDefinition).toHaveBeenCalledTimes(25);
            expect(result.current.loadError).toBe(false);
            expect(result.current.totalRounds).toBe(2);
            expect(result.current.maxScore).toBe(6);
        });

        test.each([
            ['es', ['x']],
            ['en', ['j', 'k', 'l', 'x', 'z']],
        ])('in locale %s tries every eligible letter once and sets loadError when none yields a round', async (locale, excluded) => {
            mockUseWordsContext.mockReturnValue(makeContext({ locale }));

            const result = await renderStartedGame(async () => ({}));

            const expectedLetters = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((l) => !excluded.includes(l));
            const calledLetters = mockLoadDefinition.mock.calls.map(([letter]) => letter).sort();
            expect(calledLetters).toEqual(expectedLetters);
            expect(result.current.loadError).toBe(true);
            expect(result.current.rounds).toEqual([]);
        });

        test('picks the round definition for the selected game level', async () => {
            const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.999);
            try {
                const result = await renderStartedGame(async (letter) => ({
                    [`${letter}palabra`]: {
                        definitions: [
                            { number: 1, type: 'sustantivo', definition: 'primera acepción bastante larga' },
                            { number: 5, type: 'sustantivo', definition: 'quinta acepción bastante larga' },
                        ],
                    },
                }));

                expect(result.current.rounds[0].definition).toBe('Primera acepción bastante larga');
            } finally {
                randomSpy.mockRestore();
            }
        });

        test('a new start after a load error clears the error and builds the rounds', async () => {
            let failing = true;
            const result = await renderStartedGame(async (letter) => (failing ? undefined : dict(`${letter}palabra`)));
            expect(result.current.loadError).toBe(true);

            failing = false;
            await startGame(result);

            expect(result.current.loadError).toBe(false);
            expect(result.current.rounds).toHaveLength(5);
        });

        test('sets loadError and discards rounds when a fallback load returns undefined', async () => {
            let call = 0;
            const result = await renderStartedGame(async (letter) => {
                call += 1;
                if (call === 1) return {};
                if (call === 6) return undefined;
                return dict(`${letter}palabra`);
            });

            expect(mockLoadDefinition).toHaveBeenCalledTimes(6);
            expect(result.current.loadError).toBe(true);
            expect(result.current.rounds).toEqual([]);
        });
    });

    describe('scoring', () => {
        test.each([
            [0, 3],
            [1, 2],
            [2, 1],
        ])('after %i wrong guesses an exact spelling scores %i points', async (wrongGuesses, points) => {
            const result = await renderStartedGame(async (letter) => dict(`${letter}palabra`));

            for (let i = 0; i < wrongGuesses; i += 1) submitGuess(result, 'zzzz');
            submitGuess(result, currentWord(result));

            expect(result.current.score).toBe(points);
            expect(result.current.feedback).toEqual({ kind: 'correct', points });
            expect(result.current.isRoundOver).toBe(true);
        });

        test('a wrong guess consumes an attempt, advances the hint and clears the input', async () => {
            const result = await renderStartedGame(async (letter) => dict(`${letter}palabra`));
            const word = currentWord(result);

            submitGuess(result, 'zzzz');

            expect(result.current.failedAttempts).toBe(1);
            expect(result.current.hint).toEqual({ length: word.length, firstLetter: word[0], lastLetter: null });
            expect(result.current.feedback).toEqual({ kind: 'wrong' });
            expect(result.current.guess).toBe('');
            expect(result.current.isRoundOver).toBe(false);
        });

        test('three wrong guesses score 0 and reveal the word', async () => {
            const result = await renderStartedGame(async (letter) => dict(`${letter}palabra`));
            const word = currentWord(result);

            submitGuess(result, 'zzzz');
            submitGuess(result, 'zzzz');
            submitGuess(result, 'zzzz');

            expect(result.current.score).toBe(0);
            expect(result.current.feedback).toEqual({ kind: 'revealed', word });
            expect(result.current.isRoundOver).toBe(true);
        });
    });

    describe('accent retry', () => {
        const accentedWords = async (letter: string) => dict(`${letter}canción`);
        const withoutAccent = (word: string) => word.replace('ó', 'o');

        test('the first accent miss is free: no attempt used, hint unchanged, guess kept', async () => {
            const result = await renderStartedGame(accentedWords);
            const guess = withoutAccent(currentWord(result));

            submitGuess(result, guess);

            expect(result.current.failedAttempts).toBe(0);
            expect(result.current.hint?.firstLetter).toBeNull();
            expect(result.current.accentRetryUsed).toBe(true);
            expect(result.current.feedback).toEqual({ kind: 'accent-miss' });
            expect(result.current.guess).toBe(guess);
        });

        test('a second accent miss in the same round counts as a wrong attempt', async () => {
            const result = await renderStartedGame(accentedWords);
            const guess = withoutAccent(currentWord(result));

            submitGuess(result, guess);
            submitGuess(result, guess);

            expect(result.current.failedAttempts).toBe(1);
            expect(result.current.feedback).toEqual({ kind: 'wrong' });
            expect(result.current.guess).toBe('');
        });

        test('the free retry still applies on the last attempt', async () => {
            const result = await renderStartedGame(accentedWords);

            submitGuess(result, 'zzzz');
            submitGuess(result, 'zzzz');
            submitGuess(result, withoutAccent(currentWord(result)));

            expect(result.current.failedAttempts).toBe(2);
            expect(result.current.isRoundOver).toBe(false);
            expect(result.current.feedback).toEqual({ kind: 'accent-miss' });
        });

        test('the next round resets the accent retry, the attempts and the hint', async () => {
            const result = await renderStartedGame(accentedWords);
            submitGuess(result, 'zzzz');
            submitGuess(result, withoutAccent(currentWord(result)));
            submitGuess(result, currentWord(result));
            expect(result.current.score).toBe(2);

            act(() => {
                result.current.handleNextClick();
            });

            expect(result.current.currentRound).toBe(1);
            expect(result.current.accentRetryUsed).toBe(false);
            expect(result.current.failedAttempts).toBe(0);
            expect(result.current.hint?.firstLetter).toBeNull();
            expect(result.current.guess).toBe('');
            expect(result.current.feedback).toBeNull();
            expect(result.current.isRoundOver).toBe(false);
        });
    });

    describe('game end', () => {
        test('finishes after the last round and play again starts a fresh game', async () => {
            const result = await renderStartedGame(async (letter) => dict(`${letter}palabra`));

            for (let round = 0; round < 5; round += 1) {
                submitGuess(result, currentWord(result));
                act(() => {
                    result.current.handleNextClick();
                });
            }

            expect(result.current.isFinished).toBe(true);
            expect(result.current.score).toBe(15);
            expect(result.current.maxScore).toBe(15);

            await act(async () => {
                await result.current.handlePlayAgainClick();
            });

            expect(result.current.isFinished).toBe(false);
            expect(result.current.score).toBe(0);
            expect(result.current.currentRound).toBe(0);
            expect(result.current.rounds).toHaveLength(5);
            expect(mockLoadDefinition).toHaveBeenCalledTimes(10);
        });
    });

    describe('ignored submissions', () => {
        test.each(['', '   '])('submitting %p changes nothing', async (value) => {
            const result = await renderStartedGame(async (letter) => dict(`${letter}palabra`));

            submitGuess(result, value);

            expect(result.current.failedAttempts).toBe(0);
            expect(result.current.accentRetryUsed).toBe(false);
            expect(result.current.feedback).toBeNull();
        });

        test('submitting after the round is over changes nothing', async () => {
            const result = await renderStartedGame(async (letter) => dict(`${letter}palabra`));
            submitGuess(result, currentWord(result));

            submitGuess(result, 'zzzz');

            expect(result.current.score).toBe(3);
            expect(result.current.failedAttempts).toBe(0);
            expect(result.current.feedback).toEqual({ kind: 'correct', points: 3 });
        });
    });
});
