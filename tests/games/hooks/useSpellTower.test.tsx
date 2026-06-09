import { renderHook, waitFor } from '@testing-library/react';
import { getSessionWords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useSpellTower from '@games/spellTower/useSpellTower';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getSessionWords: jest.fn(),
    getLevelWordSet: jest.fn().mockResolvedValue(new Set<string>()),
}));
jest.mock('@hooks/useWordProcessor', () => ({
    useWordProcessor: () => ({
        processWords: (words: string[]) => words.map((w) => [w, w + 'x']),
        processLastWords: (words: string[][]) => words,
        processWordsWithAccents: (words: string[]) => words,
        filterWordsByLetters: async () => [],
    }),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockGetSessionWords = getSessionWords as jest.Mock;

const makeContext = (overrides: Partial<ReturnType<typeof useWordsContext>> = {}) => ({
    locale: 'es',
    gameLevel: null as string | null,
    error: null,
    setError: jest.fn(),
    ...overrides,
});

describe('useSpellTower', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('does not call getSessionWords when gameLevel is null', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: null }));

        renderHook(() => useSpellTower());

        await waitFor(() => {
            expect(mockGetSessionWords).not.toHaveBeenCalled();
        });
    });

    test('calls getSessionWords and sets showButton when gameLevel is set', async () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'beginner' }));

        const fakeWords = Array.from({ length: 15 }, (_, i) => `word${i}`);
        mockGetSessionWords.mockResolvedValue(fakeWords);
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);

        const { result } = renderHook(() => useSpellTower());

        await waitFor(() => {
            expect(mockGetSessionWords).toHaveBeenCalledWith(
                StorageService.WORDS_TOWER,
                15,
                'beginner',
                'es',
                expect.any(Function),
                { count: 120, minLength: 4 },
                30,
            );
            expect(result.current.showButton).toBe(true);
        });
    });

    test('returns gameLevel from context', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ gameLevel: 'intermediate' }));
        mockGetSessionWords.mockResolvedValue([]);

        const { result } = renderHook(() => useSpellTower());

        expect(result.current.gameLevel).toBe('intermediate');
    });
});
