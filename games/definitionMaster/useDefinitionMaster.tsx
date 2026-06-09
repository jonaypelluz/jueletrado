'use client';

import { useEffect, useState } from 'react';
import { Definition, DefinitionWords, QuizDefinition } from '@models/types';
import { loadDefinition } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';

const TOTAL_QUIZ_DEFINITIONS = 5;

const LETTERS_WITHOUT_DEFINITIONS: Record<string, Set<string>> = {
    es: new Set(['x']),
    en: new Set(['j', 'k', 'l', 'x', 'z']),
};

type SelectedAnswersType = { [key: string]: boolean };

const useDefinitionMaster = () => {
    const { locale, gameLevel } = useWordsContext();

    const [quizWord, setQuizWord] = useState<string>('');
    const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
    const [chosenWords, setChosenWords] = useState<DefinitionWords>({});
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);
    const [isNextButtonActive, setIsNextButtonActive] = useState<boolean>(false);
    const [isLoadingLetter, setIsLoadingLetter] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [quizWords, setQuizWords] = useState<QuizDefinition[][]>([]);
    const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswersType>({});

    const letters: string[] = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    ];

    const isLetterDisabled = (letter: string): boolean => {
        return LETTERS_WITHOUT_DEFINITIONS[locale]?.has(letter) ?? false;
    };

    const getDefinitionForLevel = (definitions: Definition[]): Definition => {
        let eligible: Definition[];
        if (gameLevel === 'beginner') {
            eligible = definitions.filter(d => Number(d.number) === 1);
        } else if (gameLevel === 'intermediate') {
            eligible = definitions.filter(d => Number(d.number) <= 3);
        } else {
            eligible = definitions;
        }
        if (eligible.length === 0) eligible = definitions;
        return eligible[Math.floor(Math.random() * eligible.length)];
    };

    const getQuizWords = (arr: DefinitionWords, selectedWord: string): QuizDefinition[] => {
        const definitions: QuizDefinition[] = [];

        const chosenDefinition = getDefinitionForLevel(arr[selectedWord]);
        definitions.push({
            isCorrect: true,
            definition: chosenDefinition.definition,
            word: selectedWord,
        });

        const shuffledKeys = Object.keys(arr).sort(() => Math.random() - 0.5);

        shuffledKeys.forEach((key) => {
            if (key !== selectedWord && definitions.length < TOTAL_QUIZ_DEFINITIONS) {
                const randomDefinition = getDefinitionForLevel(arr[key]);
                definitions.push({
                    isCorrect: false,
                    definition: randomDefinition.definition,
                    word: key,
                });
            }
        });

        definitions.sort(() => Math.random() - 0.5);

        return definitions;
    };

    const handleLetterClick = async (letter: string) => {
        setIsLoadingLetter(true);
        setLoadError(false);
        const words = await loadDefinition(letter, locale);
        setIsLoadingLetter(false);

        if (!words) {
            setLoadError(true);
            return;
        }

        const minDefs = gameLevel === 'beginner' ? 1 : gameLevel === 'intermediate' ? 2 : 3;
        const preChosenWords: DefinitionWords = {};

        for (const key in words) {
            if (words[key].definitions.length >= minDefs) {
                preChosenWords[key] = words[key].definitions;
            }
        }

        const theChosenWords: DefinitionWords = {};
        const availableKeys = Object.keys(preChosenWords);
        for (let i = availableKeys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableKeys[i], availableKeys[j]] = [availableKeys[j], availableKeys[i]];
        }
        availableKeys.slice(0, 10).forEach((key) => {
            theChosenWords[key] = preChosenWords[key];
        });
        setChosenWords(theChosenWords);
    };

    const handleResetLetterClick = () => {
        setQuizWord('');
        setCurrentQuizIndex(0);
        setChosenWords({});
        setIsQuizFinished(false);
        setIsNextButtonActive(false);
        setQuizWords([]);
        setSelectedAnswers({});
        setLoadError(false);
    };

    const handleGameStartClick = () => {
        setIsGameStarted(true);
    };

    const setTheQuizWord = () => {
        if (currentQuizIndex >= Object.keys(quizWords).length) {
            setIsQuizFinished(true);
            setCurrentQuizIndex(0);
        } else {
            const word = quizWords[currentQuizIndex].find((qW: QuizDefinition) => qW.isCorrect);
            if (word !== undefined) {
                setQuizWord(word.word);
            }
        }
    };

    const handleQuizWordClick = (word: string | undefined, isCorrect: boolean) => {
        if (word !== undefined) {
            if (isCorrect) {
                setIsNextButtonActive(true);
            }
            setSelectedAnswers((prev: SelectedAnswersType) => ({
                ...prev,
                [word]: isCorrect,
            }));
        }
    };

    const handleNextQuizWord = () => {
        setIsNextButtonActive(false);
        setSelectedAnswers({});
        setCurrentQuizIndex((prevIndex: number) => {
            const nextIndex = prevIndex + 1;

            if (nextIndex >= quizWords.length) {
                handleResetLetterClick();
                return 0;
            }

            return nextIndex;
        });
    };

    useEffect(() => {
        if (quizWords.length > 0) {
            setTheQuizWord();
        }
    }, [currentQuizIndex]);

    useEffect(() => {
        if (quizWords.length > 0 && quizWord === '') {
            setTheQuizWord();
        }
    }, [quizWords]);

    useEffect(() => {
        if (Object.keys(chosenWords).length !== 0) {
            const theQuizWords: QuizDefinition[][] = [];

            Object.keys(chosenWords).forEach((word) => {
                const wordDefinitions = getQuizWords(chosenWords, word);
                theQuizWords.push(wordDefinitions);
            });

            setQuizWords(theQuizWords);
        }
    }, [chosenWords]);

    return {
        gameLevel,
        isGameStarted,
        isLoadingLetter,
        isLetterDisabled,
        isNextButtonActive,
        isQuizFinished,
        loadError,
        letters,
        quizWord,
        quizWords,
        currentQuizIndex,
        selectedAnswers,
        handleLetterClick,
        handleGameStartClick,
        handleResetLetterClick,
        handleQuizWordClick,
        handleNextQuizWord,
    };
};

export default useDefinitionMaster;
