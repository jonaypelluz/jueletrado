import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createGamesConfig } from '@hooks/useGamesConfig';
import { loadDefinition } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import useCrossWordPuzzle from '@games/crossWordPuzzle/useCrossWordPuzzle';
import UI from '@games/crossWordPuzzle/UI';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    loadDefinition: jest.fn(),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockLoadDefinition = loadDefinition as jest.Mock;
const gameConfig = createGamesConfig('es', 'crossWordPuzzle')!;

const CrossWordPuzzleGame = () => {
    const gameLogic = useCrossWordPuzzle();
    return <UI gameConfig={gameConfig} {...gameLogic} />;
};

describe('CrossWordPuzzle UI', () => {
    beforeEach(() => {
        mockUseWordsContext.mockReturnValue({
            locale: 'es',
            gameLevel: 'beginner',
        });
        mockLoadDefinition.mockResolvedValue({
            perro: { definitions: [{ number: 1, definition: 'Animal doméstico que ladra.' }] },
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Play button is clickable and starting the game renders the crossword grid', async () => {
        render(
            <IntlProvider locale="es" messages={{}} onError={() => {}}>
                <CrossWordPuzzleGame />
            </IntlProvider>,
        );

        const playButton = screen.getByRole('button', { name: 'gamePlay' });
        expect(playButton).toBeEnabled();

        fireEvent.click(playButton);

        await waitFor(() => {
            expect(document.querySelectorAll('.crossword-grid-container input').length).toBeGreaterThan(0);
        });
    });
});
