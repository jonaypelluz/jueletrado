import React from 'react';
import CrossWordPuzzleUI from '@games/crossWordPuzzle/UI';
import useCrossWordPuzzle from '@games/crossWordPuzzle/useCrossWordPuzzle';
import { createGamesConfig } from '@hooks/useGamesConfig';
import { useWordsContext } from '@store/WordsContext';
import MainLayout from 'src/layouts/MainLayout';
import './CrossWordPuzzle.scss';

const CrossWordPuzzle: React.FC = () => {
    const { locale } = useWordsContext();

    const crossWordPuzzleLogic = useCrossWordPuzzle();
    const crossWordPuzzleConfig = createGamesConfig(locale, 'crossWordPuzzle');

    return (
        <MainLayout>
            {crossWordPuzzleConfig && (
                <CrossWordPuzzleUI gameConfig={crossWordPuzzleConfig} {...crossWordPuzzleLogic} />
            )}
        </MainLayout>
    );
};

export default CrossWordPuzzle;
