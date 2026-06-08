'use client';

import React from 'react';
import { useIntl } from 'react-intl';
import Content from '@components/Content';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';
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
