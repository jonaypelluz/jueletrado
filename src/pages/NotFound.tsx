import React from 'react';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';

const NotFound: React.FC = () => {
    return (
        <MainLayout>
            <Hero title="¡Ops!" subtitle="Lo sentimos, ¡no encontramos las palabras que buscas!" />
        </MainLayout>
    );
};

export default NotFound;
