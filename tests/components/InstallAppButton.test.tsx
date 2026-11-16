import React from 'react';
import { IntlProvider } from 'react-intl';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GeneralTranslations } from '@config/translations/General';
import InstallAppButton from '@components/InstallAppButton';

const INSTALL_LABEL = GeneralTranslations.es.installApp as string;
const IOS_STEPS = GeneralTranslations.es.installAppIosSteps as string;
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0 Safari/537.36';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const NAVIGATOR_PROPS = ['userAgent', 'platform', 'maxTouchPoints', 'standalone'] as const;

const setNavigator = (props: Partial<Record<(typeof NAVIGATOR_PROPS)[number], unknown>>) => {
    for (const [key, value] of Object.entries(props)) {
        Object.defineProperty(window.navigator, key, { value, configurable: true });
    }
};

const stubDisplayMode = (standalone: boolean) => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: standalone && query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    }));
};

const dispatchInstallPrompt = (userChoice = Promise.resolve({ outcome: 'accepted' })) => {
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
        prompt: jest.Mock;
        userChoice: Promise<{ outcome: string }>;
    };
    event.prompt = jest.fn().mockResolvedValue(undefined);
    event.userChoice = userChoice;
    act(() => {
        window.dispatchEvent(event);
    });
    return event;
};

const renderButton = () =>
    render(
        <IntlProvider locale="es" messages={GeneralTranslations.es as Record<string, string>} onError={() => {}}>
            <InstallAppButton />
        </IntlProvider>,
    );

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
    setNavigator({ userAgent: DESKTOP_UA, platform: 'Win32', maxTouchPoints: 0, standalone: undefined });
    stubDisplayMode(false);
});

afterEach(() => {
    for (const key of NAVIGATOR_PROPS) {
        delete (window.navigator as unknown as Record<string, unknown>)[key];
    }
    window.matchMedia = originalMatchMedia;
});

describe('InstallAppButton', () => {
    // The offered prompt lives in a module store: start each test without one.
    afterEach(() => {
        act(() => {
            window.dispatchEvent(new Event('appinstalled'));
        });
    });

    test('shows nothing on a non-iOS browser that has not offered install', () => {
        const { container } = renderButton();

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(container).toBeEmptyDOMElement();
    });

    test('offers install after beforeinstallprompt and hides once the prompt is answered', async () => {
        let answer!: (choice: { outcome: string }) => void;
        const userChoice = new Promise<{ outcome: string }>((resolve) => {
            answer = resolve;
        });
        renderButton();
        const event = dispatchInstallPrompt(userChoice);

        expect(event.defaultPrevented).toBe(true);
        fireEvent.click(screen.getByRole('button', { name: INSTALL_LABEL }));

        expect(event.prompt).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: INSTALL_LABEL })).toBeInTheDocument();

        await act(async () => {
            answer({ outcome: 'accepted' });
        });

        await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument());
    });

    test('on iOS shows the button and reveals the Add to Home Screen steps on click', () => {
        setNavigator({ userAgent: IPHONE_UA, platform: 'iPhone', maxTouchPoints: 5 });
        renderButton();

        expect(screen.queryByText(IOS_STEPS)).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: INSTALL_LABEL }));

        expect(screen.getByText(IOS_STEPS)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: INSTALL_LABEL })).toHaveAttribute('aria-expanded', 'true');
    });

    test('shows nothing when already running as an installed app, even after beforeinstallprompt', () => {
        stubDisplayMode(true);
        const { container } = renderButton();
        dispatchInstallPrompt();

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(container).toBeEmptyDOMElement();
    });

    test('shows nothing on iOS when launched from the home screen', () => {
        setNavigator({ userAgent: IPHONE_UA, platform: 'iPhone', maxTouchPoints: 5, standalone: true });
        const { container } = renderButton();

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(container).toBeEmptyDOMElement();
    });

    test('hides the button when the app gets installed', () => {
        const { container } = renderButton();
        dispatchInstallPrompt();
        expect(screen.getByRole('button', { name: INSTALL_LABEL })).toBeInTheDocument();

        act(() => {
            window.dispatchEvent(new Event('appinstalled'));
        });

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(container).toBeEmptyDOMElement();
    });
});

describe('InstallAppButton across page navigations', () => {
    // Chrome fires beforeinstallprompt once per document; every page remounts the footer.
    afterEach(() => {
        act(() => {
            window.dispatchEvent(new Event('appinstalled'));
        });
    });

    test('keeps offering install after the footer remounts', () => {
        const first = renderButton();
        dispatchInstallPrompt();
        first.unmount();

        renderButton();

        expect(screen.getByRole('button', { name: INSTALL_LABEL })).toBeInTheDocument();
    });

    test('offers install for a prompt fired before the button mounted', () => {
        dispatchInstallPrompt();

        renderButton();

        expect(screen.getByRole('button', { name: INSTALL_LABEL })).toBeInTheDocument();
    });

    test('does not offer an answered prompt again after a remount', async () => {
        const first = renderButton();
        dispatchInstallPrompt();
        fireEvent.click(screen.getByRole('button', { name: INSTALL_LABEL }));
        await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument());
        first.unmount();

        const { container } = renderButton();

        expect(container).toBeEmptyDOMElement();
    });

    test('forgets the offer once the app is installed, even while no button is mounted', () => {
        const first = renderButton();
        dispatchInstallPrompt();
        first.unmount();
        act(() => {
            window.dispatchEvent(new Event('appinstalled'));
        });

        const { container } = renderButton();

        expect(container).toBeEmptyDOMElement();
    });

    test('a double tap shows the install prompt only once', async () => {
        renderButton();
        const event = dispatchInstallPrompt();
        const button = screen.getByRole('button', { name: INSTALL_LABEL });

        fireEvent.click(button);
        fireEvent.click(button);

        expect(event.prompt).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument());
    });

    test('hides the button when the browser refuses to show the prompt', async () => {
        renderButton();
        const event = dispatchInstallPrompt();
        event.prompt.mockRejectedValue(new Error('NotAllowedError'));

        fireEvent.click(screen.getByRole('button', { name: INSTALL_LABEL }));

        await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument());
    });
});

describe('InstallAppButton outside the regular browser', () => {
    test('shows nothing in an iOS in-app browser, where Add to Home Screen is not offered', () => {
        setNavigator({ userAgent: `${IPHONE_UA} Instagram 300.0.0.0`, platform: 'iPhone', maxTouchPoints: 5 });

        const { container } = renderButton();

        expect(container).toBeEmptyDOMElement();
    });
});

describe('InstallAppButton with a prompt caught before the app loaded', () => {
    // The root layout's inline script stashes an early beforeinstallprompt on window.__installPrompt.
    afterEach(() => {
        delete (window as unknown as Record<string, unknown>).__installPrompt;
    });

    test('offers install for the prompt the inline script stashed', () => {
        const stashed = Object.assign(new Event('beforeinstallprompt'), {
            prompt: jest.fn().mockResolvedValue(undefined),
            userChoice: Promise.resolve({ outcome: 'accepted' }),
        });
        (window as unknown as Record<string, unknown>).__installPrompt = stashed;

        jest.isolateModules(() => {
            // A fresh module registry: the store module loads now, after the stash.
            /* eslint-disable @typescript-eslint/no-require-imports */
            const IsolatedReact = require('react') as typeof React;
            const { IntlProvider: IsolatedIntl } = require('react-intl') as typeof import('react-intl');
            const rtl = require('@testing-library/react/pure') as typeof import('@testing-library/react');
            const Button = require('@components/InstallAppButton').default as React.FC;
            /* eslint-enable @typescript-eslint/no-require-imports */
            rtl.render(
                IsolatedReact.createElement(
                    IsolatedIntl,
                    { locale: 'es', messages: GeneralTranslations.es as Record<string, string>, onError: () => {} },
                    IsolatedReact.createElement(Button),
                ),
            );

            expect(rtl.screen.getByRole('button', { name: INSTALL_LABEL })).toBeInTheDocument();
            rtl.cleanup();
        });
    });
});
