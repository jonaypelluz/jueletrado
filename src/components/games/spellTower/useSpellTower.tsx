import { useState, useEffect } from 'react';
import { Button } from 'antd';
import { useWordsContext } from 'src/store/WordsContext';
import { useWordProcessor } from 'src/hooks/useWordProcessor';
import WordRules from 'src/config/WordRules';
import ExclusionsRules from 'src/config/ExclusionRules';
import Logger from 'src/services/Logger';
import StorageService from 'src/store/StorageService';

const GAME_TIME = 30;

const useSpellTower = () => {
    const { error, setError, setLoading, isLoading } = useWordsContext();
    const [countdown, setCountdown] = useState<number>(0);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [words, setWords] = useState<string[][] | null>(null);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [randomizedVariations, setRandomizedVariations] = useState<string[]>([]);
    const [correctAnswers, setCorrectAnswers] = useState<number>(0);

    const { processWords, processLastWords } = useWordProcessor();

    const handleWordClick = (clickedIndex: number) => {
        if (words && currentWordIndex < words.length) {
            const correctWord = words[currentWordIndex][0];
            const clickedWord = randomizedVariations[clickedIndex];

            if (clickedWord === correctWord) {
                setCorrectAnswers(correctAnswers + 1);
            } else {
                Logger.log('Incorrect choice');
            }

            if (currentWordIndex < words.length - 1) {
                setCurrentWordIndex(currentWordIndex + 1);
            } else {
                Logger.log('All words processed');
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
        const fetchWordsFromStorage = async () => {
            const storedWords = StorageService.getItem<string[]>(StorageService.WORDS_GROUP_60);

            if (storedWords) {
                const gameWords = processWords(storedWords, WordRules, ExclusionsRules);
                const finalGameWords = processLastWords(gameWords);
                setWords(finalGameWords);
                setShowButton(true);
            } else {
                const errorMsg = 'Words group 60 not found in storage';
                setError(new Error(errorMsg));
                Logger.error(errorMsg);
            }
        };

        if (!words) {
            setLoading(true);
            fetchWordsFromStorage().then(() => setLoading(false));
        }
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else {
            setShowButton(true);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown]);

    const handleButtonClick = () => {
        setCountdown(GAME_TIME);
        setShowButton(false);
        setCurrentWordIndex(0);
        setIsGameActive(true);
    };

    return {
        error,
        countdown,
        showButton,
        words,
        currentWordIndex,
        isGameActive,
        randomizedVariations,
        correctAnswers,
        handleWordClick,
        handleButtonClick,
        renderTowerBlocks: () =>
            Array.from({ length: correctAnswers }, (_, index) => (
                <div key={index} className="tower-block"></div>
            )),
        displayWordVariations: () =>
            randomizedVariations.map((variation, index) => (
                <Button key={index} onClick={() => handleWordClick(index)}>
                    {variation}
                </Button>
            )),
        isLoading,
    };
};

export default useSpellTower;
