import { useEffect, useState } from 'react';
import { Button, Typography } from 'antd';
import { Definition, DefinitionWords, QuizDefinition } from '@models/types';
import { loadDefinition } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';

const { Title } = Typography;

const TOTAL_QUIZ_DEFINITIONS = 5;

type SelectedAnswersType = { [key: string]: boolean };

const useDefinitionMaster = () => {
    const { locale } = useWordsContext();

    const [quizWord, setQuizWord] = useState<string>('');
    const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
    const [chosenWords, setChosenWords] = useState<DefinitionWords>({});
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);
    const [isNextButtonActive, setIsNextButtonActive] = useState<boolean>(false);
    const [quizWords, setQuizWords] = useState<QuizDefinition[][]>([]);
    const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswersType>({});
    const letters: string[] = [
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'q',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z',
    ];

    const getRandomWord = (arr: DefinitionWords): string => {
        const randomKey = Math.floor(Math.random() * Object.keys(arr).length);
        const chosenKey: string = Object.keys(arr)[randomKey];
        return chosenKey;
    };

    const getRandomDefinition = (definitions: Definition[]): Definition => {
        const randomKey = Math.floor(Math.random() * definitions.length);
        return definitions[randomKey];
    };

    const getQuizWords = (arr: DefinitionWords, selectedWord: string): QuizDefinition[] => {
        const definitions: QuizDefinition[] = [];

        const chosenDefinition = getRandomDefinition(arr[selectedWord]);
        definitions.push({
            isCorrect: true,
            definition: chosenDefinition.definition,
            word: selectedWord,
        });

        const shuffledKeys = Object.keys(arr).sort(() => Math.random() - 0.5);

        shuffledKeys.forEach((key) => {
            if (key !== selectedWord && definitions.length < TOTAL_QUIZ_DEFINITIONS) {
                const randomDefinition = getRandomDefinition(arr[key]);
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
        const words = await loadDefinition(letter, locale);
        if (words) {
            const preChosenWords: DefinitionWords = {};
            for (const key in words as DefinitionWords) {
                if (words[key].definitions.length > 2) {
                    preChosenWords[key] = words[key].definitions;
                }
            }
            const theChosenWords: DefinitionWords = {};
            let i: number = 1;
            do {
                const chosenKey: string = getRandomWord(preChosenWords);
                theChosenWords[chosenKey] = preChosenWords[chosenKey];
                i++;
            } while (i < 11);
            setChosenWords(theChosenWords);
        }
    };

    const handleResetLetterClick = () => {
        setQuizWord('');
        setCurrentQuizIndex(0);
        setChosenWords({});
        setIsQuizFinished(false);
        setIsNextButtonActive(false);
        setQuizWords([]);
        setSelectedAnswers({});
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

    const beautifyDefinition = (definition: string): string => {
        const capitalizedFirstLetter = definition.charAt(0).toUpperCase();
        const withoutFirstLetter = definition.slice(1);
        const withoutPeriodAndRest = withoutFirstLetter.split('.')[0];
        return capitalizedFirstLetter + withoutPeriodAndRest;
    };

    const renderQuiz = (): JSX.Element | null => {
        if (
            !isQuizFinished &&
            Object.keys(quizWords).length !== 0 &&
            Object.prototype.hasOwnProperty.call(quizWords, currentQuizIndex)
        ) {
            return (
                <div className="definition-master-quiz">
                    <Title level={2} style={{ textAlign: 'center' }}>
                        La definición de {quizWord} es:
                    </Title>
                    {quizWords[currentQuizIndex].map((word: QuizDefinition, index: number) => {
                        const isCorrect = selectedAnswers[word.word];
                        let buttonClass = 'definition-btn';
                        if (isCorrect !== undefined) {
                            buttonClass += isCorrect ? ' correct-answer' : ' incorrect-answer';
                        }
                        return (
                            <Button
                                className={buttonClass}
                                key={index}
                                onClick={() => handleQuizWordClick(word.word, word.isCorrect)}
                            >
                                {isCorrect !== undefined && !isCorrect && (
                                    <strong>{word.word}: </strong>
                                )}
                                {beautifyDefinition(word.definition)}.
                            </Button>
                        );
                    })}
                    {isNextButtonActive && (
                        <Button
                            type="primary"
                            className="next-btn"
                            onClick={() => handleNextQuizWord()}
                        >
                            Siguiente palabra
                        </Button>
                    )}
                </div>
            );
        }
        return null;
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
        isGameStarted,
        letters,
        quizWords,
        renderQuiz,
        handleLetterClick,
        handleGameStartClick,
        handleResetLetterClick,
    };
};

export default useDefinitionMaster;
