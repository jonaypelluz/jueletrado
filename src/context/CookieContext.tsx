import React, { createContext, useContext, useEffect, useState } from 'react';

export const LOCAL_STORAGE_KEY = 'jueletrado-analytics';

export type ConsentStatus = 'accepted' | 'rejected' | null;

const CookieConsentContext = createContext<
    | {
          consent: ConsentStatus;
          setConsent: (status: ConsentStatus) => void;
      }
    | undefined
>(undefined);

const removeGACookies = (): void => {
    if (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        typeof location !== 'undefined'
    ) {
        // @ts-expect-error - window['ga-disable-G-K3L9E7NYFT'] is not defined
        window['ga-disable-G-K3L9E7NYFT'] = true;
        const cookies = document.cookie.split(';');
        cookies.forEach((cookie) => {
            const cookieName = cookie.split('=')[0].trim();
            if (/_ga|_gid|_gat/.test(cookieName)) {
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${location.hostname}`;
            }
        });
    }
};

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [consent, setConsent] = useState<ConsentStatus>(null);

    useEffect(() => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored === 'accepted' || stored === 'rejected') {
            setConsent(stored as ConsentStatus);
            if (stored === 'rejected') {
                removeGACookies();
            }
        }
    }, []);

    useEffect(() => {
        if (consent === 'accepted') {
            // @ts-expect-error - window['ga-disable-G-K3L9E7NYFT'] is not defined
            window['ga-disable-G-K3L9E7NYFT'] = false;
            void import('react-ga4').then((GA) => {
                GA.default.initialize('G-K3L9E7NYFT');
            });
        } else {
            removeGACookies();
        }
        if (consent !== null) {
            localStorage.setItem(LOCAL_STORAGE_KEY, consent);
        }
    }, [consent]);

    return (
        <CookieConsentContext.Provider value={{ consent, setConsent }}>
            {children}
        </CookieConsentContext.Provider>
    );
};

export const useCookieConsent = (): {
    consent: ConsentStatus;
    setConsent: (status: ConsentStatus) => void;
} => {
    const context = useContext(CookieConsentContext);
    if (context === undefined) {
        throw new Error('useCookieConsent must be used within a CookieConsentProvider');
    }
    return context;
};
