import React, { useEffect, useRef, useState } from 'react';
import DayWord from 'src/components/DayWord';
import Games from 'src/components/Games';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';
import MainLayout from 'src/layouts/MainLayout';
import Logger from 'src/services/Logger';
import { getGameWords, populateWordsDB } from 'src/services/WordsService';
import StorageService, { StorageKey } from 'src/store/StorageService';
import { useWordsContext } from 'src/store/WordsContext';

const EXPIRE_TIME_24H = 86400000;

const Home: React.FC = () => {
    const { isLoading, error, setLoadingProgress, setError, setLoading } = useWordsContext();
    const [dailyWord, setDailyWord] = useState<string | undefined>(() => {
        const storedWord = StorageService.getItem<string>(StorageService.DAY_WORD_SELECTED);
        return storedWord || undefined;
    });
    const [areWordsLoaded, setAreWordsLoaded] = useState(false);
    const [wordGroupsLoaded, setWordGroupsLoaded] = useState(false);
    const isDBBeingPopulated = useRef(false);

    useEffect(() => {
        if (!isDBBeingPopulated.current) {
            setLoading(true);
            isDBBeingPopulated.current = true;
            populateWordsDB(setError, setLoadingProgress).then((isPopulated) => {
                if (isPopulated) {
                    setAreWordsLoaded(true);
                } else {
                    Logger.warn('Database is not populated yet. Waiting...');
                }
            });
        }
    }, []);

    useEffect(() => {
        const wordGroups: { count: number; key: StorageKey }[] = [
            { count: 20, key: StorageService.WORDS_GROUP_20 },
            { count: 40, key: StorageService.WORDS_GROUP_40 },
            { count: 60, key: StorageService.WORDS_GROUP_60 },
            { count: 80, key: StorageService.WORDS_GROUP_80 },
        ];

        async function fetchAndStoreWords(group: {
            count: number;
            key: StorageKey;
        }): Promise<void> {
            const storedWords = StorageService.getItem<string[]>(group.key);

            if (!storedWords || storedWords.length === 0) {
                try {
                    const words = await getGameWords(group.count, setError);
                    if (words && words.length > 0) {
                        StorageService.setItem(group.key, words, 3600000);
                    } else {
                        throw new Error(`No words fetched for group: ${group.key}`);
                    }
                } catch (error) {
                    Logger.error('Error fetching words for group:', group.key, error);
                    throw error;
                }
            }
        }

        Promise.all(wordGroups.map((group) => fetchAndStoreWords(group)))
            .then(() => {
                setWordGroupsLoaded(true);
            })
            .catch((error) => {
                Logger.error('Error in loading word groups:', error);
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
                    setLoading(false);
                }
            } else {
                setDailyWord(storedDailyWord);
                setLoading(false);
            }
        }
    }, [wordGroupsLoaded]);

    if (isLoading || error || !wordGroupsLoaded) {
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
