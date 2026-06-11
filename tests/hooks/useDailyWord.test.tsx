import { renderHook, waitFor } from '@testing-library/react';
import { loadDailyWordForLocale } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import useDailyWord from '@hooks/useDailyWord';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    loadDailyWordForLocale: jest.fn(),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockLoadDailyWordForLocale = loadDailyWordForLocale as jest.Mock;

const makeContext = (overrides: Record<string, unknown> = {}) => ({
    hydrated: true,
    locale: 'es',
    wordOfTheDay: null,
    setWordOfTheDay: jest.fn(),
    ...overrides,
});

describe('useDailyWord', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('loads the daily word when hydrated and no word set', async () => {
        const setWordOfTheDay = jest.fn();
        mockUseWordsContext.mockReturnValue(makeContext({ setWordOfTheDay }));
        mockLoadDailyWordForLocale.mockResolvedValue('gato');

        renderHook(() => useDailyWord());

        await waitFor(() => {
            expect(setWordOfTheDay).toHaveBeenCalledWith('gato');
        });
        expect(mockLoadDailyWordForLocale).toHaveBeenCalledWith('es');
    });

    test('skips load when not hydrated', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ hydrated: false }));

        renderHook(() => useDailyWord());

        expect(mockLoadDailyWordForLocale).not.toHaveBeenCalled();
    });

    test('skips load when word already set', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ wordOfTheDay: 'perro' }));

        renderHook(() => useDailyWord());

        expect(mockLoadDailyWordForLocale).not.toHaveBeenCalled();
    });

    test('does nothing when loadDailyWordForLocale returns null', async () => {
        const setWordOfTheDay = jest.fn();
        mockUseWordsContext.mockReturnValue(makeContext({ setWordOfTheDay }));
        mockLoadDailyWordForLocale.mockResolvedValue(null);

        renderHook(() => useDailyWord());

        await waitFor(() => {
            expect(mockLoadDailyWordForLocale).toHaveBeenCalled();
        });
        expect(setWordOfTheDay).not.toHaveBeenCalled();
    });
});
