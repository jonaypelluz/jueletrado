import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createGamesConfig } from '@hooks/useGamesConfig';
import { useWordsContext } from '@store/WordsContext';
import useWordBuilder from '@games/wordBuilder/useWordBuilder';
import UI from '@games/wordBuilder/UI';

jest.mock('@store/WordsContext');
jest.mock('@services/WordsService', () => ({
    getFullWordSet: jest.fn().mockResolvedValue(new Set<string>(['gato', 'perro', 'pato'])),
}));
jest.mock('@hooks/useWordProcessor', () => ({
    useWordProcessor: () => ({
        filterWordsByLetters: async (_letters: string[], allWords: string[]) => allWords.slice(0, 3),
    }),
}));

const mockUseWordsContext = useWordsContext as jest.Mock;
const gameConfig = createGamesConfig('es', 'wordBuilder')!;

const WordBuilderGame = () => {
    const gameLogic = useWordBuilder();
    return <UI gameConfig={gameConfig} {...gameLogic} />;
};

describe('WordBuilder UI', () => {
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

    test('Play button becomes clickable once words load and starting the game renders the letter tiles', async () => {
        render(
            <IntlProvider locale="es" messages={{}} onError={() => {}}>
                <WordBuilderGame />
            </IntlProvider>,
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'gamePlay' })).toBeEnabled();
        });
        const playButton = screen.getByRole('button', { name: 'gamePlay' });

        fireEvent.click(playButton);

        await waitFor(() => {
            expect(document.querySelectorAll('.letter-tile')).toHaveLength(6);
        });
    });
});
