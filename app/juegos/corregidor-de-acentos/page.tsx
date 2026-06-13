'use client';

import React from 'react';
import AccentFixerUI from '@games/accentFixer/UI';
import useAccentFixer from '@games/accentFixer/useAccentFixer';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import '@styles/AccentFixer.scss';

const AccentFixerPage: React.FC = () => {
    const { locale } = useWordsContext();

    const gameLogic = useAccentFixer();
    const gameConfig = createGamesConfig(locale, 'accentFixer');

    return (
        <MainLayout>
            {gameConfig && <AccentFixerUI gameConfig={gameConfig} {...gameLogic} />}
        </MainLayout>
    );
};

export default AccentFixerPage;
