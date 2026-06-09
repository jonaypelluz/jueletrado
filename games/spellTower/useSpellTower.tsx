'use client';

import { useEffect, useRef, useState } from 'react';
import WordGameProcessor from '@utils/WordGameProcessor';
import Logger from '@services/Logger';
import { getLevelWordSet, getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';

const GAME_TIME = 30;

const useSpellTower = () => {
    const { locale, gameLevel, error, setError } = useWordsContext();
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

    // Ref lets handleWordClick read current gameStarted without stale closure
    const gameStartedRef = useRef(gameStarted);
    useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);

    const endGame = () => {
        setGameStarted(false);
        setShowButton(true);
        setCountdown(0);
    };

    const handleWordClick = (clickedIndex: number) => {
        if (!gameStartedRef.current) return;

        setRandomizedVariations(current => {
            const correctWord = words?.[currentWordIndex]?.[0];
            const clickedWord = current[clickedIndex];

            if (!correctWord || !clickedWord) return current;

            if (clickedWord === correctWord) {
                setCorrectAnswers(prev => prev + 1);
            } else {
                setIncorrectAnswers(prev => [...prev, [clickedWord, correctWord]]);
                setCorrectAnswers(prev => Math.max(0, prev - 1));
            }

            setCurrentWordIndex(prev => {
                const nextIndex = prev + 1;
                if (!words || nextIndex >= words.length) {
                    endGame();
                }
                return nextIndex;
            });

            return current;
        });
    };

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
            const set = await getLevelWordSet(gameLevel, locale);
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
        isLoading: isLoadingWords,
        handleGameStartClick,
        handleWordClick,
    };
};

export default useSpellTower;
