'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { AccentedVowels } from '@config/AccentRules';
import { ICell } from '@models/interfaces';
import { Definition, DefinitionWords, Position, SelectedWord } from '@models/types';
import { loadDefinition } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';

type crosswordWord = {
    word: string;
    position: Position;
    direction: string;
};

type PossibleWord = {
    word: string;
    previousWordIndex: number;
    wordIndex: number;
};

const GRID_SIZE = 15;
const GRID_SIZE_PX = 50;
const TOTAL_CROSSWORDS_WORDS = 8;
const MIN_INITIAL_POSITION_RANGE = 2;
const MAX_INITIAL_POSITION_RANGE = 4;
const MAX_PLACEMENT_PER_WORD = 2;
const MAX_POSSIBLE_WORDS_PER_WORD = 4;
const letters: string[] = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
];

const originalColors: string[] = [
    '#1677FF', '#008000', '#FFFF00', '#FFA500', '#800080',
    '#A52A2A', '#FFC0CB', '#00FFFF', '#FF00FF', '#008080',
    '#000080', '#800000', '#808000', '#FFD700',
];

const matrixInitialState = (): ICell[][] =>
    Array(GRID_SIZE)
        .fill(null)
        .map(() =>
            Array(GRID_SIZE)
                .fill(null)
                .map(() => ({ char: '', color: '', filled: false, isCorrect: false })),
        );

const useCrossWordPuzzle = () => {
    const { locale, gameLevel } = useWordsContext();

    const [wordsList, setWordsList] = useState<string[]>([]);
    const [allDefinitions, setAllDefinitions] = useState<DefinitionWords>({});
    const [selectedWords, setSelectedWords] = useState<SelectedWord>({});
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [crossword, setCrossword] = useState<ICell[][]>(matrixInitialState);
    const [firstWord, setFirstWord] = useState<string>('');
    const [crosswordWords, setCrosswordWords] = useState<crosswordWord[]>([]);
    const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());

    // Updated synchronously during generation so each word placement sees the
    // full current grid — avoids the stale React state snapshot problem.
    const workingMatrixRef = useRef<ICell[][]>(matrixInitialState());
    // Kept in a ref to avoid shared module-level mutable state across instances.
    const commonColorsRef = useRef([...originalColors]);

    useEffect(() => {
        if (wordsList.length > 0) {
            const word = wordsList[Math.floor(Math.random() * wordsList.length)];
            setFirstWord(word);
        }
    }, [wordsList]);

    useEffect(() => {
        if (Object.keys(selectedWords).length < TOTAL_CROSSWORDS_WORDS) {
            const nextWord = selectNextWordPlacement();
            if (nextWord !== undefined) {
                addWordsToMatrix(nextWord);
            }
        }
    }, [crosswordWords]);

    useEffect(() => {
        if (firstWord !== '') {
            const word = placeFirstWord(firstWord);
            setCrosswordWords((prevWords: crosswordWord[]) => [...prevWords, word]);
        }
    }, [firstWord]);

    const getRandomNumber = (min: number, max: number): number => {
        return Math.floor(Math.random() * (max - min) + min);
    };

    const handleGameStartClick = () => {
        resetCrossword();
        generateCrossword();
        setIsGameStarted(true);
    };

    const resetCrossword = () => {
        const freshMatrix = matrixInitialState();
        workingMatrixRef.current = freshMatrix;
        commonColorsRef.current = [...originalColors];
        setFirstWord('');
        setSelectedWords({});
        setCrossword(freshMatrix);
        setCrosswordWords([]);
        setAllDefinitions({});
        setWordsList([]);
        setIsComplete(false);
        setCompletedWords(new Set());
    };

    const getWordsFromRandomLetters = async (count: number): Promise<DefinitionWords> => {
        const shuffledLetters = [...letters].sort(() => 0.5 - Math.random()).slice(0, count);

        const promises = shuffledLetters.map((letter) => loadDefinition(letter, locale));
        const letterDefinitions = await Promise.all(promises);

        const mergedDefinitions = letterDefinitions.reduce<Record<string, unknown>>(
            (acc, definition) => ({ ...acc, ...(definition ?? {}) }),
            {},
        );

        const definitions: DefinitionWords = Object.entries(mergedDefinitions)
            .sort(() => Math.random() - 0.5)
            .reduce<DefinitionWords>((obj, [key, value]) => {
                const newKey = key
                    .split('')
                    .map((char) => AccentedVowels[char] || char)
                    .join('');
                obj[newKey] = (value as { definitions: Definition[] }).definitions;
                return obj;
            }, {});

        return definitions;
    };

    const generateCrossword = async () => {
        const definitions = await getWordsFromRandomLetters(6);
        setAllDefinitions(definitions);
        setWordsList(Object.keys(definitions).sort(() => Math.random() - 0.5));
    };

    const selectNextWordPlacement = (): crosswordWord => {
        const randomIndex = Math.floor(Math.random() * crosswordWords.length);
        return crosswordWords[randomIndex];
    };

    const addWordsToMatrix = (word: crosswordWord) => {
        const possibleWords = collectPossibleWords(word.word);
        tryPlaceWord(possibleWords, word);
    };

    const placeFirstWord = (word: string): crosswordWord => {
        const wordDirection = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const position = { row: 0, col: 0 };
        const color = getRandomColor();

        if (wordDirection === 'horizontal') {
            position.row = getRandomNumber(MIN_INITIAL_POSITION_RANGE, MAX_INITIAL_POSITION_RANGE);
            position.col = getRandomNumber(MIN_INITIAL_POSITION_RANGE, GRID_SIZE - word.length);
            addWordToCrosswordMatrix(word, position, wordDirection, color);
        } else {
            position.row = getRandomNumber(MIN_INITIAL_POSITION_RANGE, GRID_SIZE - word.length);
            position.col = getRandomNumber(MIN_INITIAL_POSITION_RANGE, MAX_INITIAL_POSITION_RANGE);
            addWordToCrosswordMatrix(word, position, wordDirection, color);
        }

        const wordDefinitions = allDefinitions[word] ?? [];
        const randomDef = wordDefinitions[Math.floor(Math.random() * wordDefinitions.length)];
        setSelectedWords((prevWords: SelectedWord) => ({
            ...prevWords,
            [word]: {
                definition: wordDefinitions,
                displayDefinition: randomDef?.definition ?? '',
                position: position,
                direction: wordDirection,
                color: color,
            },
        }));

        return { word, position, direction: wordDirection };
    };

    const collectPossibleWords = (selectedWord: string): PossibleWord[] => {
        const possibleWords: PossibleWord[] = [];
        const addedWords = new Set();
        const selectedWordsList = Object.keys(selectedWords);
        const charWordCount: { [key: string]: number } = {};

        const findNthOccurrence = (str: string, char: string, occurrence: number) => {
            let count = 0;
            for (let i = 0; i < str.length; i++) {
                if (str[i] === char) {
                    count++;
                    if (count === occurrence) return i;
                }
            }
            return -1;
        };

        wordsList.forEach((word: string) => {
            if (selectedWordsList.includes(word)) return;

            const charOccurrencesInSelectedWord: { [key: string]: number } = {};

            for (let i = 0; i < selectedWord.length; i++) {
                const char = selectedWord[i];
                if (!charOccurrencesInSelectedWord[char]) {
                    charOccurrencesInSelectedWord[char] = 0;
                }
                charOccurrencesInSelectedWord[char]++;
                const charKey = char + charOccurrencesInSelectedWord[char];

                if (!charWordCount[charKey]) charWordCount[charKey] = 0;
                if (charWordCount[charKey] >= MAX_POSSIBLE_WORDS_PER_WORD) continue;

                const matchIndex = findNthOccurrence(
                    word,
                    char,
                    charOccurrencesInSelectedWord[char],
                );

                if (matchIndex !== -1 && !addedWords.has(word)) {
                    possibleWords.push({ word, previousWordIndex: i, wordIndex: matchIndex });
                    addedWords.add(word);
                    charWordCount[charKey] += 1;
                    if (charWordCount[charKey] >= MAX_POSSIBLE_WORDS_PER_WORD) break;
                }
            }
        });

        return possibleWords;
    };

    const getRandomColor = () => {
        const randomIndex = Math.floor(Math.random() * commonColorsRef.current.length);
        const [color] = commonColorsRef.current.splice(randomIndex, 1);
        return color;
    };

    const addWordToCrosswordMatrix = (
        word: string,
        position: Position,
        direction: string,
        color: string,
    ): void => {
        const matrix = workingMatrixRef.current.map((row) => [...row]);

        for (let i = 0; i < word.length; i++) {
            if (direction === 'horizontal') {
                matrix[position.row][position.col + i] = {
                    char: word[i],
                    color: matrix[position.row][position.col + i].filled ? '#808080' : color,
                    filled: true,
                    isCorrect: false,
                };
            } else {
                matrix[position.row + i][position.col] = {
                    char: word[i],
                    color: matrix[position.row + i][position.col].filled ? '#808080' : color,
                    filled: true,
                    isCorrect: false,
                };
            }
        }

        workingMatrixRef.current = matrix;
        setCrossword(matrix);
    };

    const hasNearbyWords = (
        startRow: number,
        startCol: number,
        wordLength: number,
        direction: 'vertical' | 'horizontal',
    ): boolean => {
        const positionsToCheck = findWordPositions(startRow, startCol, wordLength, direction);
        for (const pos of positionsToCheck) {
            if (checkCollisionPoints(pos.row, pos.col)) return true;
        }
        return false;
    };

    const findWordPositions = (
        startRow: number,
        startCol: number,
        wordLength: number,
        direction: string,
    ) => {
        const positions = [];

        if (direction === 'horizontal') {
            if (startCol + wordLength <= GRID_SIZE) {
                for (let i = 0; i < wordLength; i++) {
                    positions.push({ row: startRow, col: startCol + i });
                }
            }
        } else if (direction === 'vertical') {
            if (startRow + wordLength <= GRID_SIZE) {
                for (let i = 0; i < wordLength; i++) {
                    positions.push({ row: startRow + i, col: startCol });
                }
            }
        }

        return positions.slice(3);
    };

    const checkCollisionPoints = (row: number, col: number): boolean => {
        const positions = [
            { r: row - 1, c: col - 1 },
            { r: row - 1, c: col + 1 },
            { r: row + 1, c: col - 1 },
            { r: row + 1, c: col + 1 },
        ];

        const isInBounds = (r: number, c: number) =>
            r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;

        return positions.some(
            ({ r, c }) => isInBounds(r, c) && workingMatrixRef.current[r][c].filled,
        );
    };

    const tryPlaceWord = (possibleWords: PossibleWord[], anchorWord: crosswordWord) => {
        const { direction, position } = anchorWord;
        let wordsPlace = 0;
        let removeMainWord = false;

        for (let i = 0; i < possibleWords.length; i++) {
            if (wordsPlace >= MAX_PLACEMENT_PER_WORD) break;

            // Read fresh each iteration so prior placements in this loop are visible
            const matrix = workingMatrixRef.current;
            const { word, previousWordIndex, wordIndex } = possibleWords[i];
            const newWordPosition: Position = { row: 0, col: 0 };
            const newDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';

            if (direction === 'horizontal') {
                newWordPosition.row = position.row - wordIndex;
                newWordPosition.col = position.col + previousWordIndex;
            } else {
                newWordPosition.row = position.row + previousWordIndex;
                newWordPosition.col = position.col - wordIndex;
            }

            if (
                newWordPosition.row >= 0 &&
                newWordPosition.row + word.length <= GRID_SIZE &&
                newWordPosition.col >= 0 &&
                newWordPosition.col + word.length <= GRID_SIZE
            ) {
                let canPlaceWord = true;

                for (let j = 0; j < word.length; j++) {
                    if (newDirection === 'horizontal') {
                        if (
                            matrix[newWordPosition.row][newWordPosition.col + j].filled &&
                            matrix[newWordPosition.row][newWordPosition.col + j].char !== word[j]
                        ) {
                            canPlaceWord = false;
                            break;
                        }
                    } else {
                        if (
                            matrix[newWordPosition.row + j][newWordPosition.col].filled &&
                            matrix[newWordPosition.row + j][newWordPosition.col].char !== word[j]
                        ) {
                            canPlaceWord = false;
                            break;
                        }
                    }
                }

                if (
                    hasNearbyWords(
                        newWordPosition.row,
                        newWordPosition.col,
                        word.length,
                        newDirection,
                    )
                ) {
                    canPlaceWord = false;
                }

                if (canPlaceWord) {
                    const color = getRandomColor();
                    addWordToCrosswordMatrix(word, newWordPosition, newDirection, color);
                    const wordDefs = allDefinitions[word] ?? [];
                    const chosenDef = wordDefs[Math.floor(Math.random() * wordDefs.length)];
                    setSelectedWords((prevWords: SelectedWord) => ({
                        ...prevWords,
                        [word]: {
                            definition: wordDefs,
                            displayDefinition: chosenDef?.definition ?? '',
                            position: newWordPosition,
                            direction: newDirection,
                            color: color,
                        },
                    }));
                    setCrosswordWords((prevWords: crosswordWord[]) => [
                        ...prevWords,
                        { word, position: newWordPosition, direction: newDirection },
                    ]);
                    removeMainWord = true;
                    wordsPlace++;
                }
            }
        }

        if (removeMainWord) {
            setCrosswordWords((currentWords: crosswordWord[]) =>
                currentWords.filter((cw) => cw.word !== anchorWord.word),
            );
        }
    };

    const checkCellValue =
        (i: number, j: number) => (event: ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            const newCrossword = crossword.map((row) => [...row]);
            if (value.length === 0) {
                event.target.style.backgroundColor = '#ff4d4f';
                newCrossword[i][j] = { ...newCrossword[i][j], isCorrect: false };
            } else {
                if (value.toLowerCase() === crossword[i][j].char.toLowerCase()) {
                    event.target.style.backgroundColor = '#fff';
                    event.target.style.borderColor = '#000';
                    newCrossword[i][j] = { ...newCrossword[i][j], isCorrect: true };
                } else {
                    event.target.style.backgroundColor = '#ff4d4f';
                    newCrossword[i][j] = { ...newCrossword[i][j], isCorrect: false };
                }
            }
            setCrossword(newCrossword);
            checkCompletedWords(newCrossword);
            checkCrosswordComplete(newCrossword);
        };

    const checkCompletedWords = (matrix: ICell[][]): void => {
        const newCompleted = new Set<string>();
        Object.entries(selectedWords).forEach(([wordKey, wordData]) => {
            let isCompleted = true;
            for (let i = 0; i < wordKey.length; i++) {
                const cell =
                    wordData.direction === 'horizontal'
                        ? matrix[wordData.position.row][wordData.position.col + i]
                        : matrix[wordData.position.row + i][wordData.position.col];
                if (!cell.isCorrect) {
                    isCompleted = false;
                    break;
                }
            }
            if (isCompleted) newCompleted.add(wordKey);
        });
        setCompletedWords(newCompleted);
    };

    const checkCrosswordComplete = (matrix: ICell[][]): void => {
        const allCorrect = matrix.every((row) =>
            row.every((cell) => !cell.filled || cell.isCorrect),
        );
        if (allCorrect) setIsComplete(true);
    };

    return {
        gridSize: GRID_SIZE,
        gridSizePixels: GRID_SIZE_PX,
        gameLevel,
        completedWords,
        crossword,
        selectedWords,
        isGameStarted,
        isComplete,
        checkCellValue,
        handleGameStartClick,
    };
};

export default useCrossWordPuzzle;
