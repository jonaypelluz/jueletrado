'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { NonAccentedVowels } from '@config/AccentRules';
import Logger from '@services/Logger';
import { getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';

const GAME_TIMER = 180;

const useWordFinder = () => {
    const { locale, gameLevel, error, setError } = useWordsContext();
    const [isLoadingWords, setIsLoadingWords] = useState<boolean>(false);

    const [countdown, setCountdown] = useState<number>(0);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [words, setWords] = useState<string[]>([]);
    const [word, setWord] = useState<string | undefined>();
    const [letters, setLetters] = useState<string[]>([]);
    const [foundWords, setFoundWords] = useState<{ word: string; found: boolean }[]>([]);

    const [enteredLetters, setEnteredLetters] = useState<string[]>([]);
    const [isWordComplete, setIsWordComplete] = useState<boolean>(false);
    const [attempts, setAttempts] = useState<string[][]>([]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const generateWord = () => {
        const newWords = [...words];

        if (newWords.length > 0) {
            const removedWord = newWords.shift()!;
            setWords(newWords);
            setWord(removedWord);
        }
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>, index: number): void => {
        const newEnteredLetters = enteredLetters.slice();
        const value = event.target.value.toUpperCase();

        newEnteredLetters[index] = value.charAt(0);
        setEnteredLetters(newEnteredLetters);

        event.target.value = value.charAt(0);
        event.target.blur();

        let nextIndex = index + 1;
        while (nextIndex < letters.length && newEnteredLetters[nextIndex]) {
            nextIndex++;
        }
        if (nextIndex < letters.length) {
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const compareLetters = (letter1: string, letter2: string): boolean => {
        const lowerLetter1 = letter1.toLowerCase();
        const lowerLetter2 = letter2.toLowerCase();
        const accentedVariant = NonAccentedVowels[lowerLetter1] || lowerLetter1;
        return lowerLetter1 === lowerLetter2 || accentedVariant === lowerLetter2;
    };

    const nextWord = (word: string, found: boolean): void => {
        setFoundWords((prevFoundWords: { word: string; found: boolean }[]) => [
            ...prevFoundWords,
            { word, found },
        ]);

        setAttempts([]);
        setEnteredLetters([]);
        setIsWordComplete(false);
        setWord(undefined);
        inputRefs.current.forEach((input: HTMLInputElement | null) => {
            if (input) input.value = '';
        });

        generateWord();
    };

    const handleCheckClick = (): void => {
        if (word && attempts.length >= letters.length) {
            nextWord(word, false);
            return;
        }

        const currentWord = enteredLetters.join('');
        const isMatch =
            word &&
            currentWord.length === word.length &&
            currentWord
                .split('')
                .every((letter: string, index: number) => compareLetters(letter, word[index]));

        setEnteredLetters([]);
        setIsWordComplete(false);

        if (isMatch) {
            nextWord(word, isMatch);
        } else {
            setAttempts([...attempts, enteredLetters]);

            const prefilledLetters = enteredLetters.map((letter, index) =>
                getClassForLetter(letter, index) === 'ok' ? letter : ''
            );
            setEnteredLetters(prefilledLetters);

            inputRefs.current.forEach((input, index) => {
                if (input) input.value = prefilledLetters[index] ?? '';
            });

            const firstEmptyIndex = prefilledLetters.findIndex((l) => l === '');
            if (firstEmptyIndex >= 0) {
                inputRefs.current[firstEmptyIndex]?.focus();
            }
        }
    };

    const getClassForLetter = (attemptLetter: string, index: number): string => {
        if (compareLetters(attemptLetter, letters[index])) {
            return 'ok';
        } else if (letters.some((letter: string) => compareLetters(attemptLetter, letter))) {
            return 'not-ok';
        }
        return 'ko';
    };

    const resetGame = (): void => {
        setWord(undefined);
        setEnteredLetters([]);
        setAttempts([]);
        setShowButton(true);
    };

    const handleGameStartClick = (): void => {
        generateWord();
        setFoundWords([]);
        setCountdown(GAME_TIMER);
        setShowButton(false);
        setIsWordComplete(false);
    };

    useEffect(() => {
        if (enteredLetters.length > 0) {
            setIsWordComplete(enteredLetters.join('').length === letters.length);
        }
    }, [enteredLetters]);

    useEffect(() => {
        if (isWordComplete) {
            handleCheckClick();
        }
    }, [isWordComplete]);

    useEffect(() => {
        if (letters.length > 0) {
            inputRefs.current = inputRefs.current.slice(0, letters.length);
        }
    }, [letters]);

    useEffect(() => {
        if (word) {
            const theLetters = word.split('');
            setLetters(theLetters);
        }
    }, [word]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prevCountdown: number) => prevCountdown - 1);
            }, 1000);
        } else if (countdown === 0) {
            resetGame();
        }

        return () => clearInterval(interval);
    }, [countdown]);

    useEffect(() => {
        if (!gameLevel) return;

        const fetchWords = async () => {
            const sessionWords = await getSessionWords(
                StorageService.WORDS_FINDER,
                10,
                gameLevel,
                locale,
                setError,
                { count: 60, maxLength: 9, minLength: 4 },
                20,
            );
            if (sessionWords.length > 0) {
                setWords(sessionWords);
                setShowButton(true);
            } else {
                const errorMsg = 'No words found for word finder';
                Logger.error(errorMsg);
            }
        };

        if (words.length === 0) {
            setIsLoadingWords(true);
            fetchWords().then(() => setIsLoadingWords(false));
        }
    }, [gameLevel]);

    return {
        error,
        gameLevel,
        isLoading: isLoadingWords,
        showButton,
        word,
        letters,
        inputRefs,
        isWordComplete,
        foundWords,
        attempts,
        countdown,
        getClassForLetter,
        handleInputChange,
        handleCheckClick,
        handleGameStartClick,
    };
};

export default useWordFinder;
