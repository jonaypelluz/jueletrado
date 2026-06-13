'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import Games from '@components/Games';
import Hero from '@components/Hero';
import LevelList from '@components/LevelList';
import LoadingScreen from '@components/LoadingScreen';
import MainLayout from '@layouts/MainLayout';
import useLevelLoader from '@hooks/useLevelLoader';
import { areWordGroupsCached } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';
import '@styles/HomeContent.scss';

const mainImageArray: string[] = [
    '/images/home/Jueletrado_1.png',
    '/images/home/Jueletrado_2.png',
    '/images/home/Jueletrado_3.png',
    '/images/home/Jueletrado_4.png',
    '/images/home/Jueletrado_5.png',
];

const HomeContent: React.FC = () => {
    const intl = useIntl();
    const { error, gameLevel, isLoading, hydrated, generalLoading } = useWordsContext();
    const { selectLevel, loadAllLevels } = useLevelLoader();
    // Keep the random hero image stable across renders. Picking it inside a
    // useState initializer would re-randomize between server and client; this
    // effect picks it once after mount to avoid hydration mismatch.
    const [currentImage, setCurrentImage] = useState<string>(mainImageArray[0]);
    useEffect(() => {
        setCurrentImage(mainImageArray[Math.floor(Math.random() * mainImageArray.length)]);
    }, []);

    const handlePopulateDBClick = (level: string) => {
        selectLevel(level);
    };

    const handleLoadAllClick = () => {
        loadAllLevels();
    };

    // General (initial) load: on first hydration, if the user has a stored
    // level but the word-group caches have expired, reload them through the
    // same serialized level-load chain used by level switches. Runs once.
    const initialCheckDone = useRef(false);
    useEffect(() => {
        if (!hydrated || initialCheckDone.current) return;
        initialCheckDone.current = true;

        if (gameLevel && !areWordGroupsCached()) {
            selectLevel(gameLevel);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hydrated, gameLevel]);

    if (error) {
        return (
            <MainLayout>
                <LoadingScreen rotateMessages />
            </MainLayout>
        );
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
            <LevelList handlePopulateDBClick={handlePopulateDBClick} handleLoadAllClick={handleLoadAllClick} gameLevel={gameLevel} isLoading={isLoading || generalLoading} hydrated={hydrated} />
            <Games />
        </MainLayout>
    );
};

export default HomeContent;
