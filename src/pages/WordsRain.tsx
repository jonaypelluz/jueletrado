import React from 'react';
import WordsRainUI from '@games/wordsRain/UI';
import useWordsRain from '@games/wordsRain/useWordsRain';
import MainLayout from 'src/layouts/MainLayout';
import './WordsRain.scss';

const WordsRain: React.FC = () => {
    const wordsRainLogic = useWordsRain();

    return (
        <MainLayout>
            <WordsRainUI {...wordsRainLogic} />
        </MainLayout>
    );
};

export default WordsRain;
