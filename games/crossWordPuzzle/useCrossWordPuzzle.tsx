'use client';

import { ChangeEvent, useState } from 'react';
import { AccentedVowels } from '@config/AccentRules';
import { ICell } from '@models/interfaces';
import { Definition, DefinitionWords, SelectedWord } from '@models/types';
import Logger from '@services/Logger';
import { loadDefinition } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import { PlacedWord, generateCrossword } from '@utils/CrosswordGenerator';

const GRID_SIZE = 15;
const GRID_SIZE_PX = 50;
const LETTERS_PER_BATCH = 6;
const MAX_GENERATION_BATCHES = 3;

const WORDS_PER_LEVEL: Record<string, number> = {
    beginner: 4,
    intermediate: 6,
    advanced: 8,
};
const DEFAULT_WORD_COUNT = 4;

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
                .map(() => ({
                    char: '',
                    color: '',
                    filled: false,
                    isCorrect: false,
                    isHint: false,
                    isLocked: false,
                })),
        );

const useCrossWordPuzzle = () => {
    const { locale, gameLevel } = useWordsContext();

    const [selectedWords, setSelectedWords] = useState<SelectedWord>({});
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [crossword, setCrossword] = useState<ICell[][]>(matrixInitialState);
    const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());

    const resetCrossword = () => {
        setSelectedWords({});
        setCrossword(matrixInitialState());
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

        return Object.entries(mergedDefinitions).reduce<DefinitionWords>((obj, [key, value]) => {
            const newKey = key
                .split('')
                .map((char) => AccentedVowels[char] || char)
                .join('');
            obj[newKey] = (value as { definitions: Definition[] }).definitions;
            return obj;
        }, {});
    };

    /** Renders the generated layout into grid + clue state in a single pass. */
    const applyGeneratedCrossword = (placed: PlacedWord[], definitions: DefinitionWords) => {
        const matrix = matrixInitialState();
        const availableColors = [...originalColors];
        const newSelectedWords: SelectedWord = {};

        placed.forEach(({ word, position, direction }) => {
            const colorIndex = Math.floor(Math.random() * availableColors.length);
            const [color] = availableColors.splice(colorIndex, 1);

            for (let i = 0; i < word.length; i++) {
                const row = direction === 'horizontal' ? position.row : position.row + i;
                const col = direction === 'horizontal' ? position.col + i : position.col;
                const existing = matrix[row][col];
                matrix[row][col] = {
                    ...existing,
                    char: word[i],
                    color: existing.filled ? '#808080' : color,
                    filled: true,
                };
            }

            const wordDefinitions = definitions[word] ?? [];
            const randomDef =
                wordDefinitions[Math.floor(Math.random() * wordDefinitions.length)];
            newSelectedWords[word] = {
                definition: wordDefinitions,
                displayDefinition: randomDef?.definition ?? '',
                position,
                direction,
                color,
            };
        });

        // Reveal the first letter of the first word as a hint.
        const { position: firstPosition } = placed[0];
        matrix[firstPosition.row][firstPosition.col] = {
            ...matrix[firstPosition.row][firstPosition.col],
            isHint: true,
            isCorrect: true,
        };

        setCrossword(matrix);
        setSelectedWords(newSelectedWords);
    };

    const handleGameStartClick = async () => {
        resetCrossword();
        setIsGameStarted(true);
        setIsGenerating(true);

        const targetCount = WORDS_PER_LEVEL[gameLevel ?? ''] ?? DEFAULT_WORD_COUNT;

        try {
            // Each batch fetches definitions for a fresh random set of letters;
            // retry with a new batch when the pool can't produce a full layout.
            for (let batch = 0; batch < MAX_GENERATION_BATCHES; batch++) {
                const definitions = await getWordsFromRandomLetters(LETTERS_PER_BATCH);
                const placed = generateCrossword(
                    Object.keys(definitions),
                    targetCount,
                    GRID_SIZE,
                );
                if (placed) {
                    applyGeneratedCrossword(placed, definitions);
                    return;
                }
            }
            Logger.error('Crossword generation failed after all batches');
        } finally {
            setIsGenerating(false);
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
                    newCrossword[i][j] = { ...newCrossword[i][j], isCorrect: true, isLocked: true };
                } else {
                    event.target.style.backgroundColor = '#ff4d4f';
                    newCrossword[i][j] = { ...newCrossword[i][j], isCorrect: false };
                }
            }
            const lockedCrossword = checkCompletedWords(newCrossword);
            setCrossword(lockedCrossword);
            checkCrosswordComplete(lockedCrossword);
        };

    const checkCompletedWords = (matrix: ICell[][]): ICell[][] => {
        const newCompleted = new Set<string>();
        const updated = matrix.map((row) => [...row]);

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
            if (isCompleted) {
                newCompleted.add(wordKey);
                for (let i = 0; i < wordKey.length; i++) {
                    if (wordData.direction === 'horizontal') {
                        updated[wordData.position.row][wordData.position.col + i] = {
                            ...updated[wordData.position.row][wordData.position.col + i],
                            isLocked: true,
                        };
                    } else {
                        updated[wordData.position.row + i][wordData.position.col] = {
                            ...updated[wordData.position.row + i][wordData.position.col],
                            isLocked: true,
                        };
                    }
                }
            }
        });

        setCompletedWords(newCompleted);
        return updated;
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
        isGenerating,
        isComplete,
        checkCellValue,
        handleGameStartClick,
    };
};

export default useCrossWordPuzzle;
