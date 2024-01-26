import React from 'react';
import { Button } from 'antd';
import { FormattedMessage } from 'react-intl';
import { LoadingMessages } from '@config/translations/General';
import Logger from '@services/Logger';
import { deleteWordsDB } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import LoadingSpinner from 'src/components/LoadingSpinner';

type LoadingScreenProps = {
    rotateMessages?: boolean;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ rotateMessages = false }) => {
    const { locale, loadingProgress, error, setLoading, setError } = useWordsContext();
    const messages = LoadingMessages[locale];

    const getRandomErrorMessage = () => {
        return LoadingMessages[locale][Math.floor(Math.random() * LoadingMessages[locale].length)];
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
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                padding: '0 12px',
            }}
        >
            {error ? (
                <>
                    <p style={{ textAlign: 'center', margin: '0 auto' }}>
                        {getRandomErrorMessage()}
                    </p>
                    <Button
                        type="link"
                        href="/"
                        style={{ marginTop: '20px', border: '1px solid #000' }}
                    >
                        <FormattedMessage id="errorMessageTitle" />
                    </Button>
                    <p style={{ textAlign: 'center', margin: '20px auto 0' }}>
                        <FormattedMessage id="errorMessageDescription" />
                    </p>
                    <span
                        style={{ marginTop: '20px', cursor: 'pointer', fontSize: '12px' }}
                        onClick={handleDeleteDatabaseClick}
                    >
                        <FormattedMessage id="errorMessageAction" />
                    </span>
                </>
            ) : (
                <LoadingSpinner rotateMessages={rotateMessages} loadingProgress={loadingProgress} messages={messages} />
            )}
        </div>
    );
};

export default LoadingScreen;
