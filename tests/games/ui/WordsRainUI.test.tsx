import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createGamesConfig } from '@hooks/useGamesConfig';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import useWordsRain from '@games/wordsRain/useWordsRain';
import UI from '@games/wordsRain/UI';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getFullWordSet: jest.fn().mockResolvedValue(new Set<string>(['gato', 'perro', 'pato'])),
    getWords: jest.fn().mockResolvedValue(['gato', 'perro', 'pato']),
}));
jest.mock('@utils/WordGameProcessor', () => {
    return jest.fn().mockImplementation(() => ({
        processWord: (word: string) => [word],
        processWordWithAccent: (word: string) => [word],
    }));
});

const mockUseWordsContext = useWordsContext as jest.Mock;
const gameConfig = createGamesConfig('es', 'wordsRain')!;

const WordsRainGame = () => {
    const gameLogic = useWordsRain();
    return <UI gameConfig={gameConfig} {...gameLogic} />;
};

describe('WordsRain UI', () => {
    beforeAll(() => {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
            configurable: true,
            value: 800,
        });
    });

    beforeEach(() => {
        mockUseWordsContext.mockReturnValue({
            locale: 'es',
            gameLevel: 'beginner',
            error: null,
            setError: jest.fn(),
            setLoading: jest.fn(),
            setLoadingProgress: jest.fn(),
        });
        jest.spyOn(StorageService, 'getItem').mockReturnValue(null);
        jest.spyOn(StorageService, 'setItem').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    test('Play button becomes clickable once words load and starting the game makes words rain', async () => {
        render(
            <IntlProvider locale="es" messages={{}} onError={() => {}}>
                <WordsRainGame />
            </IntlProvider>,
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'gamePlay' })).toBeEnabled();
        });
        const playButton = screen.getByRole('button', { name: 'gamePlay' });

        jest.useFakeTimers();
        fireEvent.click(playButton);

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        const fallingWords = document.querySelectorAll('.words-rain-word');
        expect(fallingWords.length).toBeGreaterThan(0);
    });
});
