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
        // gameLevel=null falls through to advanced (minDefs=3); provide 3 defs to satisfy threshold
        mockUseWordsContext.mockReturnValue(makeContext());
        mockLoadDefinition.mockResolvedValue({
            gato: {
                definitions: [
                    { number: 1, definition: 'Animal felino doméstico' },
                    { number: 2, definition: 'Dispositivo para levantar vehículos' },
                    { number: 3, definition: 'Moneda antigua' },
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
                    { number: 1, definition: 'Def 1' },
                    { number: 2, definition: 'Def 2' },
                    { number: 3, definition: 'Def 3' },
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

    test('isLetterDisabled returns true for missing ES letters', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ locale: 'es' }));

        const { result } = renderHook(() => useDefinitionMaster());

        expect(result.current.isLetterDisabled('x')).toBe(true);
        expect(result.current.isLetterDisabled('a')).toBe(false);
        expect(result.current.isLetterDisabled('j')).toBe(false);
        expect(result.current.isLetterDisabled('k')).toBe(false);
        expect(result.current.isLetterDisabled('l')).toBe(false);
        expect(result.current.isLetterDisabled('z')).toBe(false);
    });

    test('isLetterDisabled returns true for missing EN letters', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ locale: 'en' }));

        const { result } = renderHook(() => useDefinitionMaster());

        expect(result.current.isLetterDisabled('j')).toBe(true);
        expect(result.current.isLetterDisabled('k')).toBe(true);
        expect(result.current.isLetterDisabled('l')).toBe(true);
        expect(result.current.isLetterDisabled('x')).toBe(true);
        expect(result.current.isLetterDisabled('z')).toBe(true);
        expect(result.current.isLetterDisabled('a')).toBe(false);
        expect(result.current.isLetterDisabled('w')).toBe(false);
    });

    test('loadError is false initially', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useDefinitionMaster());

        expect(result.current.loadError).toBe(false);
    });

    test('loadError is true when loadDefinition returns undefined', async () => {
        mockUseWordsContext.mockReturnValue(makeContext());
        mockLoadDefinition.mockResolvedValue(undefined);

        const { result } = renderHook(() => useDefinitionMaster());

        await act(async () => {
            await result.current.handleLetterClick('a');
        });

        expect(result.current.loadError).toBe(true);
    });

    test('beginner gameLevel uses only def number 1', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockLoadDefinition.mockResolvedValue({
            gato: {
                definitions: [
                    { number: 1, definition: 'Animal felino doméstico' },
                    { number: 2, definition: 'Dispositivo para levantar vehículos' },
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

        const correctEntry = result.current.quizWords[0].find(q => q.isCorrect);
        expect(correctEntry?.definition).toBe('Animal felino doméstico');
    });

    test('isLoadingLetter is false initially', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { result } = renderHook(() => useDefinitionMaster());

        expect(result.current.isLoadingLetter).toBe(false);
    });

    test('isLoadingLetter is true during handleLetterClick fetch', async () => {
        mockUseWordsContext.mockReturnValue(makeContext());
        let resolveLoad!: (v: unknown) => void;
        mockLoadDefinition.mockReturnValue(new Promise((res) => { resolveLoad = res; }));

        const { result } = renderHook(() => useDefinitionMaster());

        act(() => { result.current.handleLetterClick('a'); });
        expect(result.current.isLoadingLetter).toBe(true);

        await act(async () => { resolveLoad({}); });
        expect(result.current.isLoadingLetter).toBe(false);
    });
});
