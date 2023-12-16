import React from 'react';
import SpellTowerUI from '@games/spellTower/UI';
import useSpellTower from '@games/spellTower/useSpellTower';
import MainLayout from 'src/layouts/MainLayout';
import './SpellTower.scss';

const SpellTower: React.FC = () => {
    const spellTowerLogic = useSpellTower();

    return (
        <MainLayout>
            <SpellTowerUI {...spellTowerLogic} />
        </MainLayout>
    );
};

export default SpellTower;
