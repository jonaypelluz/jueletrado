import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createGamesConfig } from '@hooks/useGamesConfig';
import { useWordsContext } from '@store/WordsContext';
import useSpellTower from '@games/spellTower/useSpellTower';
import UI from '@games/spellTower/UI';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getFullWordSet: jest.fn().mockResolvedValue(new Set<string>(['gato', 'perro'])),
    getSessionWords: jest.fn().mockResolvedValue(['gato', 'perro']),
}));
jest.mock('@utils/WordGameProcessor', () => {
    return jest.fn().mockImplementation(() => ({
        processWord: (word: string) => [word, `${word}x`],
        processWordWithAccent: (word: string) => [word, `${word}á`],
    }));
});

const mockUseWordsContext = useWordsContext as jest.Mock;
const gameConfig = createGamesConfig('es', 'spellTower')!;

const SpellTowerGame = () => {
    const gameLogic = useSpellTower();
    return <UI gameConfig={gameConfig} {...gameLogic} />;
};

describe('SpellTower UI', () => {
    beforeEach(() => {
        mockUseWordsContext.mockReturnValue({
            locale: 'es',
            gameLevel: 'beginner',
            error: null,
            setError: jest.fn(),
            setLoadingProgress: jest.fn(),
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Play button becomes clickable once words load and starting the game renders word variations', async () => {
        render(
            <IntlProvider locale="es" messages={{}} onError={() => {}}>
                <SpellTowerGame />
            </IntlProvider>,
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'gamePlay' })).toBeEnabled();
        });
        const playButton = screen.getByRole('button', { name: 'gamePlay' });

        fireEvent.click(playButton);

        await waitFor(() => {
            expect(document.querySelectorAll('.variation-btn')).toHaveLength(2);
        });
    });
});
