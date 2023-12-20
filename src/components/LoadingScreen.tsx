import React from 'react';
import LoadingSpinner from 'src/components/LoadingSpinner';
import { useWordsContext } from 'src/store/WordsContext';

interface LoadingScreenProps {
    rotateMessages?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ rotateMessages = false }) => {
    const { loadingProgress, error } = useWordsContext();

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
            }}
        >
            {error ? (
                <p>Error loading words: {error.message}</p>
            ) : (
                <LoadingSpinner rotateMessages={rotateMessages} loadingProgress={loadingProgress} />
            )}
        </div>
    );
};

export default LoadingScreen;
