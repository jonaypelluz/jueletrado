'use client';

import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { LoadingMessages } from '@config/translations/General';
import { useWordsContext } from '@store/WordsContext';
import '@styles/LoadingBanner.scss';

const LoadingBanner: React.FC = () => {
    const { generalLoading, isLoading, loadingProgress, locale, dbBlocked } = useWordsContext();
    const messages = LoadingMessages[locale] ?? LoadingMessages['es'];
    const [messageIndex, setMessageIndex] = useState(0);

    const visible = generalLoading || isLoading;

    useEffect(() => {
        if (!visible) return;

        const interval = setInterval(() => {
            setMessageIndex((index) => (index + 1) % messages.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [visible, messages.length]);

    // Another tab on an older version holds the word database back: say what to do, even with no load running.
    if (dbBlocked) {
        return (
            <div className="loading-banner" role="alert">
                <p className="loading-banner-message">
                    <FormattedMessage id="dbUpgradeBlocked" />
                </p>
            </div>
        );
    }

    if (!visible) return null;

    const showProgress = loadingProgress > 0 && loadingProgress < 100;

    return (
        <div className="loading-banner" role="status">
            <span className="loading-banner-spinner" aria-hidden="true" />
            <p className="loading-banner-message">{messages[messageIndex]}</p>
            {showProgress && (
                <span className="loading-banner-progress">{loadingProgress.toFixed(0)}%</span>
            )}
        </div>
    );
};

export default LoadingBanner;
