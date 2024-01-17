import React from 'react';
import { useIntl } from 'react-intl';
import Content from 'src/components/Content';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';
import './SpellingRules.scss';

const SpellingRules: React.FC = () => {
    const intl = useIntl();

    return (
        <MainLayout>
            <Hero
                title={intl.formatMessage({ id: 'headerRules' })}
                subtitle={intl.formatMessage({ id: 'headerRulesDescription' })}
            />
            <Content />
        </MainLayout>
    );
};

export default SpellingRules;
