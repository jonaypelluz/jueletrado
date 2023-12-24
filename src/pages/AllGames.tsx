import React from 'react';
import Games from 'src/components/Games';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';

const App: React.FC = () => {
    return (
        <MainLayout>
            <Hero title="Todos los juegos" />
            <Games />
        </MainLayout>
    );
};

export default App;
