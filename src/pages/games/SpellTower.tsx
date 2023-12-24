import React from 'react';
import SpellTowerUI from '@games/spellTower/UI';
import useSpellTower from '@games/spellTower/useSpellTower';
import GamesConfig from 'src/config/GamesConfig';
import MainLayout from 'src/layouts/MainLayout';
import { Game } from 'src/models/types';
import './SpellTower.scss';

const SpellTower: React.FC = () => {
    const spellTowerLogic = useSpellTower();
    const spellTowerConfig = GamesConfig.find((game: Game) => game.id === 'SpellTower');

    return (
        <MainLayout>
            {spellTowerConfig && (
                <SpellTowerUI gameConfig={spellTowerConfig} {...spellTowerLogic} />
            )}
        </MainLayout>
    );
};

export default SpellTower;
