import React from 'react';
import WordsRainUI from '@games/wordsRain/UI';
import useWordsRain from '@games/wordsRain/useWordsRain';
import GamesConfig from 'src/config/GamesConfig';
import MainLayout from 'src/layouts/MainLayout';
import { Game } from 'src/models/types';
import './WordsRain.scss';

const WordsRain: React.FC = () => {
    const wordsRainLogic = useWordsRain();
    const wordsRainConfig = GamesConfig.find((game: Game) => game.id === 'WordsRain');

    return (
        <MainLayout>
            {wordsRainConfig && <WordsRainUI gameConfig={wordsRainConfig} {...wordsRainLogic} />}
        </MainLayout>
    );
};

export default WordsRain;
