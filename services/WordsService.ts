import LevelsConfig from '@config/LevelConfig';
import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
import StorageService from '@store/StorageService';

type SetErrorFunction = (error: Error | null) => void;
type SetLoadingProgressFunction = (progress: number) => void;

type LevelsPopulatedMap = Record<string, Record<string, boolean>>;

const WORD_GROUP_KEYS = [
    StorageService.WORDS_DAILY,
    StorageService.WORDS_FINDER,
    StorageService.WORDS_TOWER,
    StorageService.WORDS_RAIN,
] as const;

/** Clears only the per-game word caches, leaving level/locale settings intact. */
const clearWordGroupCaches = (): void => {
    for (const key of WORD_GROUP_KEYS) {
        StorageService.removeItem(key);
    }
};

const markLevelPopulated = (level: string, locale: string): void => {
    const map = StorageService.getItem<LevelsPopulatedMap>(StorageService.LEVELS_POPULATED) ?? {};
    if (!map[locale]) map[locale] = {};
    map[locale][level] = true;
    StorageService.setItem(StorageService.LEVELS_POPULATED, map);
};

const isLevelPopulated = (level: string, locale: string): boolean => {
    const map = StorageService.getItem<LevelsPopulatedMap>(StorageService.LEVELS_POPULATED) ?? {};
    return map[locale]?.[level] === true;
};

const loadWords = async (level: string, start: number, end: number, locale: string) => {
    try {
        const response = await fetch(
            `/words/${locale}/${level}_words_from_${start}_to_${end}.json`,
        );
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        Logger.error('Error fetching words:', error);
    }
};

const loadDefinition = async (letter: string, locale: string): Promise<Record<string, { level?: string; definitions: { number: number; type: string; definition: string }[] }> | undefined> => {
    try {
        const response = await fetch(`/definitions/${locale}/${letter}_definitions.json`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        Logger.error('Error fetching definitions:', error);
    }
};

const populateWordsDB = async (
    level: string | null,
    locale: string,
    setError: SetErrorFunction,
    setLoadingProgress: SetLoadingProgressFunction,
): Promise<boolean> => {
    const levelConfig = LevelsConfig.find((config) => config.level === level);
    if (!levelConfig) {
        const errorMsg = 'Invalid level specified';
        Logger.error(errorMsg);
        setError(new Error(errorMsg));
        return false;
    }

    try {
        dbService.setStoreName(levelConfig.level, locale);
        await dbService.initDB();

        const minimumPopulatedCount = levelConfig.minimumPopulatedCount[locale];

        // Fast path: DB already has words for this level+locale.
        const alreadyPopulated = await dbService.checkIfPopulated(
            levelConfig.level,
            locale,
            minimumPopulatedCount,
        );
        if (alreadyPopulated) {
            markLevelPopulated(levelConfig.level, locale);
            Logger.log(`Level ${level} already populated — skipping chunk load.`);
            return true;
        }

        setLoadingProgress(0);
        // Clear only word group caches, not locale/level settings.
        clearWordGroupCaches();
        StorageService.setItem(StorageService.LOCALE, locale);

        const totalChunks = levelConfig.totalChunks[locale];
        const chunkSize = 100000;
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize + 1;
            const end = (i + 1) * chunkSize;
            const words = await loadWords(levelConfig.level, start, end, locale);

            await dbService.addWords(
                levelConfig.level,
                locale,
                words,
                levelConfig.minimumPopulatedCount,
            );

            setLoadingProgress(((i + 1) / totalChunks) * 100);
        }

        const populated = await dbService.checkIfPopulated(
            levelConfig.level,
            locale,
            minimumPopulatedCount,
        );
        if (populated) markLevelPopulated(levelConfig.level, locale);
        return populated;
    } catch (error) {
        Logger.error('Error loading words:', error);
        setError(error as Error);
        return false;
    }
};

const getAllWords = async (
    level: string | null,
    locale: string,
    setError: SetErrorFunction,
): Promise<string[] | undefined> => {
    const levelConfig = LevelsConfig.find((config) => config.level === level);
    if (!levelConfig) {
        const errorMsg = 'Invalid level specified';
        Logger.error(errorMsg);
        setError(new Error(errorMsg));
        return;
    }

    try {
        dbService.setStoreName(levelConfig.level, locale);
        await dbService.initDB();

        const words = await dbService.getAllWords();

        return words;
    } catch (error) {
        Logger.error('Error retrieving all words:', error);
        setError(error as Error);
    }
};

const getWords = async (
    level: string | null,
    locale: string,
    count: number,
    setError: SetErrorFunction,
    maxLength: number | null = null,
    minLength: number | null = null,
): Promise<string[] | undefined> => {
    const levelConfig = LevelsConfig.find((config) => config.level === level);
    if (!levelConfig) {
        const errorMsg = 'Invalid level specified';
        Logger.error(errorMsg);
        setError(new Error(errorMsg));
        return;
    }

    try {
        dbService.setStoreName(levelConfig.level, locale);
        await dbService.initDB();

        let words;
        if (maxLength !== null) {
            words = await dbService.getRandomWordsWithMaxLength(
                count,
                maxLength,
                minLength ?? 3,
            );
        } else if (minLength !== null) {
            words = await dbService.getRandomWordsWithMaxLength(count, Infinity, minLength);
        } else {
            words = await dbService.getRandomWords(count);
        }

        return words;
    } catch (error) {
        Logger.error('Error retrieving game words:', error);
        setError(error as Error);
    }
};

const deleteWordsDB = async (setError: SetErrorFunction): Promise<void> => {
    try {
        await dbService.deleteDatabase();
        Logger.log('Words database successfully deleted');
    } catch (error) {
        Logger.error('Error deleting words database:', error);
        setError(error as Error);
    }
};

/**
 * Draws `sessionSize` words from the front of a persistent localStorage pool.
 * Saves the remainder back. Triggers a silent background refetch when the
 * remaining pool drops below `refetchThreshold` so future sessions don't wait.
 *
 * If the pool is empty (first visit or expired), fetches synchronously and
 * returns `sessionSize` words immediately.
 */
const getSessionWords = async (
    key: import('@store/StorageService').StorageKey,
    sessionSize: number,
    level: string | null,
    locale: string,
    setError: SetErrorFunction,
    fetchOptions: { count: number; maxLength?: number; minLength?: number },
    refetchThreshold?: number,
): Promise<string[]> => {
    const threshold = refetchThreshold ?? sessionSize;

    const refetchInBackground = (currentPool: string[]) => {
        getWords(
            level,
            locale,
            fetchOptions.count,
            setError,
            fetchOptions.maxLength ?? null,
            fetchOptions.minLength ?? null,
        ).then((newWords) => {
            if (newWords?.length) {
                const latest = StorageService.getItem<string[]>(key) ?? [];
                StorageService.setItem(key, [...latest, ...newWords]);
            }
        });
    };

    let pool = StorageService.getItem<string[]>(key) ?? [];

    if (pool.length === 0) {
        // First visit or expired — fetch synchronously so the game can start.
        const fresh = await getWords(
            level,
            locale,
            fetchOptions.count,
            setError,
            fetchOptions.maxLength ?? null,
            fetchOptions.minLength ?? null,
        );
        pool = fresh ?? [];
    }

    const sessionWords = pool.slice(0, sessionSize);
    const remaining = pool.slice(sessionSize);

    StorageService.setItem(key, remaining);

    if (remaining.length < threshold) {
        refetchInBackground(remaining);
    }

    return sessionWords;
};

const levelWordSetCache = new Map<string, Set<string>>();

const getLevelWordSet = async (
    level: string | null,
    locale: string,
): Promise<Set<string>> => {
    const cacheKey = `${level}_${locale}`;
    const cached = levelWordSetCache.get(cacheKey);
    if (cached) return cached;

    const levelConfig = LevelsConfig.find((config) => config.level === level);
    if (!levelConfig) return new Set();

    try {
        dbService.setStoreName(levelConfig.level, locale);
        await dbService.initDB();
        const words = await dbService.getAllWords();
        const wordSet = new Set<string>(words ?? []);
        levelWordSetCache.set(cacheKey, wordSet);
        return wordSet;
    } catch {
        return new Set();
    }
};

/**
 * Returns the daily word for the given locale.
 * Reads SELECTED_DAY_WORD from storage first (fast path, 24h TTL).
 * If missing, silently ensures the beginner level is populated in IndexedDB
 * (loads the single 28 KB chunk on first ever visit), draws one word,
 * stores it with a 24h TTL, and returns it.
 * Errors are swallowed — the caller should handle a null return gracefully.
 */
const loadDailyWordForLocale = async (locale: string): Promise<string | null> => {
    const stored = StorageService.getItem<string>(StorageService.SELECTED_DAY_WORD);
    if (stored) return stored;

    const begConfig = LevelsConfig.find((c) => c.level === 'beginner');
    if (!begConfig) return null;

    try {
        dbService.setStoreName('beginner', locale);
        await dbService.initDB();

        const minCount = begConfig.minimumPopulatedCount[locale];
        const alreadyPopulated = await dbService.checkIfPopulated('beginner', locale, minCount);

        if (!alreadyPopulated) {
            const words = await loadWords('beginner', 1, 100000, locale);
            if (words?.length) {
                await dbService.addWords('beginner', locale, words, begConfig.minimumPopulatedCount);
            }
        }

        markLevelPopulated('beginner', locale);

        const [word] = await dbService.getRandomWords(1);
        if (!word) return null;

        StorageService.setItem(StorageService.SELECTED_DAY_WORD, word, 86400000);
        return word;
    } catch (err) {
        Logger.error('Error loading daily word:', err);
        return null;
    }
};

export {
    populateWordsDB,
    getWords,
    getAllWords,
    deleteWordsDB,
    loadWords,
    loadDefinition,
    getLevelWordSet,
    getSessionWords,
    clearWordGroupCaches,
    isLevelPopulated,
    loadDailyWordForLocale,
};
