'use client';

import React from 'react';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';
import { LoadingMessages } from '@config/translations/General';
import Logger from '@services/Logger';
import { deleteWordsDB } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import LoadingSpinner from '@components/LoadingSpinner';
import '@styles/LoadingScreen.scss';

type LoadingScreenProps = {
    rotateMessages?: boolean;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ rotateMessages = false }) => {
    const { locale, loadingProgress, error, setLoading, setError } = useWordsContext();
    const messages = LoadingMessages[locale] ?? LoadingMessages['es'];

    const getRandomErrorMessage = () => {
        const list = LoadingMessages[locale] ?? LoadingMessages['es'];
        return list[Math.floor(Math.random() * list.length)];
    };

    const handleDeleteDatabaseClick = async () => {
        setLoading(true);
        await deleteWordsDB(setError);
        setLoading(false);
    };

    if (error) {
        Logger.error(error.message);
    }

    return (
        <div className="loading-screen">
            {error ? (
                <>
                    <p>{getRandomErrorMessage()}</p>
                    <Link href="/" className="loading-home-link">
                        <FormattedMessage id="errorMessageTitle" />
                    </Link>
                    <p className="loading-error-description">
                        <FormattedMessage id="errorMessageDescription" />
                    </p>
                    <span className="loading-delete-action" onClick={handleDeleteDatabaseClick}>
                        <FormattedMessage id="errorMessageAction" />
                    </span>
                </>
            ) : (
                <LoadingSpinner
                    rotateMessages={rotateMessages}
                    loadingProgress={loadingProgress}
                    messages={messages}
                />
            )}
        </div>
    );
};

export default LoadingScreen;
