import { act, renderHook, waitFor } from '@testing-library/react';
import { getDefinitions } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import useCrossWordPuzzle from '@games/crossWordPuzzle/useCrossWordPuzzle';
import { generateCrossword } from '@utils/CrosswordGenerator';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getDefinitions: jest.fn(),
}));
jest.mock('@utils/CrosswordGenerator', () => {
    const actual = jest.requireActual('@utils/CrosswordGenerator');
    return { ...actual, generateCrossword: jest.fn(actual.generateCrossword) };
});

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockGetDefinitions = getDefinitions as jest.Mock;
const mockGenerateCrossword = generateCrossword as jest.Mock;

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: null as string | null,
    error: null,
    setError: jest.fn(),
    ...overrides,
});

describe('useCrossWordPuzzle', () => {
    beforeEach(() => {
        mockGetDefinitions.mockResolvedValue({});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('isGameStarted is false initially', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useCrossWordPuzzle());

        expect(result.current.isGameStarted).toBe(false);
    });

    test('isComplete is false initially', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useCrossWordPuzzle());

        expect(result.current.isComplete).toBe(false);
    });

    test('returns gameLevel from context', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'intermediate' }));

        const { result } = renderHook(() => useCrossWordPuzzle());

        expect(result.current.gameLevel).toBe('intermediate');
    });

    test('handleGameStartClick sets isGameStarted to true', async () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useCrossWordPuzzle());

        await act(async () => {
            result.current.handleGameStartClick();
        });

        await waitFor(() => {
            expect(result.current.isGameStarted).toBe(true);
        });
    });

    test('grid has correct dimensions (15×15)', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useCrossWordPuzzle());

        expect(result.current.gridSize).toBe(15);
        expect(result.current.crossword).toHaveLength(15);
        expect(result.current.crossword[0]).toHaveLength(15);
    });

    test('initial crossword grid has all cells empty and unfilled', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useCrossWordPuzzle());

        const allEmpty = result.current.crossword.every((row) =>
            row.every((cell) => cell.char === '' && !cell.filled),
        );
        expect(allEmpty).toBe(true);
    });

    test('selectedWords is empty before game starts', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useCrossWordPuzzle());

        expect(Object.keys(result.current.selectedWords)).toHaveLength(0);
    });

    test('gridSizePixels is 50', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useCrossWordPuzzle());

        expect(result.current.gridSizePixels).toBe(50);
    });

    test('asks getDefinitions for en letter files when locale is en', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ locale: 'en', gameLevel: 'beginner' }));

        const { result } = renderHook(() => useCrossWordPuzzle());

        await act(async () => {
            result.current.handleGameStartClick();
        });

        await waitFor(() => {
            expect(mockGetDefinitions).toHaveBeenCalledWith({ locale: 'en', firstLetter: expect.stringMatching(/^[a-z]$/), level: 'beginner' });
        });
    });

    test('checkCellValue is a function', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useCrossWordPuzzle());

        expect(typeof result.current.checkCellValue).toBe('function');
    });

    test('beginner clue shows sense 1 even when the random pick would land on a later sense', async () => {
        const random = jest.spyOn(Math, 'random').mockReturnValue(0.99);
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetDefinitions.mockResolvedValue({
            gato: { definitions: [
                { number: '1', type: 'nombre masculino', definition: 'Mamífero felino doméstico.' },
                { number: '2', type: 'nombre masculino', definition: 'Máquina para levantar pesos.' },
            ] },
        });
        mockGenerateCrossword.mockReturnValueOnce([{ word: 'gato', position: { row: 0, col: 0 }, direction: 'horizontal' }]);

        const { result } = renderHook(() => useCrossWordPuzzle());
        try {
            await act(async () => {
                await result.current.handleGameStartClick();
            });
        } finally {
            random.mockRestore();
        }

        expect(result.current.selectedWords.gato.displayDefinition).toBe('Mamífero felino doméstico.');
    });
});
