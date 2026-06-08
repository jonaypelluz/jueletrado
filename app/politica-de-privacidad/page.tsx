'use client';

import React from 'react';
import { useIntl } from 'react-intl';
import Hero from '@components/Hero';
import { LegalContent } from '@config/translations/Legal';
import MainLayout from '@layouts/MainLayout';
import { Translation } from '@models/types';
import { useWordsContext } from '@store/WordsContext';

const Privacy: React.FC = () => {
    const intl = useIntl();
    const { locale } = useWordsContext();
    const content: Translation = locale in LegalContent ? LegalContent[locale] : LegalContent['es'];

    return (
        <MainLayout>
            <Hero title={intl.formatMessage({ id: 'privacyTitle' })} />
            <div dangerouslySetInnerHTML={{ __html: content.privacyContent }} />
        </MainLayout>
    );
};

export default Privacy;
