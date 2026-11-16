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
    // jsdom has no scrollIntoView (the quiz calls it on each new word).
    const scrollIntoView = jest.fn();

    beforeEach(() => {
        Element.prototype.scrollIntoView = scrollIntoView;
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
        delete (Element.prototype as Partial<Element>).scrollIntoView;
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

    test('after Next brings the new question into view (a phone stays scrolled down at the Next button)', async () => {
        render(
            <IntlProvider locale="es" messages={{ gameQuizWord: '{quizWord}' }} onError={() => {}}>
                <DefinitionMasterGame />
            </IntlProvider>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'gamePlay' }));
        fireEvent.click(await screen.findByRole('button', { name: 'A' }));
        await waitFor(() => expect(document.querySelectorAll('.definition-btn').length).toBeGreaterThan(0));
        const firstHeading = document.querySelector('.definition-master-quiz h2')!.textContent;

        scrollIntoView.mockClear();
        fireEvent.click(document.querySelector('.definition-btn')!);
        fireEvent.click(screen.getByRole('button', { name: 'gameQuizWordNextWord' }));

        await waitFor(() => expect(document.querySelector('.definition-master-quiz h2')!.textContent).not.toBe(firstHeading));
        expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
        expect(scrollIntoView.mock.instances.at(-1)).toBe(document.querySelector('.definition-master-quiz h2'));
    });
});
