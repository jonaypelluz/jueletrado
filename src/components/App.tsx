import React, { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import GeneralTranslations from '@config/translations/General';
import { Translation } from '@models/types';
import { useWordsContext } from '@store/WordsContext';
import Routes from 'src/components/Routes';

const App: React.FC = () => {
    const { locale, setLocale } = useWordsContext();
    const messages: Translation =
        locale in GeneralTranslations ? GeneralTranslations[locale] : GeneralTranslations['es'];

    useEffect(() => {
        const setLocaleFromUrl = () => {
            const path = window.location.pathname;
            if (path.startsWith('/en/') && locale !== 'en') {
                setLocale('en');
            }
        };

        setLocaleFromUrl();
    }, []);

    return (
        <IntlProvider locale={locale} messages={messages}>
            <Routes />
        </IntlProvider>
    );
};

export default App;
