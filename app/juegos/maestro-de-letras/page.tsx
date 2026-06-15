'use client';

import React from 'react';
import LetterMatcherUI from '@games/letterMatcher/UI';
import useLetterMatcher from '@games/letterMatcher/useLetterMatcher';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import '@styles/LetterMatcher.scss';

const LetterMatcherPage: React.FC = () => {
    const { locale } = useWordsContext();

    const gameLogic = useLetterMatcher();
    const gameConfig = createGamesConfig(locale, 'letterMatcher');

    return (
        <MainLayout>
            {gameConfig && <LetterMatcherUI gameConfig={gameConfig} {...gameLogic} />}
        </MainLayout>
    );
};

export default LetterMatcherPage;
