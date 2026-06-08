import React from 'react';
import { LegalContent } from '@config/translations/Legal';
import { GeneralTranslations } from '@config/translations/General';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';

const EnPrivacyPage: React.FC = () => {
    const { privacyTitle } = GeneralTranslations.en;
    const { privacyContent } = LegalContent.en;

    return (
        <MainLayout>
            <Hero title={privacyTitle} />
            <div dangerouslySetInnerHTML={{ __html: privacyContent }} />
        </MainLayout>
    );
};

export default EnPrivacyPage;
