import React, { useEffect, useRef, useState } from 'react';
import { Collapse, Typography } from 'antd';
import LevelsConfig from '@config/LevelConfig';
import { LevelConfig } from '@models/types';
import Logger from '@services/Logger';
import { getWords, populateWordsDB } from '@services/WordsService';
import StorageService, { StorageKey } from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';
import Games from 'src/components/Games';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';
import MainLayout from 'src/layouts/MainLayout';
import './Home.scss';

const { Text } = Typography;

const EXPIRE_TIME_24H: number = 86400000;

const mainImageArray: string[] = [
    '/images/home/Jueletrado_1.png',
    '/images/home/Jueletrado_2.png',
    '/images/home/Jueletrado_3.png',
    '/images/home/Jueletrado_4.png',
    '/images/home/Jueletrado_5.png',
];

const levelTranslations: { [key: string]: string } = {
    basic: 'Principiante',
    intermediate: 'Intermedio',
    hard: 'Difícil',
};

interface LevelListProps {
    handlePopulateDBClick: (level: string) => void;
    gameLevel: string | null;
}

const LevelList: React.FC<LevelListProps> = ({
    handlePopulateDBClick,
    gameLevel,
}: LevelListProps) => (
    <>
        {LevelsConfig.map((level: LevelConfig, idx: number) => (
            <div
                key={idx}
                onClick={() => handlePopulateDBClick(level.level)}
                className={`btn-${level.level} btn-levels ${
                    gameLevel && gameLevel === level.level ? 'selected' : ''
                }`}
            >
                <img src={`/images/levels/${level.level}Bg.png`} alt={level.level} />
                <Text strong>{levelTranslations[level.level]}</Text>
            </div>
        ))}
    </>
);

const Home: React.FC = () => {
    const {
        isLoading,
        error,
        gameLevel,
        setLoadingProgress,
        setError,
        setLoading,
        setWordOfTheDay,
        setGameLevel,
    } = useWordsContext();
    const [areWordsLoaded, setAreWordsLoaded] = useState<boolean>(false);
    const [wordGroupsLoaded, setWordGroupsLoaded] = useState<boolean>(false);
    const isDBBeingPopulated = useRef<boolean>(false);
    const [currentImage] = useState<string>(
        mainImageArray[Math.floor(Math.random() * mainImageArray.length)],
    );

    const handlePopulateDBClick = (level: string) => {
        if (!isDBBeingPopulated.current) {
            setAreWordsLoaded(false);
            setWordGroupsLoaded(false);
            setLoading(true);
            isDBBeingPopulated.current = true;
            populateWordsDB(level, setError, setLoadingProgress).then((isPopulated) => {
                if (isPopulated) {
                    StorageService.setItem(StorageService.SELECTED_LEVEL, level, EXPIRE_TIME_24H);
                    setGameLevel(level);
                    setAreWordsLoaded(true);
                    isDBBeingPopulated.current = false;
                } else {
                    Logger.warn('Database is not populated yet. Waiting...');
                }
            });
        }
    };

    useEffect(() => {
        if (areWordsLoaded) {
            const wordGroups: { count: number; key: StorageKey; maxLength?: number }[] = [
                { count: 20, key: StorageService.WORDS_GROUP_20 },
                { count: 40, key: StorageService.WORDS_GROUP_40 },
                { count: 40, key: StorageService.WORDS_GROUP_40_UNDER_9, maxLength: 9 },
                { count: 60, key: StorageService.WORDS_GROUP_60 },
                { count: 80, key: StorageService.WORDS_GROUP_80 },
            ];

            const fetchAndStoreWords = async (group: {
                count: number;
                key: StorageKey;
                maxLength?: number;
            }): Promise<void> => {
                const storedWords = StorageService.getItem<string[]>(group.key);

                if (!storedWords || storedWords.length === 0) {
                    try {
                        const words = await getWords(
                            gameLevel,
                            group.count,
                            setError,
                            group.maxLength,
                        );
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
            };

            Promise.all(wordGroups.map((group) => fetchAndStoreWords(group)))
                .then(() => {
                    setWordGroupsLoaded(true);
                })
                .catch((error) => {
                    Logger.error('Error in loading word groups:', error);
                });
        }
    }, [areWordsLoaded, gameLevel, setError]);

    useEffect(() => {
        if (wordGroupsLoaded) {
            const storedDailyWord = StorageService.getItem<string>(
                StorageService.SELECTED_DAY_WORD,
            );

            if (!storedDailyWord) {
                const wordsGroup20 = StorageService.getItem<string[]>(
                    StorageService.WORDS_GROUP_20,
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
    }, [wordGroupsLoaded]);

    if (isLoading || error) {
        return <LoadingScreen rotateMessages />;
    }

    return (
        <MainLayout>
            <Hero
                image={currentImage}
                title="Jueletrado"
                subtitle="Donde jugar y aprender a escribir bien van de la mano"
                styles={{ border: '1px solid #000' }}
            />
            <div className="level-wrapper">
                <Collapse
                    collapsible="header"
                    defaultActiveKey={gameLevel === null ? ['1'] : []}
                    ghost={true}
                    items={[
                        {
                            key: '1',
                            label: gameLevel
                                ? `Nivel: ${levelTranslations[gameLevel]}`
                                : 'Elige el nivel',
                            children: (
                                <LevelList
                                    handlePopulateDBClick={handlePopulateDBClick}
                                    gameLevel={gameLevel}
                                />
                            ),
                        },
                    ]}
                />
            </div>
            <Games />
        </MainLayout>
    );
};

export default Home;
