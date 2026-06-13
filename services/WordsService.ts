import LevelsConfig from '@config/LevelConfig';
import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
import StorageService from '@store/StorageService';

type SetErrorFunction = (error: Error | null) => void;
type SetLoadingProgressFunction = (progress: number) => void;

type LevelsPopulatedMap = Record<string, Record<string, boolean>>;

// dbService is a singleton whose mutable storeName is read at transaction
// time, so two IndexedDB flows running between each other's awaits clobber
// each other's store (e.g. the background daily-word load racing the first
// level selection). This promise-chain mutex serializes every DB-touching
// operation in this module. Operations must NOT nest inside each other's
// lock (that would deadlock) — wrap only top-level entry points.
let dbQueue: Promise<unknown> = Promise.resolve();
const withDBLock = <T>(task: () => Promise<T>): Promise<T> => {
    const run = dbQueue.then(task, task);
    dbQueue = run.then(
        () => undefined,
        () => undefined,
    );
    return run;
};

const WORD_GROUP_KEYS = [
    StorageService.WORDS_DAILY,
    StorageService.WORDS_FINDER,
    StorageService.WORDS_TOWER,
    StorageService.WORDS_RAIN,
    StorageService.WORDS_ACCENT,
] as const;

/** Clears only the per-game word caches, leaving level/locale settings intact. */
const clearWordGroupCaches = (): void => {
    for (const key of WORD_GROUP_KEYS) {
        StorageService.removeItem(key);
    }
};

/** True when every per-game word cache has a non-empty word list. */
const areWordGroupsCached = (): boolean =>
    WORD_GROUP_KEYS.every((key) => {
        const group = StorageService.getItem<string[]>(key);
        return !!group && group.length > 0;
    });

const WORD_GROUP_FETCH_CONFIG: {
    count: number;
    key: import('@store/StorageService').StorageKey;
    maxLength?: number;
    minLength?: number;
}[] = [
    // WORDS_DAILY: 7 words, one drawn per day (24h TTL applied when storing the daily word).
    { count: 7, key: StorageService.WORDS_DAILY, minLength: 4 },
    // WORDS_FINDER: persistent queue, 10 words/session × 6 sessions before refetch.
    { count: 60, key: StorageService.WORDS_FINDER, maxLength: 9, minLength: 4 },
    // WORDS_TOWER: persistent queue, 15 words/session × 8 sessions before refetch.
    { count: 120, key: StorageService.WORDS_TOWER, minLength: 4 },
    // WORDS_RAIN: cycling pool, 150 words (looped, not consumed).
    // Oversized — some words lose all invalid variants after dictionary validation.
    { count: 150, key: StorageService.WORDS_RAIN, minLength: 4 },
    // WORDS_ACCENT: persistent queue, oversized since many words are rejected
    // by the accent-eligibility filter in accentFixer.
    { count: 80, key: StorageService.WORDS_ACCENT, minLength: 4 },
];

/**
 * Fetches and caches every per-game word group for the given level (skipping
 * groups already cached). Returns false if any group failed to load.
 */
const prefetchWordGroups = async (
    level: string | null,
    locale: string,
    setError: SetErrorFunction,
): Promise<boolean> => {
    try {
        await Promise.all(
            WORD_GROUP_FETCH_CONFIG.map(async (group) => {
                const storedWords = StorageService.getItem<string[]>(group.key);
                if (storedWords && storedWords.length > 0) return;

                const words = await getWords(
                    level,
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
            }),
        );
        return true;
    } catch (error) {
        Logger.error('Error in loading word groups:', error);
        return false;
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

const populateWordsDBImpl = async (
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

const getAllWordsImpl = async (
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

const getWordsImpl = async (
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

const deleteWordsDBImpl = async (setError: SetErrorFunction): Promise<void> => {
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

const getLevelWordSetImpl = async (
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
 * Combines the word sets of every level for the given locale, so a word
 * classified at one level (e.g. "maduró" — advanced) isn't mistaken for a
 * misspelling when validating accent variants of a word from another level
 * (e.g. "maduro" — beginner), and so words like "zoo" (advanced) are
 * recognized even while playing a lower level. Levels not yet populated
 * locally are populated first (populateWordsDB no-ops via its fast path if
 * already populated) — calls are sequential to avoid racing on the shared
 * dbService store/connection state.
 */
const getFullWordSet = async (
    locale: string,
    setError: SetErrorFunction = () => {},
    setLoadingProgress: SetLoadingProgressFunction = () => {},
): Promise<Set<string>> => {
    const combined = new Set<string>();
    for (const config of LevelsConfig) {
        await populateWordsDB(config.level, locale, setError, setLoadingProgress);
        const levelSet = await getLevelWordSet(config.level, locale);
        levelSet.forEach((word) => combined.add(word));
    }
    return combined;
};

/**
 * Returns the daily word for the given locale.
 * Reads SELECTED_DAY_WORD from storage first (fast path, 24h TTL).
 * If missing, silently ensures the beginner level is populated in IndexedDB
 * (loads the single 28 KB chunk on first ever visit), draws one word,
 * stores it with a 24h TTL, and returns it.
 * Errors are swallowed — the caller should handle a null return gracefully.
 */
const loadDailyWordForLocaleImpl = async (locale: string): Promise<string | null> => {
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

        const [word] = await dbService.getRandomWords(1);
        if (!word) return null;

        StorageService.setItem(StorageService.SELECTED_DAY_WORD, word, 86400000);
        return word;
    } catch (err) {
        Logger.error('Error loading daily word:', err);
        return null;
    }
};

// Locked entry points — see withDBLock. Helpers that already call a locked
// function (prefetchWordGroups, getSessionWords, getFullWordSet) stay
// unlocked to avoid deadlocking on their own queue entry.
const populateWordsDB: typeof populateWordsDBImpl = (...args) =>
    withDBLock(() => populateWordsDBImpl(...args));
const getAllWords: typeof getAllWordsImpl = (...args) => withDBLock(() => getAllWordsImpl(...args));
const getWords: typeof getWordsImpl = (...args) => withDBLock(() => getWordsImpl(...args));
const deleteWordsDB: typeof deleteWordsDBImpl = (...args) =>
    withDBLock(() => deleteWordsDBImpl(...args));
const getLevelWordSet: typeof getLevelWordSetImpl = (...args) =>
    withDBLock(() => getLevelWordSetImpl(...args));
const loadDailyWordForLocale: typeof loadDailyWordForLocaleImpl = (...args) =>
    withDBLock(() => loadDailyWordForLocaleImpl(...args));

export {
    populateWordsDB,
    getWords,
    getAllWords,
    deleteWordsDB,
    loadWords,
    loadDefinition,
    getLevelWordSet,
    getFullWordSet,
    getSessionWords,
    clearWordGroupCaches,
    areWordGroupsCached,
    prefetchWordGroups,
    isLevelPopulated,
    loadDailyWordForLocale,
};
