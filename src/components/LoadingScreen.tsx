import React from 'react';
import { Spin, Layout } from 'antd';
import { useWordsContext } from 'src/store/WordsContext';

const { Content } = Layout;

const LoadingScreen: React.FC = () => {
    const { loadingProgress, error } = useWordsContext();

    return (
        <Content
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
        </Content>
    );
};

export default LoadingScreen;
