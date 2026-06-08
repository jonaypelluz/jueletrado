'use client';

import React from 'react';
import CrossWordPuzzleUI from '@games/crossWordPuzzle/UI';
import useCrossWordPuzzle from '@games/crossWordPuzzle/useCrossWordPuzzle';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import '@styles/CrossWordPuzzle.scss';

const CrossWordPuzzlePage: React.FC = () => {
    const { locale } = useWordsContext();

    const gameLogic = useCrossWordPuzzle();
    const gameConfig = createGamesConfig(locale, 'crossWordPuzzle');

    return (
        <MainLayout>
            {gameConfig && <CrossWordPuzzleUI gameConfig={gameConfig} {...gameLogic} />}
        </MainLayout>
    );
};

export default CrossWordPuzzlePage;
