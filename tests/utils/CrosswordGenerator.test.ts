import { PlacedWord, generateCrossword } from '@utils/CrosswordGenerator';

const GRID_SIZE = 15;

const WORD_POOL = [
    'palabra', 'castillo', 'elefante', 'guitarra', 'montana',
    'perro', 'gato', 'torre', 'rana', 'luna', 'sol', 'mar',
    'arbol', 'casa', 'libro', 'plato', 'verde', 'rojo', 'tren',
    'nube', 'pan', 'flor', 'rio', 'pez', 'lobo', 'oso', 'tigre',
];

type Cell = { char: string; horizontal: boolean; vertical: boolean } | null;

const buildGrid = (placed: PlacedWord[]): Cell[][] => {
    const grid: Cell[][] = Array.from({ length: GRID_SIZE }, () =>
        Array<Cell>(GRID_SIZE).fill(null),
    );
    for (const { word, position, direction } of placed) {
        for (let i = 0; i < word.length; i++) {
            const row = direction === 'horizontal' ? position.row : position.row + i;
            const col = direction === 'horizontal' ? position.col + i : position.col;
            const existing = grid[row][col];
            if (existing) {
                expect(existing.char).toBe(word[i]);
            }
            grid[row][col] = {
                char: word[i],
                horizontal: (existing?.horizontal ?? false) || direction === 'horizontal',
                vertical: (existing?.vertical ?? false) || direction === 'vertical',
            };
        }
    }
    return grid;
};

const intersects = (a: PlacedWord, b: PlacedWord): boolean => {
    const cells = (pw: PlacedWord): string[] => {
        const result: string[] = [];
        for (let i = 0; i < pw.word.length; i++) {
            const row = pw.direction === 'horizontal' ? pw.position.row : pw.position.row + i;
            const col = pw.direction === 'horizontal' ? pw.position.col + i : pw.position.col;
            result.push(`${row},${col}`);
        }
        return result;
    };
    const aCells = new Set(cells(a));
    return cells(b).some((cell) => aCells.has(cell));
};

describe('generateCrossword', () => {
    test.each([4, 6, 8])('places exactly %i words', (target) => {
        const placed = generateCrossword(WORD_POOL, target, GRID_SIZE);

        expect(placed).not.toBeNull();
        expect(placed!).toHaveLength(target);
        const uniqueWords = new Set(placed!.map((p) => p.word));
        expect(uniqueWords.size).toBe(target);
    });

    test('all words stay inside the grid', () => {
        const placed = generateCrossword(WORD_POOL, 8, GRID_SIZE)!;

        for (const { word, position, direction } of placed) {
            expect(position.row).toBeGreaterThanOrEqual(0);
            expect(position.col).toBeGreaterThanOrEqual(0);
            if (direction === 'horizontal') {
                expect(position.col + word.length).toBeLessThanOrEqual(GRID_SIZE);
            } else {
                expect(position.row + word.length).toBeLessThanOrEqual(GRID_SIZE);
            }
        }
    });

    test('first word is 6-9 letters long', () => {
        const placed = generateCrossword(WORD_POOL, 4, GRID_SIZE)!;

        expect(placed[0].word.length).toBeGreaterThanOrEqual(6);
        expect(placed[0].word.length).toBeLessThanOrEqual(9);
    });

    test('every word is connected to the rest through intersections', () => {
        const placed = generateCrossword(WORD_POOL, 8, GRID_SIZE)!;

        // BFS over the intersection graph — must form a single component.
        const visited = new Set<number>([0]);
        const queue = [0];
        while (queue.length > 0) {
            const current = queue.shift()!;
            placed.forEach((other, index) => {
                if (!visited.has(index) && intersects(placed[current], other)) {
                    visited.add(index);
                    queue.push(index);
                }
            });
        }
        expect(visited.size).toBe(placed.length);
    });

    test('no same-direction overlap and letters match at intersections', () => {
        const placed = generateCrossword(WORD_POOL, 8, GRID_SIZE)!;

        // buildGrid asserts char equality; here assert no cell is claimed
        // twice in the same direction.
        const seen = new Map<string, Set<string>>();
        for (const { word, position, direction } of placed) {
            for (let i = 0; i < word.length; i++) {
                const row = direction === 'horizontal' ? position.row : position.row + i;
                const col = direction === 'horizontal' ? position.col + i : position.col;
                const key = `${row},${col}`;
                const dirs = seen.get(key) ?? new Set<string>();
                expect(dirs.has(direction)).toBe(false);
                dirs.add(direction);
                seen.set(key, dirs);
            }
        }
    });

    test('words never sit adjacent outside intersections', () => {
        const placed = generateCrossword(WORD_POOL, 8, GRID_SIZE)!;
        const grid = buildGrid(placed);

        for (const { word, position, direction } of placed) {
            // Cells before start and after end must be empty.
            const before =
                direction === 'horizontal'
                    ? { r: position.row, c: position.col - 1 }
                    : { r: position.row - 1, c: position.col };
            const after =
                direction === 'horizontal'
                    ? { r: position.row, c: position.col + word.length }
                    : { r: position.row + word.length, c: position.col };
            if (before.r >= 0 && before.c >= 0) expect(grid[before.r][before.c]).toBeNull();
            if (after.r < GRID_SIZE && after.c < GRID_SIZE) {
                expect(grid[after.r][after.c]).toBeNull();
            }

            // Non-intersection cells must have empty perpendicular neighbors.
            for (let i = 0; i < word.length; i++) {
                const row = direction === 'horizontal' ? position.row : position.row + i;
                const col = direction === 'horizontal' ? position.col + i : position.col;
                const cell = grid[row][col]!;
                const isIntersection = cell.horizontal && cell.vertical;
                if (isIntersection) continue;

                const neighbors =
                    direction === 'horizontal'
                        ? [
                              { r: row - 1, c: col },
                              { r: row + 1, c: col },
                          ]
                        : [
                              { r: row, c: col - 1 },
                              { r: row, c: col + 1 },
                          ];
                for (const { r, c } of neighbors) {
                    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
                    expect(grid[r][c]).toBeNull();
                }
            }
        }
    });

    test('puzzle bounding box is centered in the grid', () => {
        const placed = generateCrossword(WORD_POOL, 6, GRID_SIZE)!;

        let minRow = GRID_SIZE;
        let maxRow = -1;
        let minCol = GRID_SIZE;
        let maxCol = -1;
        for (const { word, position, direction } of placed) {
            const endRow =
                direction === 'vertical' ? position.row + word.length - 1 : position.row;
            const endCol =
                direction === 'horizontal' ? position.col + word.length - 1 : position.col;
            minRow = Math.min(minRow, position.row);
            maxRow = Math.max(maxRow, endRow);
            minCol = Math.min(minCol, position.col);
            maxCol = Math.max(maxCol, endCol);
        }

        const topGap = minRow;
        const bottomGap = GRID_SIZE - 1 - maxRow;
        const leftGap = minCol;
        const rightGap = GRID_SIZE - 1 - maxCol;
        expect(Math.abs(topGap - bottomGap)).toBeLessThanOrEqual(1);
        expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(1);
    });

    test('returns null when the pool cannot produce a layout', () => {
        expect(generateCrossword(['sol', 'pan'], 4, GRID_SIZE)).toBeNull();
        expect(generateCrossword([], 4, GRID_SIZE)).toBeNull();
    });
});
