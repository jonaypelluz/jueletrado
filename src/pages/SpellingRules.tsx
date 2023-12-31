import React from 'react';
import Content from 'src/components/Content';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';
import './SpellingRules.scss';

const SpellingRules: React.FC = () => {
    return (
        <MainLayout>
            <Hero
                title="Normas de ortografía"
                subtitle="Reglas esenciales para escribir correctamente, incluyendo puntuación, gramática y uso de palabras."
            />
            <Content />
        </MainLayout>
    );
};

export default SpellingRules;
