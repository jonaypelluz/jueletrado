import React from 'react';
import GamesConfig from '@config/GamesConfig';
import WordFinderUI from '@games/wordFinder/UI';
import useWordFinder from '@games/wordFinder/useWordFinder';
import { Game } from '@models/types';
import MainLayout from 'src/layouts/MainLayout';
import './WordFinder.scss';

const App: React.FC = () => {
    const worldFinderLogic = useWordFinder();
    const worldFinderConfig = GamesConfig.find((game: Game) => game.id === 'WordFinder');

    return (
        <MainLayout>
            {worldFinderConfig && (
                <WordFinderUI gameConfig={worldFinderConfig} {...worldFinderLogic} />
            )}
        </MainLayout>
    );
};

export default App;
