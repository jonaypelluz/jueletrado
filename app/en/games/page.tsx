'use client';

import React from 'react';
import { useIntl } from 'react-intl';
import Games from '@components/Games';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';

const EnAllGamesPage: React.FC = () => {
    const intl = useIntl();

    return (
        <MainLayout>
            <Hero title={intl.formatMessage({ id: 'gamesAllGames' })} />
            <Games />
        </MainLayout>
    );
};

export default EnAllGamesPage;
