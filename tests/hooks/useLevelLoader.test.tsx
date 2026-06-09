import { act, renderHook } from '@testing-library/react';
import {
    clearWordGroupCaches,
    isLevelPopulated,
    populateWordsDB,
} from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useLevelLoader from '@hooks/useLevelLoader';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    clearWordGroupCaches: jest.fn(),
    isLevelPopulated: jest.fn(),
    populateWordsDB: jest.fn(),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockIsLevelPopulated = isLevelPopulated as jest.Mock;
const mockPopulateWordsDB = populateWordsDB as jest.Mock;
const mockClearWordGroupCaches = clearWordGroupCaches as jest.Mock;

const makeContext = () => ({
    locale: 'es',
    setGameLevel: jest.fn(),
    setLoading: jest.fn(),
    setLoadingProgress: jest.fn(),
    setError: jest.fn(),
});

describe('useLevelLoader', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('selectLevel uses fast path when level already populated', () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(true);
        jest.spyOn(StorageService, 'setItem').mockReturnValue(undefined);

        const { result } = renderHook(() => useLevelLoader());

        act(() => {
            result.current.selectLevel('beginner');
        });

        expect(mockClearWordGroupCaches).toHaveBeenCalled();
        expect(mockIsLevelPopulated).toHaveBeenCalledWith('beginner', 'es');
        expect(ctx.setGameLevel).toHaveBeenCalledWith('beginner');
        expect(mockPopulateWordsDB).not.toHaveBeenCalled();
    });

    test('fast path calls onAfterLoad callback', () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(true);
        jest.spyOn(StorageService, 'setItem').mockReturnValue(undefined);
        const callback = jest.fn();

        const { result } = renderHook(() => useLevelLoader());

        act(() => {
            result.current.selectLevel('beginner', callback);
        });

        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('fast path stores selected level in StorageService', () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(true);
        const setItemSpy = jest.spyOn(StorageService, 'setItem').mockReturnValue(undefined);

        const { result } = renderHook(() => useLevelLoader());

        act(() => {
            result.current.selectLevel('intermediate');
        });

        expect(setItemSpy).toHaveBeenCalledWith(
            StorageService.SELECTED_LEVEL,
            'intermediate',
            expect.any(Number),
        );
    });

    test('selectLevel calls populateWordsDB when level not populated', async () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(false);
        mockPopulateWordsDB.mockResolvedValue(true);
        jest.spyOn(StorageService, 'setItem').mockReturnValue(undefined);

        const { result } = renderHook(() => useLevelLoader());

        await act(async () => {
            result.current.selectLevel('advanced');
        });

        expect(ctx.setLoading).toHaveBeenCalledWith(true);
        expect(mockPopulateWordsDB).toHaveBeenCalledWith(
            'advanced',
            'es',
            ctx.setError,
            ctx.setLoadingProgress,
        );
    });

    test('slow path sets gameLevel and calls onAfterLoad after populate', async () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(false);
        mockPopulateWordsDB.mockResolvedValue(true);
        jest.spyOn(StorageService, 'setItem').mockReturnValue(undefined);
        const callback = jest.fn();

        const { result } = renderHook(() => useLevelLoader());

        await act(async () => {
            result.current.selectLevel('advanced', callback);
        });

        expect(ctx.setGameLevel).toHaveBeenCalledWith('advanced');
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('slow path does not set gameLevel when populateWordsDB returns false', async () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(false);
        mockPopulateWordsDB.mockResolvedValue(false);

        const { result } = renderHook(() => useLevelLoader());

        await act(async () => {
            result.current.selectLevel('beginner');
        });

        expect(ctx.setGameLevel).not.toHaveBeenCalled();
    });

    test('second selectLevel call while populating is ignored', async () => {
        const ctx = makeContext();
        mockUseWordsContext.mockReturnValue(ctx);
        mockIsLevelPopulated.mockReturnValue(false);

        let resolvePopulate!: (val: boolean) => void;
        mockPopulateWordsDB.mockReturnValue(
            new Promise<boolean>((res) => {
                resolvePopulate = res;
            }),
        );

        const { result } = renderHook(() => useLevelLoader());

        act(() => {
            result.current.selectLevel('beginner');
        });

        // second call while first is in-flight — should be ignored
        act(() => {
            result.current.selectLevel('advanced');
        });

        expect(mockPopulateWordsDB).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolvePopulate(true);
        });
    });
});
