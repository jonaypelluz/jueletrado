'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import Games from '@components/Games';
import Hero from '@components/Hero';
import LevelList from '@components/LevelList';
import LoadingScreen from '@components/LoadingScreen';
import MainLayout from '@layouts/MainLayout';
import Logger from '@services/Logger';
import { getWords, populateWordsDB } from '@services/WordsService';
import StorageService, { StorageKey } from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import '@styles/HomeContent.scss';

const EXPIRE_TIME_24H: number = 86400000;

const mainImageArray: string[] = [
    '/images/home/Jueletrado_1.png',
    '/images/home/Jueletrado_2.png',
    '/images/home/Jueletrado_3.png',
    '/images/home/Jueletrado_4.png',
    '/images/home/Jueletrado_5.png',
];

const HomeContent: React.FC = () => {
    const intl = useIntl();
    const {
        locale,
        isLoading,
        error,
        gameLevel,
        hydrated,
        setLoadingProgress,
        setError,
        setLoading,
        setWordOfTheDay,
        setGameLevel,
    } = useWordsContext();
    const [areWordsLoaded, setAreWordsLoaded] = useState<boolean>(false);
    const [wordGroupsLoaded, setWordGroupsLoaded] = useState<boolean>(false);
    const isDBBeingPopulated = useRef<boolean>(false);
    // Keep the random hero image stable across renders. Picking it inside a
    // useState initializer would re-randomize between server and client; this
    // effect picks it once after mount to avoid hydration mismatch.
    const [currentImage, setCurrentImage] = useState<string>(mainImageArray[0]);
    useEffect(() => {
        setCurrentImage(mainImageArray[Math.floor(Math.random() * mainImageArray.length)]);
    }, []);

    const handlePopulateDBClick = (level: string) => {
        if (!isDBBeingPopulated.current) {
            setAreWordsLoaded(false);
            setWordGroupsLoaded(false);
            setLoading(true);
            isDBBeingPopulated.current = true;
            populateWordsDB(level, locale, setError, setLoadingProgress).then((isPopulated) => {
                if (isPopulated) {
                    StorageService.setItem(
                        StorageService.SELECTED_LEVEL,
                        level,
                        EXPIRE_TIME_24H,
                    );
                    setGameLevel(level);
                    setAreWordsLoaded(true);
                    isDBBeingPopulated.current = false;
                } else {
                    Logger.warn('Database is not populated yet. Waiting...');
                }
            });
        }
    };

    // After hydration, if the user has a stored level but word groups have expired, re-fetch them.
    useEffect(() => {
        if (!hydrated || !gameLevel || areWordsLoaded) return;

        const groupKeys: StorageKey[] = [
            StorageService.WORDS_DAILY,
            StorageService.WORDS_FINDER,
            StorageService.WORDS_TOWER,
            StorageService.WORDS_RAIN,
        ];
        const allPresent = groupKeys.every((key) => {
            const g = StorageService.getItem<string[]>(key);
            return g && g.length > 0;
        });

        if (allPresent) {
            setWordGroupsLoaded(true);
        } else {
            setAreWordsLoaded(true);
        }
    }, [hydrated, gameLevel]);

    useEffect(() => {
        if (areWordsLoaded) {
            const wordGroups: {
                count: number;
                key: StorageKey;
                maxLength?: number;
                minLength?: number;
            }[] = [
                // WORDS_DAILY: 7 words, one drawn per day (24h TTL applied when storing the daily word).
                { count: 7, key: StorageService.WORDS_DAILY, minLength: 4 },
                // WORDS_FINDER: persistent queue, 10 words/session × 6 sessions before refetch.
                { count: 60, key: StorageService.WORDS_FINDER, maxLength: 9, minLength: 4 },
                // WORDS_TOWER: persistent queue, 15 words/session × 5 sessions before refetch.
                { count: 75, key: StorageService.WORDS_TOWER, minLength: 4 },
                // WORDS_RAIN: cycling pool, 80 words (looped, not consumed).
                { count: 80, key: StorageService.WORDS_RAIN, minLength: 4 },
            ];

            const fetchAndStoreWords = async (group: {
                count: number;
                key: StorageKey;
                maxLength?: number;
                minLength?: number;
            }): Promise<void> => {
                const storedWords = StorageService.getItem<string[]>(group.key);

                if (!storedWords || storedWords.length === 0) {
                    try {
                        const words = await getWords(
                            gameLevel,
                            locale,
                            group.count,
                            setError,
                            group.maxLength ?? null,
                            group.minLength ?? null,
                        );
                        if (words && words.length > 0) {
                            StorageService.setItem(group.key, words, 3600000);
                        } else {
                            throw new Error(`No words fetched for group: ${group.key}`);
                        }
                    } catch (err) {
                        Logger.error('Error fetching words for group:', group.key, err);
                        throw err;
                    }
                }
            };

            Promise.all(wordGroups.map((group) => fetchAndStoreWords(group)))
                .then(() => {
                    setWordGroupsLoaded(true);
                })
                .catch((err) => {
                    Logger.error('Error in loading word groups:', err);
                });
        }
    }, [areWordsLoaded, gameLevel, locale, setError]);

    useEffect(() => {
        if (wordGroupsLoaded) {
            const storedDailyWord = StorageService.getItem<string>(
                StorageService.SELECTED_DAY_WORD,
            );

            if (!storedDailyWord) {
                const wordsGroup20 = StorageService.getItem<string[]>(
                    StorageService.WORDS_DAILY,
                );
                if (wordsGroup20 && wordsGroup20.length > 0) {
                    const dailyWord = wordsGroup20[0];
                    StorageService.setItem(
                        StorageService.SELECTED_DAY_WORD,
                        dailyWord,
                        EXPIRE_TIME_24H,
                    );
                    setWordOfTheDay(dailyWord);
                    setLoading(false);
                }
            } else {
                setWordOfTheDay(storedDailyWord);
                setLoading(false);
            }
        }
    }, [wordGroupsLoaded, setLoading, setWordOfTheDay]);

    if (isLoading || error) {
        return <LoadingScreen rotateMessages />;
    }

    return (
        <MainLayout>
            <Hero
                image={currentImage}
                className="home-hero"
                title={intl.formatMessage({ id: 'mainTitle' })}
                subtitle={intl.formatMessage({ id: 'mainDescription' })}
                styles={{ border: '1px solid #000' }}
            />
            <LevelList handlePopulateDBClick={handlePopulateDBClick} gameLevel={gameLevel} />
            <Games />
        </MainLayout>
    );
};

export default HomeContent;
