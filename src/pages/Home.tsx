import React, { useEffect, useState } from 'react';
import { useWordsContext } from 'src/store/WordsContext';
import { LoadWords, getRandomWord } from 'src/services/WordsService';
import LoadingScreen from 'src/components/LoadingScreen';
import DayWord from 'src/components/DayWord';
import StorageService from 'src/store/StorageService';
import MainLayout from 'src/layouts/MainLayout';
import Games from 'src/components/Games';
import Hero from 'src/components/Hero';

const EXPIRE_TIME_24H = 86400000;

const Home: React.FC = () => {
    const { isLoading, error, setLoadingProgress, setError, setLoading } = useWordsContext();
    const [dailyWord, setDailyWord] = useState<string | undefined>(() => {
        const storedWord = StorageService.getItem<string>(StorageService.DAY_WORD_SELECTED);
        return storedWord || undefined;
    });
    const [areWordsLoaded, setAreWordsLoaded] = useState(false);

    useEffect(() => {
        LoadWords(setError, setLoadingProgress, setLoading);
        setAreWordsLoaded(true);
    }, []);

    useEffect(() => {
        async function fetchRandomWord() {
            const word = await getRandomWord(setError, setLoading);
            StorageService.setItem(StorageService.DAY_WORD_SELECTED, word, EXPIRE_TIME_24H);
            setDailyWord(word);
        }

        if (!dailyWord) {
            fetchRandomWord();
        }
    }, [areWordsLoaded]);

    if (isLoading || error) {
        return <LoadingScreen />;
    }

    return (
        <MainLayout>
            <Hero
                title="Jueletrado"
                subtitle="Donde jugar y aprender a escribir van de la mano"
                backgroundColor="#CCC"
            />
            {dailyWord ? <DayWord word={dailyWord} /> : ''}
            <Games />
        </MainLayout>
    );
};

export default Home;
