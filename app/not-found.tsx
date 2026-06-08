'use client';

import React from 'react';
import { useIntl } from 'react-intl';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';

const NotFound: React.FC = () => {
    const intl = useIntl();

    return (
        <MainLayout>
            <Hero
                title={intl.formatMessage({ id: 'errorTitle' })}
                subtitle={intl.formatMessage({ id: 'errorDescription' })}
            />
        </MainLayout>
    );
};

export default NotFound;
