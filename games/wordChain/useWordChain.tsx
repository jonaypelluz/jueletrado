'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getFullWordSet, getWords } from '@services/WordsService';
import { SEED_POOL_SIZE, SEED_QUERY } from '@games/wordChain/config';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import {
    RejectionReason,
    buildFirstLetterIndex,
    isDeadEndLetter,
    lastChar,
    normalizeChainLetter,
    validateChainWord,
} from '@utils/ChainLetterIndex';

const TURN_TIME: Record<string, number> = { beginner: 30, intermediate: 20, advanced: 15 };
const LOW_TIME_THRESHOLD = 5;

type BestScores = Record<string, Partial<Record<string, number>>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** Stored best scores, or an empty map when missing or malformed. */
const readBestScores = (): BestScores => {
    const stored = StorageService.getItem(StorageService.WORD_CHAIN_BEST);
    return isRecord(stored) ? (stored as BestScores) : {};
};

const readBest = (locale: string, level: string | null): number => {
    if (!level) return 0;
    const forLocale: unknown = readBestScores()[locale];
    if (!isRecord(forLocale)) return 0;
    const best = forLocale[level];
    return typeof best === 'number' && Number.isFinite(best) ? best : 0;
};

const writeBest = (locale: string, level: string, score: number): void => {
    const scores = readBestScores();
    const forLocale = isRecord(scores[locale]) ? scores[locale] : {};
    StorageService.setItem(StorageService.WORD_CHAIN_BEST, { ...scores, [locale]: { ...forLocale, [level]: score } });
};

const useWordChain = () => {
    const { locale, gameLevel, error, setError, setLoadingProgress } = useWordsContext();

    // The full set is never rendered or compared: a ref avoids re-renders, the flag drives the memo.
    const wordSetRef = useRef<Set<string> | null>(null);
    const indexRef = useRef<Map<string, number> | null>(null);
    const loadStartedRef = useRef(false);
    const isStartingRef = useRef(false);
    const previousLevelRef = useRef(gameLevel);
    // Level the running game was started with: endGame scores into this slot even if the level changed.
    const playedLevelRef = useRef<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showButton, setShowButton] = useState<boolean>(false);

    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [hasBeenPlayed, setHasBeenPlayed] = useState<boolean>(false);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [chain, setChain] = useState<string[]>([]);
    const [score, setScore] = useState<number>(0);
    const [countdown, setCountdown] = useState<number>(0);
    // Bumped on each accepted word: re-arms the timer even when countdown already equals the turn time.
    const [turn, setTurn] = useState<number>(0);
    const [input, setInput] = useState<string>('');
    const [rejection, setRejection] = useState<RejectionReason | null>(null);
    const [best, setBest] = useState<number>(0);
    const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

    const head = chain.at(-1);
    const requiredLetter = head ? normalizeChainLetter(lastChar(head) ?? '').toUpperCase() : '';

    /** Loads the full set and its letter index; false when it came back empty (getFullWordSet swallows errors). */
    const loadWordSet = async (): Promise<boolean> => {
        setIsLoading(true);
        const wordSet = await getFullWordSet(locale, setError, setLoadingProgress);
        wordSetRef.current = wordSet;
        indexRef.current = buildFirstLetterIndex(wordSet);
        setShowButton(true);
        setIsLoading(false);
        return wordSet.size > 0;
    };

    useEffect(() => {
        if (!gameLevel || loadStartedRef.current) return;
        loadStartedRef.current = true;
        loadWordSet();
    }, [gameLevel, locale]);

    useEffect(() => {
        setBest(readBest(locale, gameLevel));
        setIsNewRecord(false);
    }, [locale, gameLevel]);

    useEffect(() => {
        if (previousLevelRef.current === gameLevel) return;
        previousLevelRef.current = gameLevel;
        setGameStarted(false);
        setIsGameOver(false);
        setHasBeenPlayed(false);
        setChain([]);
        setScore(0);
        setCountdown(0);
        setInput('');
        setRejection(null);
        setLoadError(false);
        setShowButton(wordSetRef.current !== null);
    }, [gameLevel]);

    const endGame = () => {
        setGameStarted(false);
        setIsGameOver(true);
        setShowButton(true);
        const level = playedLevelRef.current;
        if (level && score > readBest(locale, level)) {
            writeBest(locale, level, score);
            if (level === gameLevel) {
                setBest(score);
                setIsNewRecord(true);
            }
        }
    };

    useEffect(() => {
        if (countdown <= 0) {
            if (gameStarted) endGame();
            return;
        }
        const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, gameStarted, turn]);

    const handleGameStartClick = async (): Promise<void> => {
        const level = gameLevel;
        if (!level || !wordSetRef.current || isStartingRef.current) return;
        isStartingRef.current = true;
        setLoadError(false);

        try {
            // An empty set means the load failed: retry it instead of drawing seeds against nothing.
            if (wordSetRef.current.size === 0 && !(await loadWordSet())) {
                setLoadError(true);
                return;
            }
            const index = indexRef.current;
            const candidates = (await getWords({ locale, level, count: SEED_POOL_SIZE, ...SEED_QUERY }, setError)) ?? [];
            // The level changed while waiting: the reset effect already ran, drop this start.
            if (previousLevelRef.current !== level || !index) return;
            const seed = candidates
                .map((word) => word.normalize('NFC').toLowerCase())
                .find((word) => !isDeadEndLetter(lastChar(word) ?? '', index));
            if (!seed) {
                setLoadError(true);
                return;
            }
            startGame(level, seed);
        } finally {
            isStartingRef.current = false;
        }
    };

    const startGame = (level: string, seed: string): void => {
        playedLevelRef.current = level;

        setChain([seed]);
        setScore(0);
        setInput('');
        setRejection(null);
        setIsGameOver(false);
        setIsNewRecord(false);
        setHasBeenPlayed(true);
        setShowButton(false);
        setCountdown(TURN_TIME[level]);
        setGameStarted(true);
    };

    const handleInputChange = (value: string): void => {
        setInput(value);
    };

    const handleSubmit = (event?: React.FormEvent): void => {
        event?.preventDefault();
        const level = playedLevelRef.current;
        const index = indexRef.current;
        if (!gameStarted || !level || !wordSetRef.current || !index || !input.trim()) return;

        const result = validateChainWord(input, { requiredLetter, wordSet: wordSetRef.current, used: chain, index });
        if (!result.ok) {
            setRejection(result.reason);
            return;
        }

        setChain([...chain, result.word]);
        setScore((prev) => prev + 1);
        setCountdown(TURN_TIME[level]);
        setTurn((prev) => prev + 1);
        setInput('');
        setRejection(null);
    };

    return {
        locale,
        gameLevel,
        error,
        isLoading,
        showButton,
        loadError,
        gameStarted,
        hasBeenPlayed,
        isGameOver,
        chain,
        requiredLetter,
        countdown,
        isLowTime: gameStarted && countdown < LOW_TIME_THRESHOLD,
        score,
        best,
        isNewRecord,
        rejection,
        input,
        handleInputChange,
        handleSubmit,
        handleGameStartClick,
    };
};

export default useWordChain;
