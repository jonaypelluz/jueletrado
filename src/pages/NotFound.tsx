import React from 'react';
import MainLayout from 'src/layouts/MainLayout';
import Hero from 'src/components/Hero';

const NotFound: React.FC = () => {
    return (
        <MainLayout>
            <Hero title="¡Ops!" subtitle="Lo sentimos, ¡no encontramos la página!" />
        </MainLayout>
    );
};

export default NotFound;
