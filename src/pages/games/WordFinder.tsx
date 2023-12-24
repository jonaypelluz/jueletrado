import React from 'react';
import WordFinderUI from '@games/wordFinder/UI';
import useWordFinder from '@games/wordFinder/useWordFinder';
import GamesConfig from 'src/config/GamesConfig';
import MainLayout from 'src/layouts/MainLayout';
import { Game } from 'src/models/types';
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
