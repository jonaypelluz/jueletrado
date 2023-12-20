import { useCallback, useEffect, useRef, useState } from 'react';
import { Typography } from 'antd';
import { ForwardOutlined } from '@ant-design/icons';
import ExclusionsRules from 'src/config/ExclusionRules';
import WordRules from 'src/config/WordRules';
import { useWordProcessor } from 'src/hooks/useWordProcessor';
import Logger from 'src/services/Logger';
import StorageService from 'src/store/StorageService';
import { useWordsContext } from 'src/store/WordsContext';

const { Text } = Typography;

const HEARTS = 10;
const WORD_WIDTH = 150;
const BASE_SPEED = 6;
const SPEED_REDUCTION_INTERVAL = 10;
const MINIMUM_SPEED = 1;
const MIN_ANIMATION_DURATION = 5;
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

    const [timer, setTimer] = useState(0);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [words, setWords] = useState<WordItem[] | null>(null);
    const [incorrectWords, setIncorrectWords] = useState<WordItem[]>([]);
    const [points, setPoints] = useState<number>(0);
    const [fallingWords, setFallingWords] = useState<JSX.Element[]>([]);
    const [keyCount, setKeyCount] = useState<number>(0);
    const [hearts, setHearts] = useState<number>(HEARTS);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { processWords, processLastWords } = useWordProcessor();

    const animationHasEnded = useCallback(
        (key: number, word: WordItem) => removeWord(key, word?.correct === 'ok', word),
        [],
    );

    const removeWord = (key: number, removeHeart: boolean, word: WordItem) => {
        if (removeHeart) {
            setIncorrectWords((prevIncorrectWords: WordItem[]) => [...prevIncorrectWords, word]);
            setHearts((prevHearts: number) => {
                const newHearts = prevHearts - 1;
                if (newHearts <= 0) {
                    renderGameResult();
                    return 0;
                }
                return newHearts;
            });
        } else {
            setPoints((prevPoints: number) => prevPoints + 1);
        }
        setFallingWords((currentWords: JSX.Element[]) =>
            currentWords.filter((word) => word.key !== key.toString()),
        );
    };

    const renderGameResult = (): JSX.Element => {
        setShowButton(true);
        setGameStarted(false);

        return (
            <div className="words-rain-results">
                {incorrectWords.length > 0 && (
                    <div>
                        <Text italic style={{ fontSize: '24px', marginRight: '5px' }}>
                            Palabras incorrectas:
                        </Text>
                        <Text strong type="danger" style={{ fontSize: '24px' }}>
                            {incorrectWords.length}
                        </Text>
                    </div>
                )}
                {incorrectWords.map((item, index) => (
                    <div key={index}>
                        <Text strong type="danger" style={{ fontSize: '20px', marginRight: '5px' }}>
                            {item.word !== item.correctWord ? item.word : 'No viste'}
                        </Text>
                        <ForwardOutlined />
                        <Text strong style={{ fontSize: '24px', marginLeft: '5px', color: '#000' }}>
                            {item.correctWord}
                        </Text>
                    </div>
                ))}
            </div>
        );
    };

    const resetGame = () => {
        setHearts(HEARTS);
        setFallingWords([]);
        setIncorrectWords([]);
        setKeyCount(0);
        setPoints(0);
        setTimer(0);
    };

    const handleGameStartClick = () => {
        resetGame();
        setShowButton(false);
        setGameStarted(true);
    };

    const handleWordClick = (key: number, word: WordItem): void => {
        if (word?.correct === 'ok') {
            setHearts((prevHearts: number) => prevHearts + 1);
        }
        removeWord(key, word?.correct === 'ko', word);
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
                onClick={() => handleWordClick(key, word)}
                onAnimationEnd={() => animationHasEnded(key, word)}
            >
                <span className="word-text">{word?.word}</span>
            </div>
        );
    };

    const calculateSpeed = () => {
        const speedReduction = Math.floor(points / SPEED_REDUCTION_INTERVAL);
        return Math.max(BASE_SPEED - speedReduction, MINIMUM_SPEED);
    };

    const handleGameLogic = () => {
        setTimer((prevTimer: number) => prevTimer + 1);
        const GAME_SPEED = calculateSpeed();
        const GAME_SPEED_MULTIPLIER = Math.floor(points / 10) + 1;
        const MIN_WORDS_PER_ITERATION = 1 * GAME_SPEED_MULTIPLIER;
        const MAX_WORDS_PER_ITERATION = 3 * GAME_SPEED_MULTIPLIER - 1;

        if (wrapperRef.current && words && timer % GAME_SPEED === 0) {
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
                setFallingWords((prevWords: JSX.Element[]) => [...prevWords, newWord]);
            }

            setKeyCount((prevCount: number) => prevCount + numberOfWords);
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
            const interval = setInterval(handleGameLogic, 1000);
            return () => clearInterval(interval);
        }
    }, [gameStarted, keyCount, words, removeWord]);

    return {
        error,
        timer,
        isLoading,
        showButton,
        gameStarted,
        fallingWords,
        hearts,
        points,
        wrapperRef,
        handleGameStartClick,
        renderGameResult,
    };
};

export default useWordsRain;
