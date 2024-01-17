import React from 'react';
import WordsRainUI from '@games/wordsRain/UI';
import useWordsRain from '@games/wordsRain/useWordsRain';
import { createGamesConfig } from '@hooks/useGamesConfig';
import { useWordsContext } from '@store/WordsContext';
import MainLayout from 'src/layouts/MainLayout';
import './WordsRain.scss';

const WordsRain: React.FC = () => {
    const { locale } = useWordsContext();

    const wordsRainLogic = useWordsRain();
    const wordsRainConfig = createGamesConfig(locale, 'wordsRain');
    console.log(wordsRainConfig);

    return (
        <MainLayout>
            {wordsRainConfig && <WordsRainUI gameConfig={wordsRainConfig} {...wordsRainLogic} />}
        </MainLayout>
    );
};

export default WordsRain;
