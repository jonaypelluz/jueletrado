import React from 'react';
import GamesConfig from '@config/GamesConfig';
import WordFinderUI from '@games/wordFinder/UI';
import useWordFinder from '@games/wordFinder/useWordFinder';
import { CardInfo } from '@models/types';
import MainLayout from 'src/layouts/MainLayout';
import './WordFinder.scss';

const App: React.FC = () => {
    const worldFinderLogic = useWordFinder();
    const worldFinderConfig = GamesConfig.find((game: CardInfo) => game.id === 'WordFinder');

    return (
        <MainLayout>
            {worldFinderConfig && (
                <WordFinderUI gameConfig={worldFinderConfig} {...worldFinderLogic} />
            )}
        </MainLayout>
    );
};

export default App;
