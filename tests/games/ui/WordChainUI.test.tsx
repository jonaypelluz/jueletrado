import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createGamesConfig } from '@hooks/useGamesConfig';
import UI from '@games/wordChain/UI';

const gameConfig = createGamesConfig('es', 'wordChain')!;

const baseProps = {
    gameConfig,
    locale: 'es',
    gameLevel: 'beginner',
    error: null,
    isLoading: false,
    showButton: false,
    loadError: false,
    gameStarted: false,
    hasBeenPlayed: false,
    isGameOver: false,
    chain: [],
    requiredLetter: '',
    countdown: 0,
    isLowTime: false,
    score: 0,
    best: 0,
    isNewRecord: false,
    rejection: null,
    input: '',
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    handleGameStartClick: jest.fn(),
};

const renderUI = (props: Partial<typeof baseProps>) =>
    render(
        <IntlProvider locale="es" messages={{}} onError={() => {}}>
            <UI {...baseProps} {...props} />
        </IntlProvider>,
    );

describe('WordChain UI', () => {
    test('while the word set loads, the disabled button says loading and a spinner shows', () => {
        const { container } = renderUI({ isLoading: true });

        expect(screen.getByRole('button', { name: 'gameLoading' })).toBeDisabled();
        expect(container.querySelector('.spinner-circle')).not.toBeNull();
    });

    test('once loaded, the Play button is enabled and the spinner is gone', () => {
        const { container } = renderUI({ showButton: true });

        expect(screen.getByRole('button', { name: 'gamePlay' })).toBeEnabled();
        expect(container.querySelector('.spinner-circle')).toBeNull();
    });
});
