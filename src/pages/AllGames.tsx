import React, { useEffect, useState } from 'react';
import Games from 'src/components/Games';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';
import StorageService from 'src/store/StorageService';

const App: React.FC = () => {
    const [areWordGroupsLoaded, setAreWordGroupsLoaded] = useState(false);

    useEffect(() => {
        const checkWordGroupsInStorage = () => {
            const wordGroupKeys = [
                StorageService.WORDS_GROUP_20,
                StorageService.WORDS_GROUP_40,
                StorageService.WORDS_GROUP_60,
                StorageService.WORDS_GROUP_80,
            ];

            const areAllGroupsLoaded = wordGroupKeys.every(
                (key) => StorageService.getItem<string[]>(key) != null,
            );

            setAreWordGroupsLoaded(areAllGroupsLoaded);
        };

        checkWordGroupsInStorage();
    }, []);

    return (
        <MainLayout>
            <Hero title="Todos los juegos" />
            {areWordGroupsLoaded ? <Games /> : <p>Loading games...</p>}
        </MainLayout>
    );
};

export default App;
