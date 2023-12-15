import React from 'react';
import SpellTowerUI from '@games/spellTower/UI';
import useSpellTower from '@games/spellTower/useSpellTower';
import './tower.scss';

const SpellTower: React.FC = () => {
    const spellTowerLogic = useSpellTower();

    return <SpellTowerUI {...spellTowerLogic} />;
};

export default SpellTower;
