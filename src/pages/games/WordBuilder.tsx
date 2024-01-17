import React from 'react';
import WordBuilderUI from '@games/wordBuilder/UI';
import useWordBuilder from '@games/wordBuilder/useWordBuilder';
import { createGamesConfig } from '@hooks/useGamesConfig';
import { useWordsContext } from '@store/WordsContext';
import MainLayout from 'src/layouts/MainLayout';
import './WordBuilder.scss';

const WordBuilder: React.FC = () => {
    const { locale } = useWordsContext();

    const worldBuilderLogic = useWordBuilder();
    const worldBuilderConfig = createGamesConfig(locale, 'wordBuilder');

    return (
        <MainLayout>
            {worldBuilderConfig && (
                <WordBuilderUI gameConfig={worldBuilderConfig} {...worldBuilderLogic} />
            )}
        </MainLayout>
    );
};

export default WordBuilder;
