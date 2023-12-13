import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import StorageService from 'src/store/StorageService';
import { WordObject } from 'src/models/interfaces';

interface WordsContextValue {
    words: WordObject[];
    setWords: React.Dispatch<React.SetStateAction<WordObject[]>>;
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
    const [words, setWords] = useState<WordObject[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const storedWords = StorageService.getItem(StorageService.WORDS_SELECTED);
        if (storedWords && Array.isArray(storedWords)) {
            setWords(storedWords);
        }
    }, []);

    const value = {
        words,
        setWords,
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
