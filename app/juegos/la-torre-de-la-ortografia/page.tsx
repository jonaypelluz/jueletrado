'use client';

import React from 'react';
import SpellTowerUI from '@games/spellTower/UI';
import useSpellTower from '@games/spellTower/useSpellTower';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import '@styles/SpellTower.scss';

const SpellTowerPage: React.FC = () => {
    const { locale } = useWordsContext();

    const gameLogic = useSpellTower();
    const gameConfig = createGamesConfig(locale, 'spellTower');

    return (
        <MainLayout>
            {gameConfig && <SpellTowerUI gameConfig={gameConfig} {...gameLogic} />}
        </MainLayout>
    );
};

export default SpellTowerPage;
