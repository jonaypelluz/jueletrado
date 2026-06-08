'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import ReactGA from 'react-ga4';

export const LOCAL_STORAGE_KEY = 'jueletrado-analytics';
const GA_TRACKING_ID = 'G-K3L9E7NYFT';

export const isLocalhost = (): boolean =>
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

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
        // @ts-expect-error - GA disable flag is not typed on window
        window[`ga-disable-${GA_TRACKING_ID}`] = true;
        const cookies = document.cookie.split(';');
        cookies.forEach((cookie) => {
            const cookieName = cookie.split('=')[0].trim();
            if (/_ga|_gid|_gat/.test(cookieName)) {
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${location.hostname}`;
            }
        });
    }
};

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [consent, setConsent] = useState<ConsentStatus>(null);
    const gaInitialized = useRef<boolean>(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored === 'accepted' || stored === 'rejected') {
            setConsent(stored as ConsentStatus);
            if (stored === 'rejected') {
                removeGACookies();
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || consent === null) return;

        if (consent === 'accepted') {
            // @ts-expect-error - GA disable flag is not typed on window
            window[`ga-disable-${GA_TRACKING_ID}`] = false;
            if (!gaInitialized.current && !isLocalhost()) {
                gaInitialized.current = true;
                ReactGA.initialize(GA_TRACKING_ID);
            }
        } else {
            removeGACookies();
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, consent);
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
