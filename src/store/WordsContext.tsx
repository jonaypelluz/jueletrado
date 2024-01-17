import React, { ReactNode, createContext, useContext, useState } from 'react';
import { ContentRoutes } from '@config/translations/Content';
import { GamesRoutes } from '@config/translations/Games';
import StorageService from '@store/StorageService';

interface WordsContextValue {
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
}

const WordsContext = createContext<WordsContextValue | undefined>(undefined);

interface WordsContextProviderProps {
    children: ReactNode;
}

const WordsContextProviderImpl: React.FC<WordsContextProviderProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);
    const [wordOfTheDay, setWordOfTheDay] = useState<string | null>(() => {
        return StorageService.getItem<string>(StorageService.SELECTED_DAY_WORD) || null;
    });
    const [gameLevel, setGameLevel] = useState<string | null>(() => {
        return StorageService.getItem<string>(StorageService.SELECTED_LEVEL) || null;
    });

    const defaultLocale = 'es';
    const [locale, setLocaleState] = useState<string>(() => {
        return StorageService.getItem<string>(StorageService.LOCALE) || defaultLocale;
    });

    const setLocale = (newLocale: string) => {
        if (newLocale !== locale) {
            StorageService.clearStorage();
            StorageService.setItem(StorageService.LOCALE, newLocale);
            setLocaleState(newLocale);
        }
    };

    const getCurrentRoutes = (locale: string) => {
        return { ...ContentRoutes[locale], ...GamesRoutes[locale] };
    };

    const currentRoutes = getCurrentRoutes(locale);

    const value = {
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
    };

    return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>;
};

export const WordsContextProvider: React.FC<WordsContextProviderProps> = ({ children }) => {
    return <WordsContextProviderImpl>{children}</WordsContextProviderImpl>;
};

export const useWordsContext = (): WordsContextValue => {
    const context = useContext(WordsContext);
    if (!context) {
        throw new Error('useWordsContext must be used within a WordsContextProvider');
    }
    return context;
};
