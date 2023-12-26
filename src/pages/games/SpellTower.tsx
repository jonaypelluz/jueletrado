import React from 'react';
import GamesConfig from '@config/GamesConfig';
import SpellTowerUI from '@games/spellTower/UI';
import useSpellTower from '@games/spellTower/useSpellTower';
import { Game } from '@models/types';
import MainLayout from 'src/layouts/MainLayout';
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
