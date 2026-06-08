import React from 'react';
import { LegalContent } from '@config/translations/Legal';
import { GeneralTranslations } from '@config/translations/General';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';

const Privacy: React.FC = () => {
    const { privacyTitle } = GeneralTranslations.es;
    const { privacyContent } = LegalContent.es;

    return (
        <MainLayout>
            <Hero title={privacyTitle} />
            <div dangerouslySetInnerHTML={{ __html: privacyContent }} />
        </MainLayout>
    );
};

export default Privacy;
