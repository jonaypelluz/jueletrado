'use client';

import React from 'react';
import WordsRainUI from '@games/wordsRain/UI';
import useWordsRain from '@games/wordsRain/useWordsRain';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import './WordsRain.scss';

const WordsRainPage: React.FC = () => {
    const { locale } = useWordsContext();

    const gameLogic = useWordsRain();
    const gameConfig = createGamesConfig(locale, 'wordsRain');

    return (
        <MainLayout>
            {gameConfig && <WordsRainUI gameConfig={gameConfig} {...gameLogic} />}
        </MainLayout>
    );
};

export default WordsRainPage;
