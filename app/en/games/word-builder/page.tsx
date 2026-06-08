'use client';

import React from 'react';
import WordBuilderUI from '@games/wordBuilder/UI';
import useWordBuilder from '@games/wordBuilder/useWordBuilder';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import '@styles/WordBuilder.scss';

const WordBuilderPage: React.FC = () => {
    const { locale } = useWordsContext();

    const gameLogic = useWordBuilder();
    const gameConfig = createGamesConfig(locale, 'wordBuilder');

    return (
        <MainLayout>
            {gameConfig && <WordBuilderUI gameConfig={gameConfig} {...gameLogic} />}
        </MainLayout>
    );
};

export default WordBuilderPage;
