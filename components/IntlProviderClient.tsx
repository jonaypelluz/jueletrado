'use client';

import React, { useEffect } from 'react';
import { IntlProvider, useIntl } from 'react-intl';
import { GeneralTranslations } from '@config/translations/General';
import { Translation } from '@models/types';
import { useWordsContext } from '@store/WordsContext';

const DocumentHeadSync: React.FC = () => {
    const intl = useIntl();
    const { locale } = useWordsContext();

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.lang = locale;
        document.title = intl.formatMessage({ id: 'mainTitle' });

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute(
                'content',
                intl.formatMessage({ id: 'mainDescription' }),
            );
        }
    }, [locale, intl]);

    return null;
};

const IntlProviderClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { locale } = useWordsContext();
    const messages: Translation =
        locale in GeneralTranslations ? GeneralTranslations[locale] : GeneralTranslations['es'];

    return (
        <IntlProvider locale={locale} messages={messages} defaultLocale="es">
            <DocumentHeadSync />
            {children}
        </IntlProvider>
    );
};

export default IntlProviderClient;
