import React from 'react';
import DefinitionMasterUI from '@games/definitionMaster/UI';
import useDefinitionMaster from '@games/definitionMaster/useDefinitionMaster';
import { createGamesConfig } from '@hooks/useGamesConfig';
import { useWordsContext } from '@store/WordsContext';
import MainLayout from 'src/layouts/MainLayout';
import './DefinitionMaster.scss';

const DefinitionMaster: React.FC = () => {
    const { locale } = useWordsContext();

    const definitionMasterLogic = useDefinitionMaster();
    const definitionMasterConfig = createGamesConfig(locale, 'definitionMaster');

    return (
        <MainLayout>
            {definitionMasterConfig && (
                <DefinitionMasterUI
                    gameConfig={definitionMasterConfig}
                    {...definitionMasterLogic}
                />
            )}
        </MainLayout>
    );
};

export default DefinitionMaster;
