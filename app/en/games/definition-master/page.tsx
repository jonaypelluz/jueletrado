'use client';

import React from 'react';
import DefinitionMasterUI from '@games/definitionMaster/UI';
import useDefinitionMaster from '@games/definitionMaster/useDefinitionMaster';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import './DefinitionMaster.scss';

const DefinitionMasterPage: React.FC = () => {
    const { locale } = useWordsContext();

    const gameLogic = useDefinitionMaster();
    const gameConfig = createGamesConfig(locale, 'definitionMaster');

    return (
        <MainLayout>
            {gameConfig && <DefinitionMasterUI gameConfig={gameConfig} {...gameLogic} />}
        </MainLayout>
    );
};

export default DefinitionMasterPage;
