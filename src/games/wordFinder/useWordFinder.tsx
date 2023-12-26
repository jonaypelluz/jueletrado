import React, { useEffect, useRef, useState } from 'react';
import { NonAccentedVowels } from '@config/AccentRules';
import Logger from '@services/Logger';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';

const GAME_TIMER = 180;

const useWordFinder = () => {
    const { error, setError, isLoading, setLoading } = useWordsContext();

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

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, index: number): void => {
        const newEnteredLetters = enteredLetters.slice();
        const value = event.target.value.toUpperCase();

        newEnteredLetters[index] = value.charAt(0);
        setEnteredLetters(newEnteredLetters);

        event.target.value = value.charAt(0);
        event.target.blur();

        if (index + 1 < letters.length && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1]?.focus();
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
            inputRefs.current.forEach((input: HTMLInputElement | null) => {
                if (input) input.value = '';
            });
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

    const renderInputs = (): JSX.Element[] => {
        return (
            letters &&
            letters.map((_, index: number) => (
                <input
                    key={`input-${index}`}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    onChange={(event) => handleInputChange(event, index)}
                    aria-label={`Letra ${index + 1}`}
                />
            ))
        );
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
        const fetchWordsFromStorage = async () => {
            const storedWords = StorageService.getItem<string[]>(
                StorageService.WORDS_GROUP_40_UNDER_9,
            );
            if (storedWords) {
                storedWords.shift();
                setWords(storedWords);
                setShowButton(true);
            } else {
                const errorMsg = 'Words group 60 not found in storage';
                setError(new Error(errorMsg));
                Logger.error(errorMsg);
            }
        };

        if (words.length === 0) {
            setLoading(true);
            fetchWordsFromStorage().then(() => setLoading(false));
        }
    }, []);

    return {
        error,
        isLoading,
        showButton,
        word,
        isWordComplete,
        foundWords,
        attempts,
        countdown,
        renderInputs,
        getClassForLetter,
        handleCheckClick,
        handleGameStartClick,
    };
};

export default useWordFinder;
