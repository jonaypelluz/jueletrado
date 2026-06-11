'use client';

import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { ContentRoutes } from '@config/translations/Content';
import { GamesRoutes } from '@config/translations/Games';
import StorageService from '@store/StorageService';

interface WordsContextValue {
    /** True until the initial page data (level + word groups) is ready. Gates level switching. */
    generalLoading: boolean;
    setGeneralLoading: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    loadingProgress: number;
    setLoadingProgress: React.Dispatch<React.SetStateAction<number>>;
    error: Error | null;
    setError: React.Dispatch<React.SetStateAction<Error | null>>;
    wordOfTheDay: string | null;
    setWordOfTheDay: React.Dispatch<React.SetStateAction<string | null>>;
    gameLevel: string | null;
    setGameLevel: React.Dispatch<React.SetStateAction<string | null>>;
    locale: string;
    setLocale: (newLocale: string) => void;
    currentRoutes: { [key: string]: string };
    /** True once the context has read from localStorage in the browser. */
    hydrated: boolean;
}

const DEFAULT_LOCALE = 'es';

const WordsContext = createContext<WordsContextValue | undefined>(undefined);

interface WordsContextProviderProps {
    children: ReactNode;
    /** Locale inferred from the URL by the layout (e.g. "es" or "en"). */
    initialLocale?: string;
}

export const WordsContextProvider: React.FC<WordsContextProviderProps> = ({
    children,
    initialLocale = DEFAULT_LOCALE,
}) => {
    // All state starts with deterministic SSR-safe defaults so the server
    // and the first client render match. We hydrate from localStorage in
    // a single effect after mount.
    // Starts false so the banner/spinner are hidden on the very first paint
    // (and in the statically exported HTML); actual loads flip isLoading on.
    const [generalLoading, setGeneralLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);
    const [wordOfTheDay, setWordOfTheDay] = useState<string | null>(null);
    const [gameLevel, setGameLevel] = useState<string | null>(null);
    const [locale, setLocaleState] = useState<string>(initialLocale);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const storedDayWord = StorageService.getItem<string>(StorageService.SELECTED_DAY_WORD);
        const storedLevel = StorageService.getItem<string>(StorageService.SELECTED_LEVEL);
        const storedLocale = StorageService.getItem<string>(StorageService.LOCALE);

        if (storedDayWord) setWordOfTheDay(storedDayWord);
        if (storedLevel) setGameLevel(storedLevel);
        // Prefer the URL-derived locale; only fall back to storage if URL
        // didn't provide one (initialLocale stays default).
        if (initialLocale === DEFAULT_LOCALE && storedLocale && storedLocale !== DEFAULT_LOCALE) {
            setLocaleState(storedLocale);
        }
        setHydrated(true);
        // Pages without HomeContent (e.g. game pages) never run the initial
        // word-group check, so the general flag must clear here; on the home
        // page HomeContent immediately re-takes over via isLoading if a
        // reload is needed.
        setGeneralLoading(false);
    }, [initialLocale]);

    const setLocale = (newLocale: string) => {
        if (newLocale !== locale) {
            // clearStorage wipes everything including LEVELS_POPULATED — correct,
            // because the new locale has different IndexedDB stores that need population.
            StorageService.clearStorage();
            StorageService.setItem(StorageService.LOCALE, newLocale);
            setLocaleState(newLocale);
        }
    };

    const currentRoutes = { ...ContentRoutes[locale], ...GamesRoutes[locale] };

    const value: WordsContextValue = {
        generalLoading,
        setGeneralLoading,
        isLoading,
        setLoading: setIsLoading,
        loadingProgress,
        setLoadingProgress,
        error,
        setError,
        wordOfTheDay,
        setWordOfTheDay,
        gameLevel,
        setGameLevel,
        locale,
        setLocale,
        currentRoutes,
        hydrated,
    };

    return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>;
};

export const useWordsContext = (): WordsContextValue => {
    const context = useContext(WordsContext);
    if (!context) {
        throw new Error('useWordsContext must be used within a WordsContextProvider');
    }
    return context;
};
