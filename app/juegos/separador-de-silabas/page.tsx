'use client';

import React from 'react';
import SyllableSplitterUI from '@games/syllableSplitter/UI';
import useSyllableSplitter from '@games/syllableSplitter/useSyllableSplitter';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import '@styles/SyllableSplitter.scss';

const SyllableSplitterPage: React.FC = () => {
    const { locale } = useWordsContext();

    const gameLogic = useSyllableSplitter();
    const gameConfig = createGamesConfig(locale, 'syllableSplitter');

    return (
        <MainLayout>
            {gameConfig && <SyllableSplitterUI gameConfig={gameConfig} {...gameLogic} />}
        </MainLayout>
    );
};

export default SyllableSplitterPage;
