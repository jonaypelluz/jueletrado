import Logger from '@services/Logger';
import {
    clearWordGroupCaches,
    isLevelPopulated,
    populateWordsDB,
    prefetchWordGroups,
} from '@services/WordsService';
import LevelsConfig from '@config/LevelConfig';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';

const EXPIRE_TIME_24H = 86400000;

// Module-level so the lock is shared across every component using this hook
// (Header and HomeContent each mount their own instance).
let isLoadInFlight = false;
let pendingLevel: string | null = null;

/** Test-only: clears the shared serialization state between test cases. */
export const __resetLevelLoaderForTests = (): void => {
    isLoadInFlight = false;
    pendingLevel = null;
};

const useLevelLoader = () => {
    const { locale, gameLevel: currentGameLevel, setGameLevel, setLoading, setLoadingProgress, setError } = useWordsContext();

    const runLoad = async (level: string): Promise<void> => {
        isLoadInFlight = true;
        setLoading(true);

        try {
            if (!isLevelPopulated(level, locale)) {
                const isPopulated = await populateWordsDB(
                    level,
                    locale,
                    setError,
                    setLoadingProgress,
                );
                if (!isPopulated) {
                    Logger.warn('Database is not populated yet. Waiting...');
                    return;
                }
            }

            setGameLevel(level);
            StorageService.setItem(StorageService.SELECTED_LEVEL, level, EXPIRE_TIME_24H);

            clearWordGroupCaches();
            await prefetchWordGroups(level, locale, setError);
        } finally {
            isLoadInFlight = false;

            // User picked another level while this one was loading — load it
            // now, keeping the spinner on until the queue is drained.
            const next = pendingLevel;
            pendingLevel = null;
            if (next && next !== level) {
                runLoad(next);
            } else {
                setLoading(false);
            }
        }
    };

    /**
     * Loads all levels then auto-selects beginner. Used for the initial
     * "Cargar niveles" CTA when no level has been chosen yet.
     */
    const loadAllLevels = async (): Promise<void> => {
        if (isLoadInFlight) return;
        isLoadInFlight = true;
        setLoading(true);

        try {
            for (const { level } of LevelsConfig) {
                if (!isLevelPopulated(level, locale)) {
                    const isPopulated = await populateWordsDB(
                        level,
                        locale,
                        setError,
                        setLoadingProgress,
                    );
                    if (!isPopulated) {
                        Logger.warn(`Database not populated for level ${level}.`);
                        return;
                    }
                }
            }

            const firstLevel = LevelsConfig[0].level;
            setGameLevel(firstLevel);
            StorageService.setItem(StorageService.SELECTED_LEVEL, firstLevel, EXPIRE_TIME_24H);
            clearWordGroupCaches();
            await prefetchWordGroups(firstLevel, locale, setError);
        } finally {
            isLoadInFlight = false;
            setLoading(false);
        }
    };

    /**
     * Switches the active level. Updates optimistically only when there is
     * already a level (switching); on first load the level is set inside
     * runLoad after the DB is populated.
     */
    const selectLevel = (level: string): void => {
        if (currentGameLevel !== null) {
            setGameLevel(level);
        }

        if (isLoadInFlight) {
            pendingLevel = level;
            return;
        }

        runLoad(level);
    };

    return { selectLevel, loadAllLevels };
};

export default useLevelLoader;
