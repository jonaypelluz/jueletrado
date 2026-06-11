import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createGamesConfig } from '@hooks/useGamesConfig';
import { getSessionWords } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import useWordFinder from '@games/wordFinder/useWordFinder';
import UI from '@games/wordFinder/UI';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getSessionWords: jest.fn(),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockGetSessionWords = getSessionWords as jest.Mock;
const gameConfig = createGamesConfig('es', 'wordFinder')!;

const WordFinderGame = () => {
    const gameLogic = useWordFinder();
    return <UI gameConfig={gameConfig} {...gameLogic} />;
};

describe('WordFinder UI', () => {
    beforeEach(() => {
        mockUseWordsContext.mockReturnValue({
            locale: 'es',
            gameLevel: 'beginner',
            error: null,
            setError: jest.fn(),
        });
        mockGetSessionWords.mockResolvedValue(['gato']);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Play button becomes clickable once words load and starting the game renders the letter inputs', async () => {
        render(
            <IntlProvider locale="es" messages={{}} onError={() => {}}>
                <WordFinderGame />
            </IntlProvider>,
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'gamePlay' })).toBeEnabled();
        });
        const playButton = screen.getByRole('button', { name: 'gamePlay' });

        fireEvent.click(playButton);

        await waitFor(() => {
            expect(screen.getAllByRole('textbox')).toHaveLength(4);
        });
    });
});
