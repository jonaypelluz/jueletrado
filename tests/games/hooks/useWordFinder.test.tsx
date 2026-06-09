import { renderHook, waitFor } from '@testing-library/react';
import { getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useWordFinder from '@games/wordFinder/useWordFinder';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService');

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockGetSessionWords = getSessionWords as jest.Mock;

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: null as string | null,
    error: null,
    setError: jest.fn(),
    ...overrides,
});

describe('useWordFinder', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    test('does not call getSessionWords when gameLevel is null', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: null }));

        renderHook(() => useWordFinder());

        await waitFor(() => {
            expect(mockGetSessionWords).not.toHaveBeenCalled();
        });
    });

    test('calls getSessionWords and sets showButton when gameLevel is set', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));

        const fakeWords = Array.from({ length: 10 }, (_, i) => `word${i}`);
        mockGetSessionWords.mockResolvedValue(fakeWords);
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);

        const { result } = renderHook(() => useWordFinder());

        await waitFor(() => {
            expect(mockGetSessionWords).toHaveBeenCalledWith(
                StorageService.WORDS_FINDER,
                10,
                'beginner',
                'es',
                expect.any(Function),
                { count: 60, maxLength: 9, minLength: 4 },
                20,
            );
            expect(result.current.showButton).toBe(true);
        });
    });

    test('returns gameLevel from context', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));
        mockGetSessionWords.mockResolvedValue([]);

        const { result } = renderHook(() => useWordFinder());

        expect(result.current.gameLevel).toBe('beginner');
    });
});
