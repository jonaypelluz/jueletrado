import React from 'react';
import { GeneralTranslations } from '@config/translations/General';
import Content from '@components/Content';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';
import '@styles/SpellingRules.scss';

const SpellingRules: React.FC = () => {
    const { headerRules, headerRulesDescription } = GeneralTranslations.es;

    return (
        <MainLayout>
            <Hero title={headerRules} subtitle={headerRulesDescription} />
            <Content />
        </MainLayout>
    );
};

export default SpellingRules;
