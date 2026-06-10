'use client';

import { useEffect, useRef, useState } from 'react';
import WordGameProcessor from '@utils/WordGameProcessor';
import Logger from '@services/Logger';
import { getFullWordSet, getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';

type PendingResult = { clickedIndex: number; correctIndex: number };

const GAME_TIME = 30;

const useSpellTower = () => {
    const { locale, gameLevel, error, setError, setLoadingProgress } = useWordsContext();
    const [isLoadingWords, setIsLoadingWords] = useState(false);

    const [countdown, setCountdown] = useState<number>(0);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [hasBeenPlayed, setHasBeenPlayed] = useState<boolean>(false);
    const [words, setWords] = useState<string[][] | null>(null);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [randomizedVariations, setRandomizedVariations] = useState<string[]>([]);
    const [correctAnswers, setCorrectAnswers] = useState<number>(0);
    const [incorrectAnswers, setIncorrectAnswers] = useState<[string, string][]>([]);
    const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);

    // Ref lets handleWordClick read current gameStarted without stale closure
    const gameStartedRef = useRef(gameStarted);
    const pendingRef = useRef(false);
    useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);

    const endGame = () => {
        setGameStarted(false);
        setShowButton(true);
        setCountdown(0);
    };

    const handleWordClick = (clickedIndex: number) => {
        if (!gameStartedRef.current || pendingRef.current) return;

        const correctWord = words?.[currentWordIndex]?.[0];
        const clickedWord = randomizedVariations[clickedIndex];

        if (!correctWord || !clickedWord) return;

        const correctIndex = randomizedVariations.indexOf(correctWord);

        if (clickedWord === correctWord) {
            setCorrectAnswers(prev => prev + 1);
        } else {
            setIncorrectAnswers(prev => [...prev, [clickedWord, correctWord]]);
            setCorrectAnswers(prev => Math.max(0, prev - 1));
        }

        pendingRef.current = true;
        setPendingResult({ clickedIndex, correctIndex });
    };

    useEffect(() => {
        if (!pendingResult) return;
        const timer = setTimeout(() => {
            pendingRef.current = false;
            setPendingResult(null);
            setCurrentWordIndex(prev => {
                const nextIndex = prev + 1;
                if (!words || nextIndex >= words.length) {
                    endGame();
                }
                return nextIndex;
            });
        }, 600);
        return () => clearTimeout(timer);
    }, [pendingResult]);

    useEffect(() => {
        if (words && currentWordIndex < words.length) {
            const currentVariations = [...words[currentWordIndex]];
            setRandomizedVariations(currentVariations.sort(() => Math.random() - 0.5));
        }
    }, [words, currentWordIndex]);

    useEffect(() => {
        if (!gameLevel || words) return;

        const fetchWords = async () => {
            setIsLoadingWords(true);
            const set = await getFullWordSet(locale, setError, setLoadingProgress);
            const processor = new WordGameProcessor(locale, set);

            const sessionWords = await getSessionWords(
                StorageService.WORDS_TOWER,
                15,
                gameLevel,
                locale,
                setError,
                // Larger pool — some words lose all invalid variants after dictionary validation
                { count: 120, minLength: 4 },
                30,
            );

            if (sessionWords.length > 0) {
                const gameWords = sessionWords.map(w => processor.processWord(w));
                const finalGameWords = gameWords.map(arr =>
                    arr.length === 1 ? processor.processWordWithAccent(arr[0]) : arr
                );
                setWords(finalGameWords);
                setShowButton(true);
            } else {
                Logger.error('No words found for spell tower');
            }
            setIsLoadingWords(false);
        };

        fetchWords();
    }, [gameLevel, locale]);

    useEffect(() => {
        if (countdown <= 0) {
            if (gameStarted) endGame();
            return;
        }
        const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, gameStarted]);

    const handleGameStartClick = () => {
        setHasBeenPlayed(true);
        setShowButton(false);
        setCurrentWordIndex(0);
        setCorrectAnswers(0);
        setIncorrectAnswers([]);
        setPendingResult(null);
        pendingRef.current = false;
        setCountdown(GAME_TIME);
        setGameStarted(true);
    };

    return {
        error,
        countdown,
        gameLevel,
        showButton,
        words,
        gameStarted,
        hasBeenPlayed,
        correctAnswers,
        incorrectAnswers,
        currentWordIndex,
        randomizedVariations,
        pendingResult,
        isLoading: isLoadingWords,
        handleGameStartClick,
        handleWordClick,
    };
};

export default useSpellTower;
