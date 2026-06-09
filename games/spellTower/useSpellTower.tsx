'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useWordProcessor } from '@hooks/useWordProcessor';
import Logger from '@services/Logger';
import { getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';

const GAME_TIME = 30;

const useSpellTower = () => {
    const { locale, gameLevel, error, setError, setLoading, isLoading } = useWordsContext();

    const [countdown, setCountdown] = useState<number>(0);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [hasBeenPlayed, setHasBeenPlayed] = useState<boolean>(false);
    const [words, setWords] = useState<string[][] | null>(null);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [randomizedVariations, setRandomizedVariations] = useState<string[]>([]);
    const [correctAnswers, setCorrectAnswers] = useState<number>(0);
    const [incorrectAnswers, setIncorrectAnswers] = useState<[string, string][]>([]);

    const { processWords, processLastWords } = useWordProcessor(locale);

    const handleWordClick = (clickedIndex: number) => {
        if (words && currentWordIndex < words.length) {
            const correctWord = words[currentWordIndex][0];
            const clickedWord = randomizedVariations[clickedIndex];

            if (clickedWord === correctWord) {
                setCorrectAnswers(correctAnswers + 1);
            } else {
                setIncorrectAnswers([...incorrectAnswers, [clickedWord, correctWord]]);
                setCorrectAnswers((prevCorrectAnswers: number) =>
                    Math.max(0, prevCorrectAnswers - 1),
                );
            }

            if (currentWordIndex < words.length - 1) {
                setCurrentWordIndex(currentWordIndex + 1);
            } else {
                setGameStarted(false);
                setShowButton(true);
            }
        }
    };

    useEffect(() => {
        if (words && currentWordIndex < words.length) {
            const currentVariations = [...words[currentWordIndex]];
            setRandomizedVariations(currentVariations.sort(() => Math.random() - 0.5));
        }
    }, [words, currentWordIndex]);

    useEffect(() => {
        const fetchWords = async () => {
            const sessionWords = await getSessionWords(
                StorageService.WORDS_TOWER,
                15,
                gameLevel,
                locale,
                setError,
                { count: 75, minLength: 4 },
                30,
            );
            if (sessionWords.length > 0) {
                const gameWords = processWords(sessionWords);
                const finalGameWords = processLastWords(gameWords);
                setWords(finalGameWords);
                setShowButton(true);
            } else {
                const errorMsg = 'No words found for spell tower';
                Logger.error(errorMsg);
            }
        };

        if (!words) {
            setLoading(true);
            fetchWords().then(() => setLoading(false));
        }
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else {
            setGameStarted(false);
            setShowButton(true);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown]);

    const handleGameStartClick = () => {
        setHasBeenPlayed(true);
        setShowButton(false);
        setCurrentWordIndex(0);
        setCorrectAnswers(0);
        setIncorrectAnswers([]);
        setCountdown(GAME_TIME);
        setGameStarted(true);
    };

    const renderGameResult = (): JSX.Element => {
        return (
            <div className="results-wrapper">
                {incorrectAnswers.length > 0 && (
                    <div>
                        <em className="results-title">
                            <FormattedMessage id="incorrectWords" />
                        </em>
                        <strong className="results-title text-danger">
                            {incorrectAnswers.length}
                        </strong>
                    </div>
                )}
                {incorrectAnswers.map(([wrong, correct]: [string, string], index: number) => (
                    <div key={index}>
                        <span className="results-ko text-danger">{wrong}</span>
                        {' → '}
                        <strong className="results-ok text-success">{correct}</strong>
                    </div>
                ))}
            </div>
        );
    };

    const renderTowerBlocks = (): JSX.Element[] => {
        return Array.from({ length: correctAnswers }, (_, index) => (
            <div key={index} className="tower-block"></div>
        ));
    };

    const displayWordVariations = (): JSX.Element[] => {
        return randomizedVariations.map((variation, index) => (
            <button key={index} className="variation-btn" onClick={() => handleWordClick(index)}>
                {variation}
            </button>
        ));
    };

    return {
        error,
        countdown,
        showButton,
        words,
        gameStarted,
        hasBeenPlayed,
        correctAnswers,
        isLoading,
        handleGameStartClick,
        renderTowerBlocks,
        displayWordVariations,
        renderGameResult,
    };
};

export default useSpellTower;
