import React from 'react';
import MainLayout from 'src/layouts/MainLayout';
import useCrossWordPuzzle from '@games/crossWordPuzzle/useCrossWordPuzzle';
import { useWordsContext } from '@store/WordsContext';
import { createGamesConfig } from '@hooks/useGamesConfig';
import CrossWordPuzzleUI from '@games/crossWordPuzzle/UI';
import './CrossWordPuzzle.scss';

const CrossWordPuzzle: React.FC = () => {
    const { locale } = useWordsContext();

    const crossWordPuzzleLogic = useCrossWordPuzzle();
    const crossWordPuzzleConfig = createGamesConfig(locale, 'crossWordPuzzle');

    return (
        <MainLayout>
            {crossWordPuzzleConfig && (
                <CrossWordPuzzleUI
                    gameConfig={crossWordPuzzleConfig}
                    {...crossWordPuzzleLogic}                />
            )}
        </MainLayout>
    );
};

export default CrossWordPuzzle;
