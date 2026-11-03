'use client';

import React, { useState } from 'react';
import { DEFINITION_LETTERS, LETTERS_WITHOUT_DEFINITIONS } from '@config/DefinitionConfig';
import { WordEntry } from '@models/types';
import { loadDefinition } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import { formatDefinition, getDefinitionForLevel } from '@utils/DefinitionPicker';
import { SpellingClue, compareSpelling, isUsableClue, pickHint } from '@utils/SpellingComparer';

const TOTAL_ROUNDS = 5;
const MAX_ATTEMPTS = 3;
const MIN_WORD_LENGTH = 4;

export type SpellingFeedback =
    | { kind: 'correct'; points: number }
    | { kind: 'accent-miss' }
    | { kind: 'wrong' }
    | { kind: 'revealed'; word: string };

const shuffle = <T,>(items: T[]): T[] => {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/** First usable clue among the dictionary's words, each candidate tried once in random order. */
const buildRound = (
    words: Record<string, WordEntry>,
    gameLevel: string | null,
    locale: string,
): SpellingClue | null => {
    const candidates = shuffle(Object.keys(words).filter((word) => Array.from(word).length >= MIN_WORD_LENGTH));
    for (const word of candidates) {
        const definition = getDefinitionForLevel(words[word].definitions, gameLevel);
        const clue = { word, definition: formatDefinition(definition.definition), type: definition.type };
        if (isUsableClue(clue, locale)) return clue;
    }
    return null;
};

/** Loads up to TOTAL_ROUNDS rounds, one per letter; null when a load fails or no round can be built. */
const loadRounds = async (locale: string, gameLevel: string | null): Promise<SpellingClue[] | null> => {
    const letters = shuffle(DEFINITION_LETTERS.filter((letter) => !LETTERS_WITHOUT_DEFINITIONS[locale]?.has(letter)));
    const rounds: SpellingClue[] = [];

    const addRound = (words: Record<string, WordEntry>) => {
        const round = buildRound(words, gameLevel, locale);
        if (round) rounds.push(round);
    };

    const batch = await Promise.all(letters.slice(0, TOTAL_ROUNDS).map((letter) => loadDefinition(letter, locale)));
    for (const words of batch) {
        if (!words) return null;
        addRound(words);
    }

    for (const letter of letters.slice(TOTAL_ROUNDS)) {
        if (rounds.length >= TOTAL_ROUNDS) break;
        const words = await loadDefinition(letter, locale);
        if (!words) return null;
        addRound(words);
    }

    return rounds.length > 0 ? rounds : null;
};

const useSpellingBee = () => {
    const { locale, gameLevel } = useWordsContext();

    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [isLoadingLetter, setIsLoadingLetter] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [rounds, setRounds] = useState<SpellingClue[]>([]);
    const [currentRound, setCurrentRound] = useState<number>(0);
    const [failedAttempts, setFailedAttempts] = useState<number>(0);
    const [accentRetryUsed, setAccentRetryUsed] = useState<boolean>(false);
    const [guess, setGuess] = useState<string>('');
    const [feedback, setFeedback] = useState<SpellingFeedback | null>(null);
    const [isRoundOver, setIsRoundOver] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);

    const round = rounds[currentRound];

    const resetRoundState = () => {
        setFailedAttempts(0);
        setAccentRetryUsed(false);
        setGuess('');
        setFeedback(null);
        setIsRoundOver(false);
    };

    const handleGameStartClick = async (): Promise<void> => {
        resetRoundState();
        setScore(0);
        setRounds([]);
        setCurrentRound(0);
        setIsFinished(false);
        setIsGameStarted(true);
        setIsLoadingLetter(true);
        setLoadError(false);

        const built = await loadRounds(locale, gameLevel);
        setIsLoadingLetter(false);
        if (built === null) {
            setLoadError(true);
            return;
        }
        setRounds(built);
    };

    const handleGuessChange = (value: string): void => {
        setGuess(value);
    };

    const handleSubmit = (event?: React.FormEvent): void => {
        event?.preventDefault();
        if (isRoundOver || !round || !guess.trim()) return;

        const result = compareSpelling(guess, round.word);
        if (result === 'exact') {
            const points = MAX_ATTEMPTS - failedAttempts;
            setScore((prev) => prev + points);
            setFeedback({ kind: 'correct', points });
            setIsRoundOver(true);
            return;
        }
        if (result === 'accent-miss' && !accentRetryUsed) {
            setAccentRetryUsed(true);
            setFeedback({ kind: 'accent-miss' });
            return;
        }

        const nextFailedAttempts = failedAttempts + 1;
        setFailedAttempts(nextFailedAttempts);
        setGuess('');
        if (nextFailedAttempts >= MAX_ATTEMPTS) {
            setFeedback({ kind: 'revealed', word: round.word });
            setIsRoundOver(true);
        } else {
            setFeedback({ kind: 'wrong' });
        }
    };

    const handleNextClick = (): void => {
        resetRoundState();
        if (currentRound + 1 >= rounds.length) {
            setIsFinished(true);
        } else {
            setCurrentRound(currentRound + 1);
        }
    };

    const handlePlayAgainClick = (): Promise<void> => handleGameStartClick();

    return {
        locale,
        gameLevel,
        isGameStarted,
        isLoadingLetter,
        loadError,
        isFinished,
        rounds,
        currentRound,
        totalRounds: rounds.length,
        failedAttempts,
        maxAttempts: MAX_ATTEMPTS,
        accentRetryUsed,
        hint: round ? pickHint(round.word, failedAttempts) : null,
        guess,
        feedback,
        isRoundOver,
        score,
        maxScore: MAX_ATTEMPTS * rounds.length,
        handleGuessChange,
        handleGameStartClick,
        handleSubmit,
        handleNextClick,
        handlePlayAgainClick,
    };
};

export default useSpellingBee;
