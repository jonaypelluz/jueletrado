import React from 'react';
import { useIntl } from 'react-intl';
import { LegalContent } from '@config/translations/Legal';
import { Translation } from '@models/types';
import { useWordsContext } from '@store/WordsContext';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';

const Privacy: React.FC = () => {
    const intl = useIntl();
    const { locale } = useWordsContext();
    const content: Translation = locale in LegalContent ? LegalContent[locale] : LegalContent['es'];

    return (
        <MainLayout>
            <Hero title={intl.formatMessage({ id: 'privacyTitle' })} />
            <div dangerouslySetInnerHTML={{ __html: content.privacyContent }}></div>
        </MainLayout>
    );
};

export default Privacy;
