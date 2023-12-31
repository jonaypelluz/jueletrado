import React from 'react';
import GamesConfig from '@config/GamesConfig';
import WordsRainUI from '@games/wordsRain/UI';
import useWordsRain from '@games/wordsRain/useWordsRain';
import { CardInfo } from '@models/types';
import MainLayout from 'src/layouts/MainLayout';
import './WordsRain.scss';

const WordsRain: React.FC = () => {
    const wordsRainLogic = useWordsRain();
    const wordsRainConfig = GamesConfig.find((game: CardInfo) => game.id === 'WordsRain');

    return (
        <MainLayout>
            {wordsRainConfig && <WordsRainUI gameConfig={wordsRainConfig} {...wordsRainLogic} />}
        </MainLayout>
    );
};

export default WordsRain;
