import React from 'react';
import { Spin } from 'antd';
import { useWordsContext } from 'src/store/WordsContext';

const LoadingScreen: React.FC = () => {
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
                <>
                    <p>Cargando palabras... {loadingProgress.toFixed(0)}%</p>
                    <Spin size="large" />
                </>
            )}
        </div>
    );
};

export default LoadingScreen;
