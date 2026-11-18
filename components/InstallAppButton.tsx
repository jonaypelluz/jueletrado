'use client';

import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
    type InstallPromptEvent,
    getInstallPrompt,
    subscribeInstallPrompt,
    takeInstallPrompt,
} from '@store/InstallPromptStore';

const isStandalone = (): boolean =>
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

// Facebook and Instagram in-app browsers have no Add to Home Screen.
const isIos = (): boolean =>
    !/FBAN|FBAV|Instagram/.test(navigator.userAgent) &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/**
 * "Install the app": shown only when the browser offers install (beforeinstallprompt) or on iOS, where it reveals the
 * Add to Home Screen steps. Renders nothing on the server, on first paint and inside the installed app.
 */
const InstallAppButton: React.FC = () => {
    const intl = useIntl();
    const [active, setActive] = useState(false); // mounted, outside the installed app
    const [ios, setIos] = useState(false);
    const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
    const [prompting, setPrompting] = useState(false);
    const [stepsOpen, setStepsOpen] = useState(false);

    useEffect(() => {
        if (isStandalone()) return;
        setActive(true);
        setIos(isIos());
        setPromptEvent(getInstallPrompt());
        return subscribeInstallPrompt(() => setPromptEvent(getInstallPrompt()));
    }, []);

    const offersPrompt = !!promptEvent || prompting;

    const handleClick = async () => {
        if (!offersPrompt) {
            setStepsOpen((open) => !open);
            return;
        }
        const event = takeInstallPrompt();
        if (!event) return;
        setPrompting(true);
        try {
            await event.prompt();
            await event.userChoice;
        } catch {
            // Dismissed or refused by the browser: the event is spent either way.
        } finally {
            setPrompting(false);
        }
    };

    if (!active || (!offersPrompt && !ios)) return null;

    return (
        <div className="install-app-wrapper">
            <button
                type="button"
                className="btn-primary install-app"
                onClick={handleClick}
                disabled={prompting}
                aria-expanded={offersPrompt ? undefined : stepsOpen}
            >
                {intl.formatMessage({ id: 'installApp' })}
            </button>
            {!offersPrompt && stepsOpen && (
                <p className="install-app-steps">{intl.formatMessage({ id: 'installAppIosSteps' })}</p>
            )}
        </div>
    );
};

export default InstallAppButton;
