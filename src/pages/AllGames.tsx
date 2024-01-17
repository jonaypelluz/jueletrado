import React from 'react';
import { useIntl } from 'react-intl';
import Games from 'src/components/Games';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';

const App: React.FC = () => {
    const intl = useIntl();

    return (
        <MainLayout>
            <Hero title={intl.formatMessage({ id: 'gamesAllGames' })} />
            <Games />
        </MainLayout>
    );
};

export default App;
