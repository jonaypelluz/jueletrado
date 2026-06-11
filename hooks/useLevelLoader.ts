import Logger from '@services/Logger';
import {
    clearWordGroupCaches,
    isLevelPopulated,
    populateWordsDB,
    prefetchWordGroups,
} from '@services/WordsService';
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
    const { locale, setGameLevel, setLoading, setLoadingProgress, setError } = useWordsContext();

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
     * Switches the active level. The level name updates immediately
     * (optimistic); the data load (DB population + word-group prefetch) runs
     * serialized — a switch requested mid-load is queued and runs after.
     */
    const selectLevel = (level: string): void => {
        setGameLevel(level);

        if (isLoadInFlight) {
            pendingLevel = level;
            return;
        }

        runLoad(level);
    };

    return { selectLevel };
};

export default useLevelLoader;
