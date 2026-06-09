import { useRef } from 'react';
import Logger from '@services/Logger';
import { clearWordGroupCaches, isLevelPopulated, populateWordsDB } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';

const EXPIRE_TIME_24H = 86400000;

const useLevelLoader = () => {
    const { locale, setGameLevel, setLoading, setLoadingProgress, setError } = useWordsContext();
    const isDBBeingPopulated = useRef(false);

    const selectLevel = (level: string, onAfterLoad?: () => void) => {
        if (isDBBeingPopulated.current) return;

        clearWordGroupCaches();

        if (isLevelPopulated(level, locale)) {
            StorageService.setItem(StorageService.SELECTED_LEVEL, level, EXPIRE_TIME_24H);
            setGameLevel(level);
            onAfterLoad?.();
            return;
        }

        setLoading(true);
        isDBBeingPopulated.current = true;
        populateWordsDB(level, locale, setError, setLoadingProgress).then((isPopulated) => {
            if (isPopulated) {
                StorageService.setItem(StorageService.SELECTED_LEVEL, level, EXPIRE_TIME_24H);
                setGameLevel(level);
                onAfterLoad?.();
            } else {
                Logger.warn('Database is not populated yet. Waiting...');
            }
            isDBBeingPopulated.current = false;
        });
    };

    return { selectLevel };
};

export default useLevelLoader;
