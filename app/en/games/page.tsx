import React from 'react';
import { GeneralTranslations } from '@config/translations/General';
import Games from '@components/Games';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';

const EnAllGamesPage: React.FC = () => {
    const { gamesAllGames } = GeneralTranslations.en;

    return (
        <MainLayout>
            <Hero title={gamesAllGames} />
            <Games />
        </MainLayout>
    );
};

export default EnAllGamesPage;
