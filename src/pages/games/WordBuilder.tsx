import React from 'react';
import WordBuilderUI from '@games/wordBuilder/UI';
import useWordBuilder from '@games/wordBuilder/useWordBuilder';
import GamesConfig from 'src/config/GamesConfig';
import MainLayout from 'src/layouts/MainLayout';
import { Game } from 'src/models/types';
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
