import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createGamesConfig } from '@hooks/useGamesConfig';
import { getDefinitions } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import useDefinitionMaster from '@games/definitionMaster/useDefinitionMaster';
import UI from '@games/definitionMaster/UI';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getDefinitions: jest.fn(),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const mockGetDefinitions = getDefinitions as jest.Mock;
const gameConfig = createGamesConfig('es', 'definitionMaster')!;

const DefinitionMasterGame = () => {
    const gameLogic = useDefinitionMaster();
    return <UI gameConfig={gameConfig} {...gameLogic} />;
};

describe('DefinitionMaster UI', () => {
    beforeEach(() => {
        mockUseWordsContext.mockReturnValue({
            locale: 'es',
            gameLevel: 'beginner',
        });
        mockGetDefinitions.mockResolvedValue({
            gato: { definitions: [{ number: 1, definition: 'Animal doméstico que dice miau.' }] },
            perro: { definitions: [{ number: 1, definition: 'Animal doméstico que ladra.' }] },
            pato: { definitions: [{ number: 1, definition: 'Ave acuática.' }] },
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Play button is clickable and choosing a letter renders the definitions quiz', async () => {
        render(
            <IntlProvider locale="es" messages={{}} onError={() => {}}>
                <DefinitionMasterGame />
            </IntlProvider>,
        );

        const playButton = screen.getByRole('button', { name: 'gamePlay' });
        expect(playButton).toBeEnabled();

        fireEvent.click(playButton);

        const letterButton = await screen.findByRole('button', { name: 'A' });
        fireEvent.click(letterButton);

        await waitFor(() => {
            expect(document.querySelectorAll('.definition-btn').length).toBeGreaterThan(0);
        });
    });
});
