import React, { useEffect, useState } from 'react';
import Games from 'src/components/Games';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';
import MainLayout from 'src/layouts/MainLayout';
import Logger from 'src/services/Logger';
import StorageService from 'src/store/StorageService';
import { useWordsContext } from 'src/store/WordsContext';

const App: React.FC = () => {
    const { error, setError, setLoading, isLoading } = useWordsContext();
    const [areWordGroupsLoaded, setAreWordGroupsLoaded] = useState(false);

    useEffect(() => {
        const checkWordGroupsInStorage = () => {
            const wordGroupKeys = [
                StorageService.WORDS_GROUP_20,
                StorageService.WORDS_GROUP_40,
                StorageService.WORDS_GROUP_60,
                StorageService.WORDS_GROUP_80,
            ];

            setLoading(true);

            try {
                const areAllGroupsLoaded = wordGroupKeys.every(
                    (key) => StorageService.getItem<string[]>(key) != null,
                );

                setAreWordGroupsLoaded(areAllGroupsLoaded);
                if (!areAllGroupsLoaded) {
                    throw new Error('Some word groups are missing in storage.');
                }
                setLoading(false);
            } catch (error) {
                Logger.error('Error checking word groups:', error);
                setError(error as Error);
            }
        };

        checkWordGroupsInStorage();
    }, []);

    if (error || isLoading || !areWordGroupsLoaded) {
        return <LoadingScreen />;
    }

    return (
        <MainLayout>
            <Hero title="Todos los juegos" />
            <Games />
        </MainLayout>
    );
};

export default App;
