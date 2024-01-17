import React from 'react';
import SpellTowerUI from '@games/spellTower/UI';
import useSpellTower from '@games/spellTower/useSpellTower';
import { createGamesConfig } from '@hooks/useGamesConfig';
import { useWordsContext } from '@store/WordsContext';
import MainLayout from 'src/layouts/MainLayout';
import './SpellTower.scss';

const SpellTower: React.FC = () => {
    const { locale } = useWordsContext();

    const spellTowerLogic = useSpellTower();
    const spellTowerConfig = createGamesConfig(locale, 'spellTower');

    return (
        <MainLayout>
            {spellTowerConfig && (
                <SpellTowerUI gameConfig={spellTowerConfig} {...spellTowerLogic} />
            )}
        </MainLayout>
    );
};

export default SpellTower;
