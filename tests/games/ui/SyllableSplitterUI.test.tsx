import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { GeneralTranslations } from '@config/translations/General';
import { createGamesConfig } from '@hooks/useGamesConfig';
import UI from '@games/syllableSplitter/UI';

const gameConfig = createGamesConfig('es', 'syllableSplitter')!;

// casa → ca-sa: the only divider sits at position 2.
const CHALLENGE = { word: 'casa', syllables: ['ca', 'sa'], dividers: [2] };

type UIProps = React.ComponentProps<typeof UI>;

const baseProps: UIProps = {
    gameConfig,
    error: null,
    gameLevel: 'beginner',
    isLevelLoading: false,
    showButton: false,
    challenges: [CHALLENGE],
    currentIndex: 0,
    gameStarted: true,
    hasBeenPlayed: true,
    selectedDividers: [],
    isChecked: false,
    lastCheckCorrect: null,
    correctAnswers: 0,
    incorrectAnswers: [],
    isLoading: false,
    handleGameStartClick: jest.fn(),
    handleGapClick: jest.fn(),
    handleCheckClick: jest.fn(),
    handleNextClick: jest.fn(),
};

const renderUI = (props: Partial<UIProps> = {}) =>
    render(
        <IntlProvider locale="es" messages={GeneralTranslations.es} onError={() => {}}>
            <UI {...baseProps} {...props} />
        </IntlProvider>,
    );

describe('SyllableSplitter UI', () => {
    test('shows the score with an "Aciertos" label', () => {
        renderUI({ correctAnswers: 3 });

        expect(screen.getByText('Aciertos: 3')).toBeInTheDocument();
    });

    test('keeps an empty polite live region before the word is checked', () => {
        const { container } = renderUI();

        const live = container.querySelector('[aria-live="polite"]');
        expect(live).toBeInTheDocument();
        expect(live).toBeEmptyDOMElement();
    });

    test.each([
        [true, '¡Correcto!'],
        [false, 'Incorrecto'],
    ])('announces the result in the live region after checking (correct: %s)', (lastCheckCorrect, text) => {
        const { container } = renderUI({
            isChecked: true,
            lastCheckCorrect,
            selectedDividers: lastCheckCorrect ? [2] : [],
        });

        expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(text);
    });

    test('adds the check state to the gap labels so a missed divider is announced', () => {
        renderUI({ isChecked: true, lastCheckCorrect: false, selectedDividers: [1] });

        expect(screen.getByRole('button', { name: 'Divisor entre c y a, incorrecto' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Divisor entre a y s, faltaba' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Divisor entre s y a' })).toBeInTheDocument();
    });

    test('labels a correctly placed divider as correct', () => {
        renderUI({ isChecked: true, lastCheckCorrect: true, selectedDividers: [2] });

        expect(screen.getByRole('button', { name: 'Divisor entre a y s, correcto' })).toBeInTheDocument();
    });

    test('gap labels carry no state before checking', () => {
        renderUI({ selectedDividers: [2] });

        expect(screen.getByRole('button', { name: 'Divisor entre a y s' })).toBeInTheDocument();
    });

    test('shows a load error on the rules screen', () => {
        renderUI({
            hasBeenPlayed: false,
            gameStarted: false,
            challenges: null,
            showButton: true,
            error: new Error('No se pudieron cargar las palabras'),
        });

        expect(screen.getByText('No se pudieron cargar las palabras')).toBeInTheDocument();
        expect(screen.getByText(gameConfig.gameRules.gameGoal)).toBeInTheDocument();
    });
});
