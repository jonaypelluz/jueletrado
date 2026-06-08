'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import IntlProviderClient from '@components/IntlProviderClient';
import { CookieConsentProvider } from '@context/CookieContext';
import { WordsContextProvider } from '@store/WordsContext';

/**
 * Infer the user's locale from the URL on first render so SSR and the first
 * client paint match. Routes that start with /en/ or are exactly /en map to
 * English; everything else defaults to Spanish.
 */
const inferLocaleFromPath = (pathname: string | null): string => {
    if (!pathname) return 'es';
    return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'es';
};

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();
    const initialLocale = inferLocaleFromPath(pathname);

    return (
        <CookieConsentProvider>
            <WordsContextProvider initialLocale={initialLocale}>
                <IntlProviderClient>{children}</IntlProviderClient>
            </WordsContextProvider>
        </CookieConsentProvider>
    );
};

export default Providers;
