import { act, renderHook, waitFor } from '@testing-library/react';
import { loadDefinition } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import useDefinitionMaster from '@games/definitionMaster/useDefinitionMaster';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    loadDefinition: jest.fn(),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockLoadDefinition = loadDefinition as jest.Mock;

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: null as string | null,
    error: null,
    setError: jest.fn(),
    ...overrides,
});

describe('useDefinitionMaster', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('does not call loadDefinition on mount', async () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        renderHook(() => useDefinitionMaster());

        await waitFor(() => {
            expect(mockLoadDefinition).not.toHaveBeenCalled();
        });
    });

    test('returns gameLevel from context', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));

        const { result } = renderHook(() => useDefinitionMaster());

        expect(result.current.gameLevel).toBe('beginner');
    });

    test('isGameStarted is false initially', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useDefinitionMaster());

        expect(result.current.isGameStarted).toBe(false);
    });

    test('handleGameStartClick sets isGameStarted to true', async () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useDefinitionMaster());

        act(() => {
            result.current.handleGameStartClick();
        });

        expect(result.current.isGameStarted).toBe(true);
    });

    test('handleLetterClick calls loadDefinition with letter and locale', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ locale: 'es' }));
        mockLoadDefinition.mockResolvedValue({});

        const { result } = renderHook(() => useDefinitionMaster());

        await act(async () => {
            await result.current.handleLetterClick('a');
        });

        expect(mockLoadDefinition).toHaveBeenCalledWith('a', 'es');
    });

    test('handleLetterClick with en locale passes correct locale', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ locale: 'en' }));
        mockLoadDefinition.mockResolvedValue({});

        const { result } = renderHook(() => useDefinitionMaster());

        await act(async () => {
            await result.current.handleLetterClick('b');
        });

        expect(mockLoadDefinition).toHaveBeenCalledWith('b', 'en');
    });

    test('handleLetterClick with rich definitions builds chosenWords', async () => {
        mockUseWordsContext.mockReturnValue(makeContext());
        // loadDefinition returns a word with >2 definitions (required by the hook)
        mockLoadDefinition.mockResolvedValue({
            gato: {
                definitions: [
                    { definition: 'Animal felino doméstico' },
                    { definition: 'Dispositivo para levantar vehículos' },
                    { definition: 'Moneda antigua' },
                ],
            },
        });

        const { result } = renderHook(() => useDefinitionMaster());

        await act(async () => {
            await result.current.handleLetterClick('g');
        });

        // quizWords is built from chosenWords — non-empty means definitions loaded
        await waitFor(() => {
            expect(result.current.quizWords.length).toBeGreaterThan(0);
        });
    });

    test('handleResetLetterClick resets quiz state', async () => {
        mockUseWordsContext.mockReturnValue(makeContext());
        mockLoadDefinition.mockResolvedValue({
            gato: {
                definitions: [
                    { definition: 'Def 1' },
                    { definition: 'Def 2' },
                    { definition: 'Def 3' },
                ],
            },
        });

        const { result } = renderHook(() => useDefinitionMaster());

        await act(async () => {
            await result.current.handleLetterClick('g');
        });

        await waitFor(() => {
            expect(result.current.quizWords.length).toBeGreaterThan(0);
        });

        act(() => {
            result.current.handleResetLetterClick();
        });

        expect(result.current.quizWords.length).toBe(0);
    });

    test('exposes 26 letters', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useDefinitionMaster());

        expect(result.current.letters).toHaveLength(26);
        expect(result.current.letters).toContain('a');
        expect(result.current.letters).toContain('z');
    });
});
