'use client';

import { useEffect, useRef, useState } from 'react';
import { AccentChallenge, buildChallenge } from '@utils/AccentGameProcessor';
import Logger from '@services/Logger';
import { getFullWordSet, getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';

type PendingResult = { clickedIndex: number; correctIndex: number };

const GAME_TIME = 60;
const CHALLENGE_COUNT = 10;
const CHALLENGES_PER_GROUP = 5;

const LEVEL_FETCH_OPTIONS: Record<string, { minLength: number; maxLength?: number }> = {
    beginner: { minLength: 4, maxLength: 6 },
    intermediate: { minLength: 5, maxLength: 8 },
    advanced: { minLength: 6 },
};

/** Picks up to `count` challenges, aiming for an even split of accented / non-accented words. */
const selectChallenges = (challenges: AccentChallenge[], count: number): AccentChallenge[] => {
    const accented = challenges.filter((c) => c.accentIndex !== -1);
    const unaccented = challenges.filter((c) => c.accentIndex === -1);

    const perGroup = Math.min(CHALLENGES_PER_GROUP, accented.length, unaccented.length);
    const selected = [...accented.slice(0, perGroup), ...unaccented.slice(0, perGroup)];

    const remaining = [...accented.slice(perGroup), ...unaccented.slice(perGroup)];
    for (const challenge of remaining) {
        if (selected.length >= count) break;
        selected.push(challenge);
    }

    return selected.sort(() => Math.random() - 0.5).slice(0, count);
};

const useAccentFixer = () => {
    const { locale, gameLevel, error, setError, setLoadingProgress } = useWordsContext();
    const [isLoadingWords, setIsLoadingWords] = useState(false);

    const [countdown, setCountdown] = useState<number>(0);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [hasBeenPlayed, setHasBeenPlayed] = useState<boolean>(false);
    const [challenges, setChallenges] = useState<AccentChallenge[] | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [correctAnswers, setCorrectAnswers] = useState<number>(0);
    const [incorrectAnswers, setIncorrectAnswers] = useState<[string, string][]>([]);
    const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);

    // Ref lets handle*Click read current gameStarted without stale closure
    const gameStartedRef = useRef(gameStarted);
    const pendingRef = useRef(false);
    useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);

    const endGame = () => {
        setGameStarted(false);
        setShowButton(true);
        setCountdown(0);
    };

    const handleVowelClick = (index: number) => {
        if (!gameStartedRef.current || pendingRef.current) return;

        const challenge = challenges?.[currentIndex];
        if (!challenge) return;

        if (index === challenge.accentIndex) {
            setCorrectAnswers((prev) => prev + 1);
        } else {
            setIncorrectAnswers((prev) => [...prev, [challenge.displayed, challenge.original]]);
            setCorrectAnswers((prev) => Math.max(0, prev - 1));
        }

        pendingRef.current = true;
        setPendingResult({ clickedIndex: index, correctIndex: challenge.accentIndex });
    };

    const handleNoAccentClick = () => {
        if (!gameStartedRef.current || pendingRef.current) return;

        const challenge = challenges?.[currentIndex];
        if (!challenge) return;

        if (challenge.accentIndex === -1) {
            setCorrectAnswers((prev) => prev + 1);
        } else {
            setIncorrectAnswers((prev) => [...prev, [challenge.displayed, challenge.original]]);
            setCorrectAnswers((prev) => Math.max(0, prev - 1));
        }

        pendingRef.current = true;
        setPendingResult({ clickedIndex: -2, correctIndex: challenge.accentIndex });
    };

    useEffect(() => {
        if (!pendingResult) return;
        const timer = setTimeout(() => {
            pendingRef.current = false;
            setPendingResult(null);
            setCurrentIndex((prev) => {
                const nextIndex = prev + 1;
                if (!challenges || nextIndex >= challenges.length) {
                    endGame();
                }
                return nextIndex;
            });
        }, 800);
        return () => clearTimeout(timer);
    }, [pendingResult]);

    useEffect(() => {
        if (gameLevel) setShowButton(true);
    }, [gameLevel]);

    useEffect(() => {
        if (countdown <= 0) {
            if (gameStarted) endGame();
            return;
        }
        const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, gameStarted]);

    const handleGameStartClick = async () => {
        setHasBeenPlayed(true);
        setShowButton(false);
        setIsLoadingWords(true);

        const fullWordSet = await getFullWordSet(locale, setError, setLoadingProgress);
        const levelOptions = LEVEL_FETCH_OPTIONS[gameLevel ?? 'beginner'];

        const sessionWords = await getSessionWords(
            StorageService.WORDS_ACCENT,
            30,
            gameLevel,
            locale,
            setError,
            { count: 80, ...levelOptions },
        );

        const builtChallenges = sessionWords
            .map((word) => buildChallenge(word, fullWordSet))
            .filter((challenge): challenge is AccentChallenge => challenge !== null);

        const selected = selectChallenges(builtChallenges, CHALLENGE_COUNT);

        if (selected.length > 0) {
            setChallenges(selected);
            setCurrentIndex(0);
            setCorrectAnswers(0);
            setIncorrectAnswers([]);
            setPendingResult(null);
            pendingRef.current = false;
            setCountdown(GAME_TIME);
            setGameStarted(true);
        } else {
            Logger.error('No eligible challenges found for accent fixer');
            setShowButton(true);
        }

        setIsLoadingWords(false);
    };

    return {
        error,
        countdown,
        gameLevel,
        showButton,
        challenges,
        currentIndex,
        gameStarted,
        hasBeenPlayed,
        correctAnswers,
        incorrectAnswers,
        pendingResult,
        isLoading: isLoadingWords,
        handleGameStartClick,
        handleVowelClick,
        handleNoAccentClick,
    };
};

export default useAccentFixer;
