'use client';

import React from 'react';
import SpellingBeeUI from '@games/spellingBee/UI';
import useSpellingBee from '@games/spellingBee/useSpellingBee';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import '@styles/SpellingBee.scss';

const SpellingBeePage: React.FC = () => {
    const { locale } = useWordsContext();

    const gameLogic = useSpellingBee();
    const gameConfig = createGamesConfig(locale, 'spellingBee');

    return (
        <MainLayout>
            {gameConfig && <SpellingBeeUI gameConfig={gameConfig} {...gameLogic} />}
        </MainLayout>
    );
};

export default SpellingBeePage;
