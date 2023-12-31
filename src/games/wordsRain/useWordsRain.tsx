import { useCallback, useEffect, useRef, useState } from 'react';
import { Typography } from 'antd';
import { ForwardOutlined } from '@ant-design/icons';
import { WordItem } from '@models/types';
import Logger from '@services/Logger';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import { useWordProcessor } from 'src/hooks/useWordProcessor';

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

const useWordsRain = () => {
    const { error, setError, setLoading, isLoading } = useWordsContext();

    const [timer, setTimer] = useState(0);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [words, setWords] = useState<WordItem[] | null>(null);
    const [incorrectWords, setIncorrectWords] = useState<WordItem[]>([]);
    const [speed, setSpeed] = useState<number>(1);
    const [fallingWords, setFallingWords] = useState<JSX.Element[]>([]);
    const [hearts, setHearts] = useState<number>(HEARTS);

    const keyCountRef = useRef<number>(0);
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
                    stopGame();
                    return 0;
                }
                return newHearts;
            });
        }
        setFallingWords((currentWords: JSX.Element[]) =>
            currentWords.filter((word) => word.key !== key.toString()),
        );
    };

    const stopGame = () => {
        setShowButton(true);
        setGameStarted(false);
        setFallingWords([]);
        setHearts(HEARTS);
        setFallingWords([]);
        setSpeed(1);
        setTimer(0);
        keyCountRef.current = 0;
    };

    const resetGame = () => {
        setIncorrectWords([]);
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
        return Math.max((segmentIndex / totalSegments) * 100, 1);
    };

    const calculateGameSpeed = (timer: number): number => {
        const GAME_SPEED = Math.floor(timer / LEVEL_UP_INTERVAL) + 1;
        setSpeed(GAME_SPEED);
        return GAME_SPEED;
    };

    const calculateNumberOfWords = (totalSegments: number): number => {
        const numOfWords =
            Math.floor(Math.random() * (MAX_WORDS_PER_ITERATION - MIN_WORDS_PER_ITERATION + 1)) +
            MIN_WORDS_PER_ITERATION;
        return numOfWords > totalSegments ? totalSegments : numOfWords;
    };

    const handleGameLogic = (): void => {
        setTimer((prevTimer: number) => prevTimer + 1);

        const GAME_SPEED = calculateGameSpeed(timer);
        const timerDivider = calculateTimerDivider(GAME_SPEED);
        const tempKeyCount = keyCountRef.current;

        if (wrapperRef.current && words && timer % timerDivider === 0) {
            const totalSegments = Math.floor(wrapperRef.current.offsetWidth / WORD_WIDTH);
            const numberOfWords = calculateNumberOfWords(totalSegments);
            const animationDuration = calculatteAnimationDuration(GAME_SPEED);

            const usedSegmentsInIteration = new Set<number>();

            for (let i = 0; i < numberOfWords; i++) {
                let segmentIndex;
                do {
                    segmentIndex = Math.floor(Math.random() * totalSegments);
                } while (usedSegmentsInIteration.has(segmentIndex));

                usedSegmentsInIteration.add(segmentIndex);

                const animationPosition = calculateAnimationPosition(segmentIndex, totalSegments);

                const key = tempKeyCount + i;
                const wordIndex = key % words.length;
                const currentWord = words[wordIndex];

                const newWord = createWordBlock(
                    key,
                    currentWord,
                    animationPosition,
                    animationDuration,
                );

                setFallingWords((prevWords: JSX.Element[]) => [...prevWords, newWord]);
            }

            keyCountRef.current += numberOfWords;
        }
    };

    const createWordBlock = (
        key: number,
        word: WordItem,
        leftPercentage: number,
        duration: number,
    ) => {
        return (
            <div
                key={key}
                className="words-rain-word"
                style={{
                    width: `${WORD_WIDTH}px`,
                    left: `${leftPercentage}%`,
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

    const renderGameResult = (): JSX.Element => (
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

    useEffect(() => {
        const fetchWordsFromStorage = async () => {
            const storedWords = StorageService.getItem<string[]>(StorageService.WORDS_GROUP_80);

            if (storedWords) {
                const gameWords = processWords(storedWords);
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
                const errorMsg = 'Words group 80 not found in storage';
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
            return () => {
                clearInterval(interval);
            };
        }
    }, [gameStarted, words, removeWord]);

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
        incorrectWords,
        handleGameStartClick,
        renderGameResult,
    };
};

export default useWordsRain;
