import React from 'react';
import GamesConfig from '@config/GamesConfig';
import DefinitionMasterUI from '@games/definitionMaster/UI';
import useDefinitionMaster from '@games/definitionMaster/useDefinitionMaster';
import { CardInfo } from '@models/types';
import MainLayout from 'src/layouts/MainLayout';
import './DefinitionMaster.scss';

const DefinitionMaster: React.FC = () => {
    const definitionMasterLogic = useDefinitionMaster();
    const definitionMasterConfig = GamesConfig.find(
        (game: CardInfo) => game.id === 'DefinitionMaster',
    );

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
