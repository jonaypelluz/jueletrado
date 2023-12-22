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

const HEARTS = 15;
const WORD_WIDTH = 150;
const MIN_WORDS_PER_ITERATION = 1;
const MAX_WORDS_PER_ITERATION = 3;
const BASE_ANIMATION_DURATION = 14;
const ANIMATION_DECREASE_FACTOR = 0.5;
const MIN_ANIMATION_DURATION = 1;
const LEVEL_UP_INTERVAL = 5;
const MINIMUM_TIMER_SPEED = 1;
const BASE_TIMER_SPEED = 4;
const MIN_ANIMATION_DELAY = 0;
const MAX_ANIMATION_DELAY = 2;
const NO_ANIMATION_DELAY_SPEED = 6;

interface WordItem {
    word: string;
    correct: string;
    correctWord: string;
}

const useWordsRain = () => {
    const { error, setError, setLoading, isLoading } = useWordsContext();

    const [usedSegments, setUsedSegments] = useState<number[]>([]);
    const [timer, setTimer] = useState(0);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [words, setWords] = useState<WordItem[] | null>(null);
    const [incorrectWords, setIncorrectWords] = useState<WordItem[]>([]);
    const [speed, setSpeed] = useState<number>(1);
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
        }
        setFallingWords((currentWords: JSX.Element[]) =>
            currentWords.filter((word) => word.key !== key.toString()),
        );
    };

    const resetGame = () => {
        setHearts(HEARTS);
        setFallingWords([]);
        setIncorrectWords([]);
        setKeyCount(0);
        setSpeed(1);
        setTimer(0);
    };

    const handleGameStartClick = () => {
        resetGame();
        setShowButton(false);
        setGameStarted(true);
    };

    const handleWordClick = (key: number, word: WordItem): void => {
        removeWord(key, word?.correct === 'ko', word);
    };

    const calculateTimerDivider = (GAME_SPEED: number): number => {
        const timerDivider = Math.max(
            BASE_TIMER_SPEED - Math.floor(GAME_SPEED / 2),
            MINIMUM_TIMER_SPEED,
        );
        return timerDivider;
    };

    const calculatteAnimationDuration = (GAME_SPEED: number): number => {
        return Math.max(
            BASE_ANIMATION_DURATION - GAME_SPEED * ANIMATION_DECREASE_FACTOR,
            MIN_ANIMATION_DURATION,
        );
    };

    const calculateAnimationPosition = (segmentIndex: number, totalSegments: number): number => {
        return (segmentIndex / totalSegments) * 100;
    };

    const calculateAnimationDelay = (): number => {
        return Math.random() * (MAX_ANIMATION_DELAY - MIN_ANIMATION_DELAY) + MIN_ANIMATION_DELAY;
    };

    const calculateGameSpeed = (timer: number): number => {
        const GAME_SPEED = Math.floor(timer / LEVEL_UP_INTERVAL) + 1;
        setSpeed(GAME_SPEED);
        return GAME_SPEED;
    };

    const calculateNumberOfWords = (): number => {
        return (
            Math.floor(Math.random() * (MAX_WORDS_PER_ITERATION - MIN_WORDS_PER_ITERATION + 1)) +
            MIN_WORDS_PER_ITERATION
        );
    };

    const calculateSegments = (segmentIndex: number, totalSegments: number): void => {
        if (usedSegments.length >= totalSegments) {
            setUsedSegments([segmentIndex]);
        } else {
            setUsedSegments((prevUsedSegments: number[]) => [...prevUsedSegments, segmentIndex]);
        }
    };

    const handleGameLogic = (): void => {
        setTimer((prevTimer: number) => prevTimer + 1);

        const GAME_SPEED = calculateGameSpeed(timer);
        const timerDivider = calculateTimerDivider(GAME_SPEED);

        if (wrapperRef.current && words && timer % timerDivider === 0) {
            const numberOfWords = calculateNumberOfWords();
            const animationDuration = calculatteAnimationDuration(GAME_SPEED);
            const animationDelay =
                GAME_SPEED > NO_ANIMATION_DELAY_SPEED ? 0 : calculateAnimationDelay();

            const totalSegments = Math.floor(wrapperRef.current.offsetWidth / WORD_WIDTH);
            const attemptedSegments = usedSegments;

            for (let i = 0; i < numberOfWords; i++) {
                let segmentIndex;
                do {
                    segmentIndex = Math.floor(Math.random() * totalSegments);
                    if (attemptedSegments.length >= totalSegments) {
                        setUsedSegments([segmentIndex]);
                        break;
                    }
                    if (!attemptedSegments.includes(segmentIndex)) {
                        attemptedSegments.push(segmentIndex);
                    }
                } while (usedSegments.includes(segmentIndex));
                calculateSegments(segmentIndex, totalSegments);

                const animationPosition = calculateAnimationPosition(segmentIndex, totalSegments);

                const key = keyCount + i;
                const wordIndex = key % words.length;
                const currentWord = words[wordIndex];

                const newWord = createWordBlock(
                    key,
                    currentWord,
                    animationPosition,
                    animationDelay,
                    animationDuration,
                );
                setFallingWords((prevWords: JSX.Element[]) => [...prevWords, newWord]);
            }

            setKeyCount((prevCount: number) => prevCount + numberOfWords);
        }
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

    const renderGameResult = (): JSX.Element => {
        setShowButton(true);
        setGameStarted(false);

        return (
            <div className="results-wrapper words-rain-results">
                {incorrectWords.length > 0 && (
                    <div>
                        <Text italic className="results-title">
                            Palabras incorrectas:
                        </Text>
                        <Text strong type="danger" className="results-title">
                            {incorrectWords.length}
                        </Text>
                    </div>
                )}
                {incorrectWords.map((item, index) => (
                    <div key={index}>
                        <Text strong type="danger" className="results-ko">
                            {item.word !== item.correctWord ? item.word : 'No viste'}
                        </Text>
                        <ForwardOutlined />
                        <Text strong className="results-ok" style={{ color: '#000' }}>
                            {item.correctWord}
                        </Text>
                    </div>
                ))}
            </div>
        );
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
        speed,
        wrapperRef,
        handleGameStartClick,
        renderGameResult,
    };
};

export default useWordsRain;
