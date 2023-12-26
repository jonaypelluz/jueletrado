import React from 'react';
import GamesConfig from '@config/GamesConfig';
import WordBuilderUI from '@games/wordBuilder/UI';
import useWordBuilder from '@games/wordBuilder/useWordBuilder';
import { Game } from '@models/types';
import MainLayout from 'src/layouts/MainLayout';
import './WordBuilder.scss';

const WordBuilder: React.FC = () => {
    const worldBuilderLogic = useWordBuilder();
    const worldBuilderConfig = GamesConfig.find((game: Game) => game.id === 'WordBuilder');

    return (
        <MainLayout>
            {worldBuilderConfig && (
                <WordBuilderUI gameConfig={worldBuilderConfig} {...worldBuilderLogic} />
            )}
        </MainLayout>
    );
};

export default WordBuilder;
