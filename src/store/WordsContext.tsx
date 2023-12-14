import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WordsContextValue {
    isLoading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    loadingProgress: number;
    setLoadingProgress: React.Dispatch<React.SetStateAction<number>>;
    error: Error | null;
    setError: React.Dispatch<React.SetStateAction<Error | null>>;
}

const WordsContext = createContext<WordsContextValue | undefined>(undefined);

interface WordsContextProviderProps {
    children: ReactNode;
}

const WordsContextProviderImpl: React.FC<WordsContextProviderProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    const value = {
        isLoading,
        setLoading: setIsLoading,
        loadingProgress,
        setLoadingProgress,
        error,
        setError,
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
