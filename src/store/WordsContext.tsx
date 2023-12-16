import React, { ReactNode, createContext, useContext, useState } from 'react';
import StorageService from 'src/store/StorageService';

interface WordsContextValue {
    isLoading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    loadingProgress: number;
    setLoadingProgress: React.Dispatch<React.SetStateAction<number>>;
    error: Error | null;
    setError: React.Dispatch<React.SetStateAction<Error | null>>;
    wordOfTheDay: string | null;
    setWordOfTheDay: React.Dispatch<React.SetStateAction<string | null>>;
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
        return StorageService.getItem<string>(StorageService.DAY_WORD_SELECTED) || null;
    });

    const value = {
        isLoading,
        setLoading: setIsLoading,
        loadingProgress,
        setLoadingProgress,
        error,
        setError,
        wordOfTheDay,
        setWordOfTheDay,
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
