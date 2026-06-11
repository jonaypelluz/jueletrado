import { act, renderHook } from '@testing-library/react';
import {
    clearWordGroupCaches,
    isLevelPopulated,
    populateWordsDB,
    prefetchWordGroups,
} from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useLevelLoader, { __resetLevelLoaderForTests } from '@hooks/useLevelLoader';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    clearWordGroupCaches: jest.fn(),
    isLevelPopulated: jest.fn(),
    populateWordsDB: jest.fn(),
    prefetchWordGroups: jest.fn(),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockIsLevelPopulated = isLevelPopulated as jest.Mock;
const mockPopulateWordsDB = populateWordsDB as jest.Mock;
const mockPrefetchWordGroups = prefetchWordGroups as jest.Mock;
const mockClearWordGroupCaches = clearWordGroupCaches as jest.Mock;

const makeContext = () => ({
    locale: 'es',
    setGameLevel: jest.fn(),
    setLoading: jest.fn(),
    setLoadingProgress: jest.fn(),
    setError: jest.fn(),
});

describe('useLevelLoader', () => {
    beforeEach(() => {
        __resetLevelLoaderForTests();
        mockPrefetchWordGroups.mockResolvedValue(true);
        jest.spyOn(StorageService, 'setItem').mockReturnValue(undefined);
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test('sets gameLevel immediately (optimistic), before any loading', async () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(false);
        mockPopulateWordsDB.mockResolvedValue(true);

        const { result } = renderHook(() => useLevelLoader());

        await act(async () => {
            result.current.selectLevel('beginner');
        });

        expect(ctx.setGameLevel).toHaveBeenCalledWith('beginner');
    });

    test('skips populateWordsDB when level already populated, still prefetches groups', async () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(true);

        const { result } = renderHook(() => useLevelLoader());

        await act(async () => {
            result.current.selectLevel('beginner');
        });

        expect(mockPopulateWordsDB).not.toHaveBeenCalled();
        expect(mockClearWordGroupCaches).toHaveBeenCalled();
        expect(mockPrefetchWordGroups).toHaveBeenCalledWith('beginner', 'es', ctx.setError);
        expect(ctx.setLoading).toHaveBeenCalledWith(true);
        expect(ctx.setLoading).toHaveBeenLastCalledWith(false);
    });

    test('populates DB when level not populated', async () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(false);
        mockPopulateWordsDB.mockResolvedValue(true);

        const { result } = renderHook(() => useLevelLoader());

        await act(async () => {
            result.current.selectLevel('advanced');
        });

        expect(mockPopulateWordsDB).toHaveBeenCalledWith(
            'advanced',
            'es',
            ctx.setError,
            ctx.setLoadingProgress,
        );
        expect(mockPrefetchWordGroups).toHaveBeenCalledWith('advanced', 'es', ctx.setError);
    });

    test('stores selected level after successful load', async () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(true);
        const setItemSpy = jest.spyOn(StorageService, 'setItem').mockReturnValue(undefined);

        const { result } = renderHook(() => useLevelLoader());

        await act(async () => {
            result.current.selectLevel('intermediate');
        });

        expect(setItemSpy).toHaveBeenCalledWith(
            StorageService.SELECTED_LEVEL,
            'intermediate',
            expect.any(Number),
        );
    });

    test('does not persist level or prefetch when populateWordsDB fails, but still clears loading', async () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(false);
        mockPopulateWordsDB.mockResolvedValue(false);
        const setItemSpy = jest.spyOn(StorageService, 'setItem').mockReturnValue(undefined);

        const { result } = renderHook(() => useLevelLoader());

        await act(async () => {
            result.current.selectLevel('beginner');
        });

        expect(ctx.setGameLevel).toHaveBeenCalledWith('beginner');
        expect(setItemSpy).not.toHaveBeenCalledWith(
            StorageService.SELECTED_LEVEL,
            expect.anything(),
            expect.anything(),
        );
        expect(mockPrefetchWordGroups).not.toHaveBeenCalled();
        expect(ctx.setLoading).toHaveBeenLastCalledWith(false);
    });

    test('level switch during load is queued and runs after, spinner stays on throughout', async () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(false);

        let resolveFirst!: (val: boolean) => void;
        mockPopulateWordsDB
            .mockReturnValueOnce(
                new Promise<boolean>((res) => {
                    resolveFirst = res;
                }),
            )
            .mockResolvedValue(true);

        const { result } = renderHook(() => useLevelLoader());

        act(() => {
            result.current.selectLevel('beginner');
        });

        // Switch while first load is in-flight — name changes, load queued.
        act(() => {
            result.current.selectLevel('advanced');
        });

        expect(ctx.setGameLevel).toHaveBeenCalledWith('advanced');
        expect(mockPopulateWordsDB).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolveFirst(true);
        });

        // Queued level loaded after the first finished.
        expect(mockPopulateWordsDB).toHaveBeenCalledTimes(2);
        expect(mockPopulateWordsDB).toHaveBeenLastCalledWith(
            'advanced',
            'es',
            ctx.setError,
            ctx.setLoadingProgress,
        );
        // Loading never flipped off between the two loads.
        const calls = ctx.setLoading.mock.calls.map((c: boolean[]) => c[0]);
        expect(calls.filter((v: boolean) => v === false)).toHaveLength(1);
        expect(calls[calls.length - 1]).toBe(false);
    });

    test('re-selecting the same level during load does not reload it', async () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(false);

        let resolveFirst!: (val: boolean) => void;
        mockPopulateWordsDB.mockReturnValueOnce(
            new Promise<boolean>((res) => {
                resolveFirst = res;
            }),
        );

        const { result } = renderHook(() => useLevelLoader());

        act(() => {
            result.current.selectLevel('beginner');
        });
        act(() => {
            result.current.selectLevel('beginner');
        });

        await act(async () => {
            resolveFirst(true);
        });

        expect(mockPopulateWordsDB).toHaveBeenCalledTimes(1);
        expect(ctx.setLoading).toHaveBeenLastCalledWith(false);
    });
});
