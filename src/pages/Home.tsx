import React, { useEffect, useState } from 'react';
import { useWordsContext } from 'src/store/WordsContext';
import { populateWordsDB, getGameWords } from 'src/services/WordsService';
import LoadingScreen from 'src/components/LoadingScreen';
import DayWord from 'src/components/DayWord';
import StorageService, { StorageKey } from 'src/store/StorageService';
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
    const [wordGroupsLoaded, setWordGroupsLoaded] = useState(false);

    useEffect(() => {
        setLoading(true);
        populateWordsDB(setError, setLoadingProgress);
        setAreWordsLoaded(true);
    }, []);

    useEffect(() => {
        const wordGroups: { count: number; key: StorageKey }[] = [
            { count: 20, key: StorageService.WORDS_GROUP_20 },
            { count: 40, key: StorageService.WORDS_GROUP_40 },
            { count: 60, key: StorageService.WORDS_GROUP_60 },
            { count: 80, key: StorageService.WORDS_GROUP_80 },
        ];

        async function fetchAndStoreWords(group: { count: number; key: StorageKey }) {
            const storedWords = StorageService.getItem<string[]>(group.key);

            if (!storedWords) {
                const words = await getGameWords(group.count, setError);
                if (words) {
                    StorageService.setItem(group.key, words, 3600000);
                }
            }
        }

        Promise.all(wordGroups.map((group) => fetchAndStoreWords(group))).then(() => {
            setWordGroupsLoaded(true);
        });
    }, [areWordsLoaded]);

    useEffect(() => {
        if (wordGroupsLoaded) {
            const storedDailyWord = StorageService.getItem<string>(
                StorageService.DAY_WORD_SELECTED,
            );

            if (!storedDailyWord) {
                const wordsGroup20 = StorageService.getItem<string[]>(
                    StorageService.WORDS_GROUP_20,
                );
                if (wordsGroup20 && wordsGroup20.length > 0) {
                    const dailyWord = wordsGroup20[0];
                    StorageService.setItem(
                        StorageService.DAY_WORD_SELECTED,
                        dailyWord,
                        EXPIRE_TIME_24H,
                    );
                    setDailyWord(dailyWord);
                }
            } else {
                setDailyWord(storedDailyWord);
            }
            setLoading(false);
        }
    }, [wordGroupsLoaded]);

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
