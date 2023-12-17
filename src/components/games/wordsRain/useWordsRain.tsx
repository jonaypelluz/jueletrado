import { useCallback, useEffect, useRef, useState } from 'react';
import ExclusionsRules from 'src/config/ExclusionRules';
import WordRules from 'src/config/WordRules';
import { useWordProcessor } from 'src/hooks/useWordProcessor';
import Logger from 'src/services/Logger';
import StorageService from 'src/store/StorageService';
import { useWordsContext } from 'src/store/WordsContext';

const HEARTS = 15;
const WORD_WIDTH = 150;
const WORDS_INTERVAL = 3000;
const MIN_WORDS_PER_ITERATION = 1;
const MAX_WORDS_PER_ITERATION = 3;
const MIN_ANIMATION_DURATION = 7;
const MAX_ANIMATION_DURATION = 10;
const MIN_ANIMATION_DELAY = 0;
const MAX_ANIMATION_DELAY = 2;

interface WordItem {
    word: string;
    correct: string;
    correctWord: string;
}

const useWordsRain = () => {
    const { error, setError, setLoading, isLoading } = useWordsContext();

    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [words, setWords] = useState<WordItem[] | null>(null);
    const [fallingWords, setFallingWords] = useState<JSX.Element[]>([]);
    const [keyCount, setKeyCount] = useState<number>(0);
    const [hearts, setHearts] = useState<number>(HEARTS);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { processWords, processLastWords } = useWordProcessor();

    const animationHasEnded = useCallback(
        (key: number, wordCorrectness: string) => removeWord(key, wordCorrectness === 'ok'),
        [],
    );

    const removeWord = (key: number, removeHeart: boolean) => {
        if (removeHeart) {
            setHearts((prevHearts: number) => {
                const newHearts = prevHearts - 1;
                if (newHearts <= 0) {
                    resetGame();
                }
                return newHearts;
            });
        }
        setFallingWords((currentWords: JSX.Element[]) =>
            currentWords.filter((word) => word.key !== key.toString()),
        );
    };

    const resetGame = () => {
        setShowButton(true);
        setGameStarted(false);
        setHearts(HEARTS);
        setFallingWords([]);
        setKeyCount(0);
    };

    const handleGameStartClick = () => {
        setShowButton(false);
        setGameStarted(true);
    };

    const handleWordClick = (key: number, wordCorrectness: string): void => {
        removeWord(key, wordCorrectness === 'ko');
    };

    const createWordBlock = (
        key: number,
        word: WordItem,
        leftPercentage: number,
        delay: number,
        duration: number,
    ) => {
        return (
            <div
                key={key}
                className="words-rain-word"
                style={{
                    width: `${WORD_WIDTH}px`,
                    left: `${leftPercentage}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    display: 'inline-flex',
                    userSelect: 'none',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onClick={() => handleWordClick(key, word?.correct)}
                onAnimationEnd={() => animationHasEnded(key, word?.correct)}
            >
                <span className="word-text">{word?.word}</span>
            </div>
        );
    };

    const handleGameLogic = () => {
        if (wrapperRef.current && words) {
            const wrapperWidth = wrapperRef.current.offsetWidth;
            const segmentWidth = wrapperWidth / MAX_WORDS_PER_ITERATION;
            const numberOfWords =
                Math.floor(
                    Math.random() * (MAX_WORDS_PER_ITERATION - MIN_WORDS_PER_ITERATION + 1),
                ) + MIN_WORDS_PER_ITERATION;
            const chosenSegments = new Set();

            for (let i = 0; i < numberOfWords; i++) {
                let segmentIndex;
                do {
                    segmentIndex = Math.floor(Math.random() * MAX_WORDS_PER_ITERATION);
                } while (chosenSegments.has(segmentIndex));

                chosenSegments.add(segmentIndex);
                const segmentStart = segmentIndex * segmentWidth;
                const randomLeft = segmentStart + Math.random() * (segmentWidth - WORD_WIDTH);
                const randomLeftPercentage = (randomLeft / wrapperWidth) * 100;
                const randomDelay =
                    Math.random() * (MAX_ANIMATION_DELAY - MIN_ANIMATION_DELAY) +
                    MIN_ANIMATION_DELAY;
                const randomDuration =
                    Math.random() * (MAX_ANIMATION_DURATION - MIN_ANIMATION_DURATION) +
                    MIN_ANIMATION_DURATION;
                const key = keyCount + i;
                const wordIndex = key % words.length;
                const currentWord = words[wordIndex];

                const newWord = createWordBlock(
                    key,
                    currentWord,
                    randomLeftPercentage,
                    randomDelay,
                    randomDuration,
                );
                setFallingWords((prevWords) => [...prevWords, newWord]);
            }

            setKeyCount((prevCount) => prevCount + numberOfWords);
        }
    };

    useEffect(() => {
        const fetchWordsFromStorage = async () => {
            const storedWords = StorageService.getItem<string[]>(StorageService.WORDS_GROUP_80);

            if (storedWords) {
                const gameWords = processWords(storedWords, WordRules, ExclusionsRules);
                const finalGameWords = processLastWords(gameWords);
                const theGameWords = finalGameWords.flatMap((subArray) =>
                    subArray.map((word, index) => ({
                        word,
                        correct: index === 0 ? 'ok' : 'ko',
                        correctWord: subArray[0],
                    })),
                );
                setWords(theGameWords);
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
        if (gameStarted) {
            const interval = setInterval(handleGameLogic, WORDS_INTERVAL);
            return () => clearInterval(interval);
        }
    }, [gameStarted, keyCount, words, removeWord]);

    return {
        error,
        isLoading,
        showButton,
        fallingWords,
        hearts,
        wrapperRef,
        handleGameStartClick,
    };
};

export default useWordsRain;
