'use client';

import React from 'react';
import WordChainUI from '@games/wordChain/UI';
import useWordChain from '@games/wordChain/useWordChain';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import '@styles/WordChain.scss';

const WordChainPage: React.FC = () => {
    const { locale } = useWordsContext();

    const gameLogic = useWordChain();
    const gameConfig = createGamesConfig(locale, 'wordChain');

    return (
        <MainLayout>
            {gameConfig && <WordChainUI gameConfig={gameConfig} {...gameLogic} />}
        </MainLayout>
    );
};

export default WordChainPage;
