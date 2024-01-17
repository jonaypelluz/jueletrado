import React from 'react';
import WordFinderUI from '@games/wordFinder/UI';
import useWordFinder from '@games/wordFinder/useWordFinder';
import { createGamesConfig } from '@hooks/useGamesConfig';
import { useWordsContext } from '@store/WordsContext';
import MainLayout from 'src/layouts/MainLayout';
import './WordFinder.scss';

const WorldFinder: React.FC = () => {
    const { locale } = useWordsContext();

    const worldFinderLogic = useWordFinder();
    const worldFinderConfig = createGamesConfig(locale, 'wordFinder');

    return (
        <MainLayout>
            {worldFinderConfig && (
                <WordFinderUI gameConfig={worldFinderConfig} {...worldFinderLogic} />
            )}
        </MainLayout>
    );
};

export default WorldFinder;
