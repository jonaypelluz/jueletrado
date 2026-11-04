import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { GeneralTranslations } from '@config/translations/General';
import { createGamesConfig } from '@hooks/useGamesConfig';
import UI from '@games/spellingBee/UI';

const gameConfig = createGamesConfig('es', 'spellingBee')!;

const ROUND = { word: 'casa', definition: 'Vivienda de una familia', type: 'sustantivo' };

type UIProps = React.ComponentProps<typeof UI>;

const baseProps: UIProps = {
    gameConfig,
    locale: 'es',
    gameLevel: 'beginner',
    isGameStarted: true,
    isLoadingLetter: false,
    loadError: false,
    isFinished: false,
    rounds: [ROUND],
    currentRound: 0,
    totalRounds: 1,
    failedAttempts: 0,
    maxAttempts: 3,
    accentRetryUsed: false,
    hint: { length: 4, firstLetter: null, lastLetter: null },
    guess: '',
    feedback: null,
    isRoundOver: false,
    score: 0,
    maxScore: 3,
    handleGuessChange: jest.fn(),
    handleGameStartClick: jest.fn(),
    handleSubmit: jest.fn(),
    handleNextClick: jest.fn(),
    handlePlayAgainClick: jest.fn(),
};

const renderUI = (props: Partial<UIProps> = {}) =>
    render(
        <IntlProvider locale="es" messages={GeneralTranslations.es} onError={() => {}}>
            <UI {...baseProps} {...props} />
        </IntlProvider>,
    );

describe('SpellingBee UI', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('asks to choose a level before playing when no level is set', () => {
        renderUI({ isGameStarted: false, gameLevel: null });

        expect(screen.getByRole('button', { name: 'Elige un nivel para jugar' })).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'Jugar' })).not.toBeInTheDocument();
    });

    test('shows an enabled Play button once a level is set', () => {
        renderUI({ isGameStarted: false, gameLevel: 'beginner' });

        expect(screen.getByRole('button', { name: 'Jugar' })).toBeEnabled();
    });

    test('the guess input disables browser autocorrection and uses the game locale', () => {
        renderUI();

        const input = screen.getByLabelText('Escribe la palabra');
        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveAttribute('autocomplete', 'off');
        expect(input).toHaveAttribute('autocorrect', 'off');
        expect(input).toHaveAttribute('autocapitalize', 'none');
        expect(input).toHaveAttribute('spellcheck', 'false');
        expect(input).toHaveAttribute('lang', 'es');
    });

    test('the Check button is disabled while the guess is only whitespace', () => {
        renderUI({ guess: '   ' });

        expect(screen.getByRole('button', { name: 'Comprobar palabra' })).toBeDisabled();
    });

    test('the Check button is enabled once a guess is typed', () => {
        renderUI({ guess: 'casa' });

        expect(screen.getByRole('button', { name: 'Comprobar palabra' })).toBeEnabled();
    });

    test('typing in the input reports the new guess', () => {
        const handleGuessChange = jest.fn();
        renderUI({ handleGuessChange });

        fireEvent.change(screen.getByLabelText('Escribe la palabra'), { target: { value: 'cas' } });

        expect(handleGuessChange).toHaveBeenCalledWith('cas');
    });

    test('submitting the form checks the guess', () => {
        const handleSubmit = jest.fn((event?: { preventDefault: () => void }) => event?.preventDefault());
        renderUI({ guess: 'casa', handleSubmit });

        fireEvent.click(screen.getByRole('button', { name: 'Comprobar palabra' }));

        expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    test('when the round is over every box shows the word and Next moves on', () => {
        const handleNextClick = jest.fn();
        const { container } = renderUI({
            isRoundOver: true,
            failedAttempts: 3,
            hint: { length: 4, firstLetter: 'c', lastLetter: 'a' },
            feedback: { kind: 'revealed', word: 'casa' },
            handleNextClick,
        });

        const boxes = Array.from(container.querySelectorAll('.spelling-bee-box')).map((box) => box.textContent);
        expect(boxes).toEqual(['c', 'a', 's', 'a']);

        fireEvent.click(screen.getByRole('button', { name: 'Siguiente palabra' }));
        expect(handleNextClick).toHaveBeenCalledTimes(1);
    });

    test('after one wrong attempt only the first letter box is filled', () => {
        const { container } = renderUI({
            failedAttempts: 1,
            hint: { length: 4, firstLetter: 'c', lastLetter: null },
        });

        const boxes = Array.from(container.querySelectorAll('.spelling-bee-box')).map((box) => box.textContent);
        expect(boxes).toEqual(['c', '', '', '']);
    });

    test('the final screen shows the score out of the maximum', () => {
        renderUI({ isFinished: true, score: 9, maxScore: 15 });

        expect(screen.getByText('Puntuación final: 9 / 15')).toBeInTheDocument();
    });

    test('Play again on the final screen starts a new game', () => {
        const handlePlayAgainClick = jest.fn();
        renderUI({ isFinished: true, score: 9, maxScore: 15, handlePlayAgainClick });

        fireEvent.click(screen.getByRole('button', { name: 'Jugar otra vez' }));

        expect(handlePlayAgainClick).toHaveBeenCalledTimes(1);
    });

    test('a load error offers a retry that restarts the game', () => {
        const handleGameStartClick = jest.fn();
        renderUI({ loadError: true, rounds: [], totalRounds: 0, hint: null, handleGameStartClick });

        fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

        expect(handleGameStartClick).toHaveBeenCalledTimes(1);
    });
});
