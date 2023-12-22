import React from 'react';
import WordBuilderUI from '@games/wordBuilder/UI';
import useWordBuilder from '@games/wordBuilder/useWordBuilder';
import MainLayout from 'src/layouts/MainLayout';
import './WordBuilder.scss';

const WordBuilder: React.FC = () => {
    const worldBuilderLogic = useWordBuilder();

    return (
        <MainLayout>
            <WordBuilderUI {...worldBuilderLogic} />
        </MainLayout>
    );
};

export default WordBuilder;
