'use client';

import { useEffect, useState } from 'react';
import { DEFINITION_LETTERS, LETTERS_WITHOUT_DEFINITIONS } from '@config/DefinitionConfig';
import { MIN_DEFINITIONS_BY_LEVEL, TOTAL_QUIZ_DEFINITIONS } from '@games/definitionMaster/config';
import { DefinitionWords, QuizDefinition } from '@models/types';
import { loadDefinition } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import { getDefinitionForLevel } from '@utils/DefinitionPicker';

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
    const [quizScore, setQuizScore] = useState<number>(0);

    const isLetterDisabled = (letter: string): boolean => {
        return LETTERS_WITHOUT_DEFINITIONS[locale]?.has(letter) ?? false;
    };

    const getQuizWords = (arr: DefinitionWords, selectedWord: string): QuizDefinition[] => {
        const definitions: QuizDefinition[] = [];

        const chosenDefinition = getDefinitionForLevel(arr[selectedWord], gameLevel);
        definitions.push({
            isCorrect: true,
            definition: chosenDefinition.definition,
            word: selectedWord,
        });

        const shuffledKeys = Object.keys(arr).sort(() => Math.random() - 0.5);

        shuffledKeys.forEach((key) => {
            if (key !== selectedWord && definitions.length < TOTAL_QUIZ_DEFINITIONS) {
                const randomDefinition = getDefinitionForLevel(arr[key], gameLevel);
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

        const minDefs = MIN_DEFINITIONS_BY_LEVEL[gameLevel ?? ''] ?? MIN_DEFINITIONS_BY_LEVEL.advanced;
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
        setQuizScore(0);
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
        if (word === undefined) return;

        if (isCorrect) {
            setQuizScore(prev => prev + 1);
            setIsNextButtonActive(true);
            setSelectedAnswers((prev: SelectedAnswersType) => ({ ...prev, [word]: true }));
        } else {
            setSelectedAnswers((prev: SelectedAnswersType) => ({
                ...prev,
                [word]: false,
                [quizWord]: true,
            }));
            setIsNextButtonActive(true);
        }
    };

    const handleNextQuizWord = () => {
        const nextIndex = currentQuizIndex + 1;
        setIsNextButtonActive(false);
        setSelectedAnswers({});

        if (nextIndex >= quizWords.length) {
            setIsQuizFinished(true);
        } else {
            setCurrentQuizIndex(nextIndex);
        }
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
        letters: DEFINITION_LETTERS,
        quizWord,
        quizWords,
        quizScore,
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
