import React from 'react';
import { LegalContent } from '@config/translations/Legal';
import { GeneralTranslations } from '@config/translations/General';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';

const Cookies: React.FC = () => {
    const { cookiesTitle } = GeneralTranslations.es;
    const { cookiesContent } = LegalContent.es;

    return (
        <MainLayout>
            <Hero title={cookiesTitle} />
            <div dangerouslySetInnerHTML={{ __html: cookiesContent }} />
        </MainLayout>
    );
};

export default Cookies;
