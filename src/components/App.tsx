import React, { useEffect } from 'react';
import ReactGA from 'react-ga4';
import { IntlProvider } from 'react-intl';
import { GeneralTranslations } from '@config/translations/General';
import { Translation } from '@models/types';
import { useWordsContext } from '@store/WordsContext';
import Routes from 'src/components/Routes';

const App: React.FC = () => {
    ReactGA.initialize('G-K3L9E7NYFT');

    const { locale, setLocale } = useWordsContext();
    const messages: Translation =
        locale in GeneralTranslations ? GeneralTranslations[locale] : GeneralTranslations['es'];

    useEffect(() => {
        const setLocaleFromUrl = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#/en/') && locale !== 'en') {
                setLocale('en');
            }
            const pathname = window.location.pathname;
            if (pathname !== '/') {
                window.location.pathname = '/';
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
