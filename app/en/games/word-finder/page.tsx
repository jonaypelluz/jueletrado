'use client';

import React from 'react';
import WordFinderUI from '@games/wordFinder/UI';
import useWordFinder from '@games/wordFinder/useWordFinder';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import '@styles/WordFinder.scss';

const WordFinderPage: React.FC = () => {
    const { locale } = useWordsContext();

    const gameLogic = useWordFinder();
    const gameConfig = createGamesConfig(locale, 'wordFinder');

    return (
        <MainLayout>
            {gameConfig && <WordFinderUI gameConfig={gameConfig} {...gameLogic} />}
        </MainLayout>
    );
};

export default WordFinderPage;
