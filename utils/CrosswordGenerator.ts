import { Position } from '@models/types';

export type CrosswordDirection = 'horizontal' | 'vertical';

export type PlacedWord = {
    word: string;
    position: Position;
    direction: CrosswordDirection;
};

const FIRST_WORD_MIN_LENGTH = 6;
const FIRST_WORD_MAX_LENGTH = 9;
const MIN_WORD_LENGTH = 3;
const MAX_GENERATION_ATTEMPTS = 20;
// Cap candidate pool per attempt; the full definitions pool can be huge and
// every candidate is scanned against every filled cell each round.
const MAX_POOL_SIZE = 150;

type CharCell = {
    char: string;
    // Direction(s) already occupying this cell. A new word may only cross a
    // filled cell perpendicular to the word that owns it — same-direction
    // overlap (e.g. "mar" extended into "calamar") is rejected.
    horizontal: boolean;
    vertical: boolean;
};

type CharGrid = (CharCell | null)[][];

const shuffle = <T>(items: T[]): T[] => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

const buildCharGrid = (gridSize: number): CharGrid =>
    Array.from({ length: gridSize }, () => Array<CharCell | null>(gridSize).fill(null));

const placeOnGrid = (grid: CharGrid, placed: PlacedWord): void => {
    const { word, position, direction } = placed;
    for (let i = 0; i < word.length; i++) {
        const row = direction === 'horizontal' ? position.row : position.row + i;
        const col = direction === 'horizontal' ? position.col + i : position.col;
        const existing = grid[row][col];
        grid[row][col] = {
            char: word[i],
            horizontal: (existing?.horizontal ?? false) || direction === 'horizontal',
            vertical: (existing?.vertical ?? false) || direction === 'vertical',
        };
    }
};

/**
 * Validates a placement and returns its intersection count, or -1 if invalid.
 *
 * Rules enforced:
 * - Word fits inside the grid.
 * - Cells immediately before the start and after the end are empty.
 * - Every filled cell along the path must match the word's letter AND belong
 *   to a perpendicular word only (no same-direction overlap).
 * - Every empty cell along the path must have empty perpendicular neighbors —
 *   words never sit side by side; they only touch at intersections.
 */
const evaluatePlacement = (
    grid: CharGrid,
    word: string,
    row: number,
    col: number,
    direction: CrosswordDirection,
    gridSize: number,
): number => {
    const len = word.length;
    const isHorizontal = direction === 'horizontal';

    if (row < 0 || col < 0) return -1;
    if (isHorizontal) {
        if (row >= gridSize || col + len > gridSize) return -1;
    } else {
        if (col >= gridSize || row + len > gridSize) return -1;
    }

    const before = isHorizontal ? { r: row, c: col - 1 } : { r: row - 1, c: col };
    const after = isHorizontal ? { r: row, c: col + len } : { r: row + len, c: col };
    if (before.c >= 0 && before.r >= 0 && grid[before.r][before.c] !== null) return -1;
    if (after.c < gridSize && after.r < gridSize && grid[after.r][after.c] !== null) return -1;

    let intersections = 0;

    for (let i = 0; i < len; i++) {
        const r = isHorizontal ? row : row + i;
        const c = isHorizontal ? col + i : col;
        const cell = grid[r][c];

        if (cell !== null) {
            if (cell.char !== word[i]) return -1;
            if (isHorizontal ? cell.horizontal : cell.vertical) return -1;
            intersections++;
        } else {
            const sideA = isHorizontal ? { r: r - 1, c } : { r, c: c - 1 };
            const sideB = isHorizontal ? { r: r + 1, c } : { r, c: c + 1 };
            if (sideA.r >= 0 && sideA.c >= 0 && grid[sideA.r][sideA.c] !== null) return -1;
            if (sideB.r < gridSize && sideB.c < gridSize && grid[sideB.r][sideB.c] !== null)
                return -1;
        }
    }

    return intersections;
};

/** Lower is better: keeps the puzzle compact around the grid center. */
const distanceFromCenter = (
    word: string,
    row: number,
    col: number,
    direction: CrosswordDirection,
    gridSize: number,
): number => {
    const center = (gridSize - 1) / 2;
    const midRow = direction === 'horizontal' ? row : row + (word.length - 1) / 2;
    const midCol = direction === 'horizontal' ? col + (word.length - 1) / 2 : col;
    return Math.abs(midRow - center) + Math.abs(midCol - center);
};

const tryGenerate = (
    pool: string[],
    targetCount: number,
    gridSize: number,
): PlacedWord[] | null => {
    const firstWord = pool.find(
        (w) => w.length >= FIRST_WORD_MIN_LENGTH && w.length <= FIRST_WORD_MAX_LENGTH,
    );
    if (!firstWord) return null;

    const grid = buildCharGrid(gridSize);
    const placed: PlacedWord[] = [
        {
            word: firstWord,
            position: {
                row: Math.floor(gridSize / 2),
                col: Math.floor((gridSize - firstWord.length) / 2),
            },
            direction: 'horizontal',
        },
    ];
    placeOnGrid(grid, placed[0]);
    const used = new Set<string>([firstWord]);

    while (placed.length < targetCount) {
        let best: { placement: PlacedWord; score: number } | null = null;

        for (const word of pool) {
            if (used.has(word)) continue;

            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    const cell = grid[r][c];
                    if (cell === null) continue;

                    for (let i = 0; i < word.length; i++) {
                        if (word[i] !== cell.char) continue;

                        const candidates: { row: number; col: number; dir: CrosswordDirection }[] =
                            [
                                { row: r, col: c - i, dir: 'horizontal' },
                                { row: r - i, col: c, dir: 'vertical' },
                            ];

                        for (const { row, col, dir } of candidates) {
                            const intersections = evaluatePlacement(
                                grid,
                                word,
                                row,
                                col,
                                dir,
                                gridSize,
                            );
                            if (intersections < 1) continue;

                            const score =
                                intersections * 100 -
                                distanceFromCenter(word, row, col, dir, gridSize);
                            if (!best || score > best.score) {
                                best = {
                                    placement: { word, position: { row, col }, direction: dir },
                                    score,
                                };
                            }
                        }
                    }
                }
            }
        }

        if (!best) return null;

        placeOnGrid(grid, best.placement);
        placed.push(best.placement);
        used.add(best.placement.word);
    }

    return placed;
};

/** Translates all placements so the puzzle's bounding box is centered in the grid. */
const centerPlacedWords = (placed: PlacedWord[], gridSize: number): PlacedWord[] => {
    let minRow = gridSize;
    let maxRow = -1;
    let minCol = gridSize;
    let maxCol = -1;

    for (const { word, position, direction } of placed) {
        const endRow = direction === 'vertical' ? position.row + word.length - 1 : position.row;
        const endCol = direction === 'horizontal' ? position.col + word.length - 1 : position.col;
        minRow = Math.min(minRow, position.row);
        maxRow = Math.max(maxRow, endRow);
        minCol = Math.min(minCol, position.col);
        maxCol = Math.max(maxCol, endCol);
    }

    const rowOffset = Math.floor((gridSize - (maxRow - minRow + 1)) / 2) - minRow;
    const colOffset = Math.floor((gridSize - (maxCol - minCol + 1)) / 2) - minCol;

    return placed.map((pw) => ({
        ...pw,
        position: { row: pw.position.row + rowOffset, col: pw.position.col + colOffset },
    }));
};

/**
 * Builds a crossword from the given word pool: exactly `targetCount` words,
 * every word connected to another through a perpendicular intersection, no
 * two words adjacent outside intersections, puzzle centered in the grid.
 * Returns null when no valid layout is found after several shuffled attempts.
 */
export const generateCrossword = (
    wordPool: string[],
    targetCount: number,
    gridSize: number,
): PlacedWord[] | null => {
    const validWords = wordPool.filter(
        (w) => w.length >= MIN_WORD_LENGTH && w.length <= gridSize,
    );

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
        const pool = shuffle(validWords).slice(0, MAX_POOL_SIZE);
        const result = tryGenerate(pool, targetCount, gridSize);
        if (result) return centerPlacedWords(result, gridSize);
    }

    return null;
};
