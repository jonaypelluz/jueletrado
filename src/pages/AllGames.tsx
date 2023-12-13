import React from 'react';
import Games from 'src/components/Games';
import MainLayout from 'src/layouts/MainLayout';
import Hero from 'src/components/Hero';

const App: React.FC = () => {
    return (
        <MainLayout>
            <Hero title="Todos los juegos" />
            <Games />
        </MainLayout>
    );
};

export default App;
