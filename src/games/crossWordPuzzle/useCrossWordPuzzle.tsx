import React, { useEffect, useRef, useState } from 'react';
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

const originalColors: string[] = [
    '#1677FF', // Blue
    '#008000', // Green
    '#FFFF00', // Yellow
    '#FFA500', // Orange
    '#800080', // Purple
    '#A52A2A', // Brown
    '#FFC0CB', // Pink
    '#00FFFF', // Cyan
    '#FF00FF', // Magenta
    '#008080', // Teal
    '#000080', // Navy
    '#800000', // Maroon
    '#808000', // Olive
    '#FFD700', // Gold
];

let commonColors = [...originalColors];

const matrixInitialState = (): ICell[][] => {
    const matrix: ICell[][] = Array(GRID_SIZE)
        .fill(null)
        .map(() =>
            Array(GRID_SIZE)
                .fill(null)
                .map(() => ({ char: '', color: '', filled: false, isCorrect: false })),
        );
    return matrix;
};

const useCrossWordPuzzle = () => {
    const { locale } = useWordsContext();

    const [wordsList, setWordsList] = useState<string[]>([]);
    const [allDefinitions, setAllDefinitions] = useState<DefinitionWords>({});
    const [selectedWords, setSelectedWords] = useState<SelectedWord>({});
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [crossword, setCrossword] = useState<ICell[][]>(matrixInitialState);
    const [firstWord, setFirstWord] = useState<string>('');
    const [crosswordWords, setCrosswordWords] = useState<crosswordWord[]>([]);
    const liRefs = useRef<(HTMLLIElement | null)[]>([]);

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
        setFirstWord('');
        setSelectedWords({});
        setCrossword(matrixInitialState);
        setCrosswordWords([]);
        setAllDefinitions({});
        setWordsList([]);
        commonColors = [...originalColors];
    };

    const getWordsFromRandomLetters = async (count: number): Promise<DefinitionWords> => {
        const shuffledLetters = letters.sort(() => 0.5 - Math.random()).slice(0, count);

        const promises = shuffledLetters.map((letter) => loadDefinition(letter, locale));
        const letterDefinitions = await Promise.all(promises);

        const mergedDefinitions = letterDefinitions.reduce((acc, definition) => {
            return { ...acc, ...definition };
        }, {});

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

        setSelectedWords((prevWords: SelectedWord) => ({
            ...prevWords,
            [word]: {
                definition: allDefinitions[word],
                position: position,
                direction: wordDirection,
                color: color,
            },
        }));

        return {
            word: word,
            position: position,
            direction: wordDirection,
        };
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
                    if (count === occurrence) {
                        return i;
                    }
                }
            }
            return -1;
        };

        wordsList.forEach((word: string) => {
            if (selectedWordsList.includes(word)) {
                return;
            }

            const charOccurrencesInSelectedWord: { [key: string]: number } = {};

            for (let i = 0; i < selectedWord.length; i++) {
                const char = selectedWord[i];
                if (!charOccurrencesInSelectedWord[char]) {
                    charOccurrencesInSelectedWord[char] = 0;
                }
                charOccurrencesInSelectedWord[char]++;
                const charKey = char + charOccurrencesInSelectedWord[char];

                if (!charWordCount[charKey]) {
                    charWordCount[charKey] = 0;
                }

                if (charWordCount[charKey] >= MAX_POSSIBLE_WORDS_PER_WORD) {
                    continue;
                }

                const matchIndex = findNthOccurrence(
                    word,
                    char,
                    charOccurrencesInSelectedWord[char],
                );

                if (matchIndex !== -1 && !addedWords.has(word)) {
                    possibleWords.push({
                        word: word,
                        previousWordIndex: i,
                        wordIndex: matchIndex,
                    });
                    addedWords.add(word);

                    charWordCount[charKey] += 1;

                    if (charWordCount[charKey] >= MAX_POSSIBLE_WORDS_PER_WORD) {
                        break;
                    }
                }
            }
        });

        return possibleWords;
    };

    const getRandomColor = () => {
        const randomIndex = Math.floor(Math.random() * commonColors.length);
        const [color] = commonColors.splice(randomIndex, 1);
        return color;
    };

    const addWordToCrosswordMatrix = (
        word: string,
        position: Position,
        direction: string,
        color: string,
    ): void => {
        const matrix = crossword;

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
            if (checkCollisionPoints(pos.row, pos.col)) {
                return true;
            }
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
            if (startCol + wordLength <= crossword[0].length) {
                for (let i = 0; i < wordLength; i++) {
                    positions.push({ row: startRow, col: startCol + i });
                }
            }
        } else if (direction === 'vertical') {
            if (startRow + wordLength <= crossword.length) {
                for (let i = 0; i < wordLength; i++) {
                    positions.push({ row: startRow + i, col: startCol });
                }
            }
        }

        return positions.slice(3);
    };

    const checkCollisionPoints = (row: number, col: number): boolean => {
        const positions = [
            { r: row - 1, c: col - 1 }, // Top-left
            { r: row - 1, c: col + 1 }, // Top-right
            { r: row + 1, c: col - 1 }, // Bottom-left
            { r: row + 1, c: col + 1 }, // Bottom-right
        ];

        const isInBounds = (r: number, c: number) => {
            return r >= 0 && r < crossword.length && c >= 0 && c < crossword[0].length;
        };

        return positions.some((pos) => {
            const { r, c } = pos;
            return isInBounds(r, c) && crossword[r][c].filled;
        });
    };

    const tryPlaceWord = (possibleWords: PossibleWord[], anchorWord: crosswordWord) => {
        const matrix = crossword;
        const { direction, position } = anchorWord;
        let wordsPlace: number = 0;
        let removeMainWord = false;

        for (let i = 0; i < possibleWords.length; i++) {
            if (wordsPlace >= MAX_PLACEMENT_PER_WORD) {
                break;
            }

            const { word, previousWordIndex, wordIndex } = possibleWords[i];
            const newWordPosition: Position = {
                row: 0,
                col: 0,
            };
            const newDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';

            if (direction === 'horizontal') {
                newWordPosition['row'] = position.row - wordIndex;
                newWordPosition['col'] = position.col + previousWordIndex;
            } else {
                newWordPosition['row'] = position.row + previousWordIndex;
                newWordPosition['col'] = position.col - wordIndex;
            }

            if (
                newWordPosition['row'] >= 0 &&
                newWordPosition['row'] + word.length <= GRID_SIZE &&
                newWordPosition['col'] >= 0 &&
                newWordPosition['col'] + word.length <= GRID_SIZE
            ) {
                let canPlaceWord = true;

                for (let i = 0; i < word.length; i++) {
                    if (newDirection === 'horizontal') {
                        if (
                            matrix[newWordPosition.row][newWordPosition.col + i].filled &&
                            matrix[newWordPosition.row][newWordPosition.col + i].char !== word[i]
                        ) {
                            canPlaceWord = false;
                            break;
                        }
                    } else {
                        if (
                            matrix[newWordPosition.row + i][newWordPosition.col].filled &&
                            matrix[newWordPosition.row + i][newWordPosition.col].char !== word[i]
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
                    setSelectedWords((prevWords: SelectedWord) => ({
                        ...prevWords,
                        [word]: {
                            definition: allDefinitions[word],
                            position: newWordPosition,
                            direction: newDirection,
                            color: color,
                        },
                    }));
                    setCrosswordWords((prevWords: crosswordWord[]) => [
                        ...prevWords,
                        {
                            word: word,
                            position: newWordPosition,
                            direction: newDirection,
                        },
                    ]);
                    removeMainWord = true;
                    wordsPlace++;
                }
            }
        }
        if (removeMainWord) {
            setCrosswordWords((currentWords: crosswordWord[]) =>
                currentWords.filter((currentWord) => currentWord.word !== anchorWord.word),
            );
        }
    };

    const checkCellValue =
        (i: number, j: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            if (value.length === 0) {
                event.target.style.backgroundColor = '#ff4d4f';
                crossword[i][j].isCorrect = false;
            } else {
                if (value.toLowerCase() === crossword[i][j].char.toLowerCase()) {
                    event.target.style.backgroundColor = '#fff';
                    event.target.style.borderColor = '#000';
                    crossword[i][j].isCorrect = true;
                } else {
                    event.target.style.backgroundColor = '#ff4d4f';
                    crossword[i][j].isCorrect = false;
                }
            }
            checkCompletedWords();
            isCrosswordFilledCorrectly();
        };

    const checkCompletedWords = (): void => {
        Object.entries(selectedWords).forEach(([wordKey, wordData], index) => {
            let isCompleted = true;
            for (let i = 0; i < wordKey.length; i++) {
                if (wordData.direction === 'horizontal') {
                    if (
                        false ===
                        crossword[wordData.position.row][wordData.position.col + i].isCorrect
                    ) {
                        isCompleted = false;
                    }
                } else {
                    if (
                        false ===
                        crossword[wordData.position.row + i][wordData.position.col].isCorrect
                    ) {
                        isCompleted = false;
                    }
                }
            }
            const liElement = liRefs.current[index];
            if (liElement) {
                if (true === isCompleted) {
                    liElement.classList.add('completed');
                } else {
                    liElement.classList.remove('completed');
                }
            }
        });
    };

    const isCrosswordFilledCorrectly = () => {
        let allCorrect = true;

        crossword.forEach((row) => {
            row.forEach((cell) => {
                if (cell.filled && false === cell.isCorrect) {
                    allCorrect = false;
                    return;
                }
            });
        });

        if (allCorrect) {
            const inputs = document.querySelectorAll('div.crossword-grid-item input');
            inputs.forEach((input) => {
                (input as HTMLInputElement).disabled = true;
            });
        }
    };

    return {
        gridSize: GRID_SIZE,
        gridSizePixels: GRID_SIZE_PX,
        liRefs,
        crossword,
        selectedWords,
        isGameStarted,
        checkCellValue,
        handleGameStartClick,
    };
};

export default useCrossWordPuzzle;
