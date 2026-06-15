'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import createChangeRules from '@config/ChangeRules';
import Logger from '@services/Logger';
import { getFullWordSet, getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import { buildLetterChallenge, LetterChallenge } from '@utils/LetterMatchProcessor';

type PendingResult = { clickedOption: string; correct: boolean };

const GAME_TIME = 60;
const CHALLENGE_COUNT = 10;

const LEVEL_FETCH_OPTIONS: Record<string, { minLength: number; maxLength?: number }> = {
    beginner: { minLength: 4, maxLength: 6 },
    intermediate: { minLength: 4, maxLength: 8 },
    advanced: { minLength: 6 },
};

const useLetterMatcher = () => {
    const { locale, gameLevel, isLoading: isLevelLoading, error, setError, setLoadingProgress } = useWordsContext();
    const [isLoadingWords, setIsLoadingWords] = useState(false);

    const [countdown, setCountdown] = useState<number>(0);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [hasBeenPlayed, setHasBeenPlayed] = useState<boolean>(false);
    const [challenges, setChallenges] = useState<LetterChallenge[] | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [correctAnswers, setCorrectAnswers] = useState<number>(0);
    const [incorrectAnswers, setIncorrectAnswers] = useState<[string, string][]>([]);
    const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);

    const rules = useMemo(() => createChangeRules(locale), [locale]);

    // Ref lets handleOptionClick read current gameStarted without stale closure
    const gameStartedRef = useRef(gameStarted);
    const pendingRef = useRef(false);
    useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);

    const endGame = () => {
        setGameStarted(false);
        setShowButton(true);
        setCountdown(0);
    };

    const handleOptionClick = (option: string) => {
        if (!gameStartedRef.current || pendingRef.current) return;

        const challenge = challenges?.[currentIndex];
        if (!challenge) return;

        const correct = option === challenge.gapAnswer;
        if (correct) {
            setCorrectAnswers((prev) => prev + 1);
        } else {
            const chosenWord = challenge.prefix + option + challenge.suffix;
            setIncorrectAnswers((prev) => [...prev, [chosenWord, challenge.word]]);
            setCorrectAnswers((prev) => Math.max(0, prev - 1));
        }

        pendingRef.current = true;
        setPendingResult({ clickedOption: option, correct });
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
        if (gameLevel && !isLevelLoading) setShowButton(true);
    }, [gameLevel, isLevelLoading]);

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

        // Oversample heavily: in EN only ~1 word in 4 matches a confusion rule,
        // so a small draw can leave fewer than CHALLENGE_COUNT eligible words.
        const sessionWords = await getSessionWords(
            StorageService.WORDS_MATCHER,
            50,
            gameLevel,
            locale,
            setError,
            { count: 80, ...levelOptions },
        );

        const builtChallenges = sessionWords
            .map((word) => buildLetterChallenge(word, rules, fullWordSet))
            .filter((challenge): challenge is LetterChallenge => challenge !== null)
            .slice(0, CHALLENGE_COUNT);

        if (builtChallenges.length > 0) {
            setChallenges(builtChallenges);
            setCurrentIndex(0);
            setCorrectAnswers(0);
            setIncorrectAnswers([]);
            setPendingResult(null);
            pendingRef.current = false;
            setCountdown(GAME_TIME);
            setGameStarted(true);
        } else {
            // No eligible challenges built — fall back to the rules screen and
            // the play button instead of showing the (empty) results screen.
            Logger.error('No eligible challenges found for letter matcher');
            setHasBeenPlayed(false);
            setShowButton(true);
        }

        setIsLoadingWords(false);
    };

    return {
        error,
        countdown,
        gameLevel,
        isLevelLoading,
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
        handleOptionClick,
    };
};

export default useLetterMatcher;
