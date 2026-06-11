import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingMessages } from '@config/translations/General';
import { useWordsContext } from '@store/WordsContext';
import LoadingBanner from '@components/LoadingBanner';

jest.mock('@store/WordsContext');

const mockUseWordsContext = useWordsContext as jest.Mock;

const makeContext = (overrides: Record<string, unknown> = {}) => ({
    locale: 'es',
    generalLoading: false,
    isLoading: false,
    loadingProgress: 0,
    ...overrides,
});

describe('LoadingBanner', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders nothing when idle', () => {
        mockUseWordsContext.mockReturnValue(makeContext());

        const { container } = render(<LoadingBanner />);

        expect(container).toBeEmptyDOMElement();
    });

    test('shows banner with a loading message when isLoading', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ isLoading: true }));

        render(<LoadingBanner />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText(LoadingMessages['es'][0])).toBeInTheDocument();
    });

    test('shows banner when generalLoading', () => {
        mockUseWordsContext.mockReturnValue(makeContext({ generalLoading: true }));

        expect(render(<LoadingBanner />).container).not.toBeEmptyDOMElement();
    });

    test('shows progress percentage only during chunk load', () => {
        mockUseWordsContext.mockReturnValue(
            makeContext({ isLoading: true, loadingProgress: 42 }),
        );

        render(<LoadingBanner />);

        expect(screen.getByText('42%')).toBeInTheDocument();
    });

    test('hides progress percentage at 0 and 100', () => {
        mockUseWordsContext.mockReturnValue(
            makeContext({ isLoading: true, loadingProgress: 100 }),
        );

        render(<LoadingBanner />);

        expect(screen.queryByText('100%')).not.toBeInTheDocument();
    });

    test('rotates the message every 3 seconds', () => {
        jest.useFakeTimers();
        mockUseWordsContext.mockReturnValue(makeContext({ isLoading: true }));

        render(<LoadingBanner />);

        expect(screen.getByText(LoadingMessages['es'][0])).toBeInTheDocument();

        const { act } = jest.requireActual<typeof import('react')>('react');
        act(() => {
            jest.advanceTimersByTime(3000);
        });

        expect(screen.getByText(LoadingMessages['es'][1])).toBeInTheDocument();
        jest.useRealTimers();
    });
});
