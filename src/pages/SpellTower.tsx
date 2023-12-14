import React from 'react';
import './tower.scss';
import SpellTowerUI from '@games/spellTower/UI';
import useSpellTower from '@games/spellTower/useSpellTower';

const SpellTower: React.FC = () => {
    const spellTowerLogic = useSpellTower();

    return <SpellTowerUI {...spellTowerLogic} />;
};

export default SpellTower;
