'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import WordGameProcessor from '@utils/WordGameProcessor';
import { FallingWordItem, RainWordItem } from '@models/types';
import Logger from '@services/Logger';
import { getFullWordSet } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';

const HEARTS = 15;
const WORD_WIDTH = 150;
const MIN_WORDS_PER_ITERATION = 1;
const MAX_WORDS_PER_ITERATION = 3;
const BASE_ANIMATION_DURATION = 12;
const ANIMATION_DECREASE_FACTOR = 0.35;
const MIN_ANIMATION_DURATION = 2;
const LEVEL_UP_INTERVAL = 10;
const BASE_SPAWN_INTERVAL = 5;
const MINIMUM_TIMER_SPEED = 1;
const GAME_OVER_FREEZE_MS = 600;

const useWordsRain = () => {
    const { locale, gameLevel, error, setError, setLoadingProgress } = useWordsContext();
    const [isLoadingWords, setIsLoadingWords] = useState(false);

    const [timer, setTimer] = useState(0);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [words, setWords] = useState<RainWordItem[] | null>(null);
    const [incorrectWords, setIncorrectWords] = useState<RainWordItem[]>([]);
    const [speed, setSpeed] = useState<number>(1);
    const [fallingWords, setFallingWords] = useState<FallingWordItem[]>([]);
    const [hearts, setHearts] = useState<number>(HEARTS);
    const [isFreezing, setIsFreezing] = useState<boolean>(false);
    const [isLevelUp, setIsLevelUp] = useState<boolean>(false);
    const [heartsFlash, setHeartsFlash] = useState<boolean>(false);

    const keyCountRef = useRef<number>(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const prevSpeedRef = useRef<number>(1);
    const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartsFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clickedKeysRef = useRef<Set<number>>(new Set());
    const isGameActiveRef = useRef<boolean>(false);
    // Refs to avoid stale closures in the game interval
    const timerRef = useRef<number>(0);
    const wordsRef = useRef<RainWordItem[] | null>(null);
    const handleGameLogicRef = useRef<() => void>(() => {});

    // Keep wordsRef in sync
    useEffect(() => {
        wordsRef.current = words;
    }, [words]);

    useEffect(() => {
        isGameActiveRef.current = gameStarted;
    }, [gameStarted]);

    // Level-up flash
    useEffect(() => {
        if (speed > prevSpeedRef.current) {
            prevSpeedRef.current = speed;
            setIsLevelUp(true);
            const t = setTimeout(() => setIsLevelUp(false), 600);
            return () => clearTimeout(t);
        }
    }, [speed]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
            if (heartsFlashTimerRef.current) clearTimeout(heartsFlashTimerRef.current);
        };
    }, []);

    const triggerHeartsFlash = useCallback(() => {
        if (heartsFlashTimerRef.current) clearTimeout(heartsFlashTimerRef.current);
        setHeartsFlash(true);
        heartsFlashTimerRef.current = setTimeout(() => setHeartsFlash(false), 400);
    }, []);

    const triggerGameOver = useCallback(() => {
        setGameStarted(false);
        setIsFreezing(true);
        if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
        freezeTimerRef.current = setTimeout(() => {
            setIsFreezing(false);
            setShowButton(true);
            setFallingWords([]);
            setHearts(HEARTS);
            setSpeed(1);
            setTimer(0);
            timerRef.current = 0;
            keyCountRef.current = 0;
            prevSpeedRef.current = 1;
        }, GAME_OVER_FREEZE_MS);
    }, []);

    // Game-over detection
    useEffect(() => {
        if (hearts === 0 && gameStarted) {
            triggerGameOver();
        }
    }, [hearts, gameStarted, triggerGameOver]);

    const animationHasEnded = useCallback(
        (key: number, word: RainWordItem) => removeWord(key, word?.correct === 'ok', word),
        [],
    );

    const removeWord = (
        key: number,
        removeHeart: boolean,
        word: RainWordItem,
        skipFlash = false,
    ) => {
        if (!isGameActiveRef.current) return;
        if (removeHeart) {
            if (!skipFlash) triggerHeartsFlash();
            setIncorrectWords((prev) => [...prev, word]);
            setHearts((prevHearts) => Math.max(prevHearts - 1, 0));
        }
        setFallingWords((current) => current.filter((f) => f.key !== key));
    };

    const handleGameStartClick = () => {
        if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
        setIsFreezing(false);
        setIncorrectWords([]);
        setShowButton(false);
        setGameStarted(true);
        timerRef.current = 0;
        clickedKeysRef.current = new Set();
    };

    const handleWordClick = (key: number, word: RainWordItem): void => {
        if (clickedKeysRef.current.has(key)) return;
        clickedKeysRef.current.add(key);

        if (word?.correct === 'ko') {
            triggerHeartsFlash();
            const el = document.querySelector(`[data-word-key="${key}"]`);
            if (el) {
                el.classList.add('word-error');
                setTimeout(() => removeWord(key, true, word, true), 350);
            } else {
                removeWord(key, true, word, true);
            }
        } else {
            removeWord(key, false, word);
        }
    };

    const calculateTimerDivider = (gameSpeed: number): number => {
        // Steps down every 5 speed levels: 5→4→3→2→1
        // Each step lasts ~50s (5 levels × 10s/level)
        return Math.max(BASE_SPAWN_INTERVAL - Math.floor((gameSpeed - 1) / 5), MINIMUM_TIMER_SPEED);
    };

    const calculateAnimationDuration = (gameSpeed: number): number => {
        return Math.max(
            BASE_ANIMATION_DURATION - (gameSpeed - 1) * ANIMATION_DECREASE_FACTOR,
            MIN_ANIMATION_DURATION,
        );
    };

    const calculateAnimationPosition = (segmentIndex: number, totalSegments: number): number => {
        return Math.max((segmentIndex / totalSegments) * 100, 1);
    };

    const calculateGameSpeed = (currentTimer: number): number => {
        const gameSpeed = Math.floor(currentTimer / LEVEL_UP_INTERVAL) + 1;
        setSpeed(gameSpeed);
        return gameSpeed;
    };

    const calculateNumberOfWords = (totalSegments: number): number => {
        const numOfWords =
            Math.floor(Math.random() * (MAX_WORDS_PER_ITERATION - MIN_WORDS_PER_ITERATION + 1)) +
            MIN_WORDS_PER_ITERATION;
        return numOfWords > totalSegments ? totalSegments : numOfWords;
    };

    const handleGameLogic = (): void => {
        // Use ref to always have the current timer value — avoids stale closure
        timerRef.current += 1;
        setTimer(timerRef.current);

        const currentTimer = timerRef.current;
        const gameSpeed = calculateGameSpeed(currentTimer);
        const timerDivider = calculateTimerDivider(gameSpeed);
        const tempKeyCount = keyCountRef.current;
        const currentWords = wordsRef.current;

        if (wrapperRef.current && currentWords && currentTimer % timerDivider === 0) {
            const totalSegments = Math.floor(wrapperRef.current.offsetWidth / WORD_WIDTH);
            const numberOfWords = calculateNumberOfWords(totalSegments);
            const animationDuration = calculateAnimationDuration(gameSpeed);

            const usedSegmentsInIteration = new Set<number>();

            for (let i = 0; i < numberOfWords; i++) {
                let segmentIndex;
                do {
                    segmentIndex = Math.floor(Math.random() * totalSegments);
                } while (usedSegmentsInIteration.has(segmentIndex));

                usedSegmentsInIteration.add(segmentIndex);

                const animationPosition = calculateAnimationPosition(segmentIndex, totalSegments);

                const key = tempKeyCount + i;
                const wordIndex = key % currentWords.length;
                const currentWord = currentWords[wordIndex];

                const newWord: FallingWordItem = {
                    key,
                    word: currentWord,
                    leftPercentage: animationPosition,
                    duration: animationDuration,
                    widthPx: WORD_WIDTH,
                };

                setFallingWords((prev) => [...prev, newWord]);
            }

            keyCountRef.current += numberOfWords;
        }
    };

    // Keep the ref current on every render so the interval always calls latest logic
    handleGameLogicRef.current = handleGameLogic;

    useEffect(() => {
        if (!gameLevel || words) return;

        const init = async () => {
            setIsLoadingWords(true);
            const set = await getFullWordSet(locale, setError, setLoadingProgress);
            const processor = new WordGameProcessor(locale, set);

            const storedWords = StorageService.getItem<string[]>(StorageService.WORDS_RAIN);
            if (storedWords) {
                const gameWords = storedWords.map(w => processor.processWord(w));
                const finalGameWords = gameWords.map(arr =>
                    arr.length === 1 ? processor.processWordWithAccent(arr[0]) : arr
                );
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
                const errorMsg = 'No words found for words rain';
                setError(new Error(errorMsg));
                Logger.error(errorMsg);
            }
            setIsLoadingWords(false);
        };

        init();
    }, [gameLevel, locale]);

    // Interval only depends on gameStarted — uses ref to avoid stale closure and
    // prevent the interval from being torn down and recreated on every render.
    useEffect(() => {
        if (gameStarted) {
            const interval = setInterval(() => handleGameLogicRef.current(), 1000);
            return () => clearInterval(interval);
        }
    }, [gameStarted]);

    return {
        error,
        timer,
        gameLevel,
        isLoading: isLoadingWords,
        showButton,
        gameStarted,
        isFreezing,
        isLevelUp,
        heartsFlash,
        fallingWords,
        hearts,
        totalHearts: HEARTS,
        speed,
        wrapperRef,
        incorrectWords,
        animationHasEnded,
        handleGameStartClick,
        handleWordClick,
    };
};

export default useWordsRain;
