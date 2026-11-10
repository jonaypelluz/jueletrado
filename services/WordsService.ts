import LevelsConfig from '@config/LevelConfig';
import { WORD_GROUP_FETCH_CONFIG } from '@config/WordGroupConfig';
import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
import StorageService, { StorageKey } from '@store/StorageService';
import { Level, WordChunk, WordEntry, WordQuery, WordRecord } from '@models/types';
import { DefinitionFileFilter, filterDefinitions, matchesQuery } from '@utils/WordQuery';
import { assertChunkFormat, baseLetter, WORD_CHUNK_VERSION } from '@utils/WordRecord';

type SetErrorFunction = (error: Error | null) => void;
type SetLoadingProgressFunction = (progress: number) => void;

type LevelsPopulatedMap = Record<string, Record<string, boolean>>;

// Positions (or keys) fetched per readonly transaction while sampling.
const SAMPLE_BATCH_SIZE = 256;

// Serializes every top-level IndexedDB flow of this module: a level populate (chunk puts, then the
// population check) must not interleave with reads of the same store, e.g. the background
// daily-word load racing the first level selection. Operations must NOT nest inside each other's
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
    StorageService.WORDS_MATCHER,
    StorageService.WORDS_SYLLABLE,
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

/**
 * Fetches and caches every per-game word group for the given level (skipping
 * groups already cached). Returns false if any group failed to load.
 */
const prefetchWordGroups = async (level: string, locale: string, setError: SetErrorFunction): Promise<boolean> => {
    try {
        await Promise.all(
            WORD_GROUP_FETCH_CONFIG.map(async (group) => {
                const storedWords = StorageService.getItem<string[]>(group.key);
                if (storedWords && storedWords.length > 0) return;

                const words = await getWords({ ...group.query, locale, level, count: group.count }, setError);
                if (words.length > 0) {
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

const findLevelConfig = (level: string | null | undefined, setError: SetErrorFunction) => {
    const levelConfig = LevelsConfig.find((config) => config.level === level);
    if (!levelConfig) {
        const errorMsg = 'Invalid level specified';
        Logger.error(errorMsg);
        setError(new Error(errorMsg));
    }
    return levelConfig;
};

/** Fetches one served v2 chunk (`/words/<locale>/<level>_<n>.json`). */
const loadChunk = async (level: string, n: number, locale: string): Promise<WordChunk> => {
    const response = await fetch(`/words/${locale}/${level}_${n}.json`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

const loadDefinition = async (letter: string, locale: string): Promise<Record<string, WordEntry> | undefined> => {
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

/**
 * Loads a level into IndexedDB unless it already holds it. `clearWordGroups` is false for the implicit
 * load before a read (e.g. the daily word loading beginner): it must not wipe the queues of the level
 * being played; only an explicit level load clears them.
 */
const populateWordsDBImpl = async (
    level: string | null,
    locale: string,
    setError: SetErrorFunction,
    setLoadingProgress: SetLoadingProgressFunction,
    clearWordGroups = true,
): Promise<boolean> => {
    const levelConfig = findLevelConfig(level, setError);
    if (!levelConfig) return false;

    try {
        await dbService.initDB();

        const minimumPopulatedCount = levelConfig.minimumPopulatedCount[locale];

        // Fast path: DB already has words for this level+locale.
        const alreadyPopulated = await dbService.checkIfPopulated(locale, levelConfig.level, minimumPopulatedCount);
        if (alreadyPopulated) {
            markLevelPopulated(levelConfig.level, locale);
            Logger.log(`Level ${level} already populated — skipping chunk load.`);
            return true;
        }

        setLoadingProgress(0);
        // Clear only word group caches, not locale/level settings.
        if (clearWordGroups) clearWordGroupCaches();
        StorageService.setItem(StorageService.LOCALE, locale);

        const totalChunks = levelConfig.totalChunks[locale];
        let offset = 0;
        for (let n = 1; n <= totalChunks; n++) {
            const chunk = await loadChunk(levelConfig.level, n, locale);
            assertChunkFormat(chunk);
            await dbService.putChunk(locale, levelConfig.level as Level, offset, chunk.rows);
            offset += chunk.rows.length;
            setLoadingProgress((n / totalChunks) * 100);
        }

        const populated = await dbService.checkIfPopulated(locale, levelConfig.level, minimumPopulatedCount);
        if (populated) markLevelPopulated(levelConfig.level, locale);
        return populated;
    } catch (error) {
        Logger.error('Error loading words:', error);
        setError(error as Error);
        return false;
    }
};

/**
 * Lazy Fisher–Yates over [0, total): each call to the returned function takes up to `size` more
 * distinct positions, uniformly at random, without materialising the range (a Map of swapped indices).
 */
const positionSampler = (total: number) => {
    const swapped = new Map<number, number>();
    let remaining = total;
    return (size: number): number[] => {
        const batch: number[] = [];
        while (batch.length < size && remaining > 0) {
            const pick = Math.floor(Math.random() * remaining);
            remaining--;
            batch.push(swapped.get(pick) ?? pick);
            swapped.set(pick, swapped.get(remaining) ?? remaining);
        }
        return batch;
    };
};

/**
 * Uniform sample without replacement of the stored words matching the query: min(count, matches)
 * words. The level's served positions [0, minimumPopulatedCount) are sampled and read in batches of
 * keyed lookups until `count` matches are found or the positions run out.
 */
const getWordsImpl = async (query: WordQuery, setError: SetErrorFunction = () => {}): Promise<string[]> => {
    const { locale, level, count } = query;
    const levelConfig = findLevelConfig(level, setError);
    if (!levelConfig) return [];

    try {
        // The populate fast path checks the store itself (cached), so a stale LEVELS_POPULATED flag
        // after a reset or an eviction still reloads the level.
        if (!(await populateWordsDBImpl(level, locale, setError, () => {}, false))) return [];

        const words: string[] = [];
        const nextPositions = positionSampler(levelConfig.minimumPopulatedCount[locale]);
        for (let batch = nextPositions(SAMPLE_BATCH_SIZE); words.length < count && batch.length > 0; batch = nextPositions(SAMPLE_BATCH_SIZE)) {
            for (const record of await dbService.getWordsAt(locale, levelConfig.level, batch)) {
                if (words.length < count && record && matchesQuery(record, query)) words.push(record.word);
            }
        }
        return words;
    } catch (error) {
        Logger.error('Error retrieving game words:', error);
        setError(error as Error);
        return [];
    }
};

const deleteWordsDBImpl = async (setError: SetErrorFunction): Promise<void> => {
    try {
        await dbService.deleteDatabase();
        // The populated flags and queues describe the deleted data.
        StorageService.removeItem(StorageService.LEVELS_POPULATED);
        clearWordGroupCaches();
        Logger.log('Words database successfully deleted');
    } catch (error) {
        Logger.error('Error deleting words database:', error);
        setError(error as Error);
    }
};

/**
 * Draws `sessionSize` words from the front of a persistent localStorage pool.
 * Saves the remainder back. Triggers a silent background refetch (with the same
 * query) when the remaining pool drops below `refetchThreshold` so future
 * sessions don't wait.
 *
 * If the pool is empty (first visit or expired), fetches synchronously and
 * returns `sessionSize` words immediately.
 */
const getSessionWords = async (
    key: StorageKey,
    sessionSize: number,
    query: WordQuery,
    setError: SetErrorFunction,
    refetchThreshold?: number,
): Promise<string[]> => {
    const threshold = refetchThreshold ?? sessionSize;

    const refetchInBackground = () => {
        getWords(query, setError).then((newWords) => {
            if (newWords.length) {
                const latest = StorageService.getItem<string[]>(key) ?? [];
                StorageService.setItem(key, [...latest, ...newWords]);
            }
        });
    };

    let pool = StorageService.getItem<string[]>(key) ?? [];

    if (pool.length === 0) {
        // First visit or expired — fetch synchronously so the game can start.
        pool = await getWords(query, setError);
    }

    const sessionWords = pool.slice(0, sessionSize);
    const remaining = pool.slice(sessionSize);

    StorageService.setItem(key, remaining);

    if (remaining.length < threshold) {
        refetchInBackground();
    }

    return sessionWords;
};

/**
 * Combines the word sets of every level for the given locale, so a word
 * classified at one level (e.g. "maduró" — advanced) isn't mistaken for a
 * misspelling when validating accent variants of a word from another level
 * (e.g. "maduro" — beginner), and so words like "zoo" (advanced) are
 * recognized even while playing a lower level. Levels not yet populated
 * locally are populated first (populateWordsDB no-ops via its fast path if
 * already populated), sequentially. The set is shared per locale until the
 * store changes; callers must not mutate it.
 */
const getFullWordSet = async (
    locale: string,
    setError: SetErrorFunction = () => {},
    setLoadingProgress: SetLoadingProgressFunction = () => {},
): Promise<Set<string>> => {
    for (const config of LevelsConfig) {
        await populateWordsDB(config.level, locale, setError, setLoadingProgress);
    }
    try {
        return await withDBLock(() => dbService.getWordSet(locale));
    } catch (error) {
        Logger.error('Error retrieving the full word set:', error);
        return new Set();
    }
};

/**
 * Returns the daily word for the given locale.
 * Reads SELECTED_DAY_WORD from storage first (fast path, 24h TTL).
 * If missing, silently ensures the beginner level is populated in IndexedDB
 * (loads the single beginner chunk on first ever visit), draws one word,
 * stores it with a 24h TTL, and returns it.
 * Errors are swallowed — the caller should handle a null return gracefully.
 */
const loadDailyWordForLocaleImpl = async (locale: string): Promise<string | null> => {
    const stored = StorageService.getItem<string>(StorageService.SELECTED_DAY_WORD);
    if (stored) return stored;

    const [word] = await getWordsImpl({ locale, level: 'beginner', count: 1 }, (error) => {
        if (error) Logger.error('Error loading daily word:', error);
    });
    if (!word) return null;

    StorageService.setItem(StorageService.SELECTED_DAY_WORD, word, 86400000);
    return word;
};

/** Records of the stored words, in input order; unknown words are dropped. */
const getWordRecordsImpl = async (words: string[], locale: string): Promise<WordRecord[]> => {
    try {
        await dbService.initDB();
        return (await dbService.getRecords(locale, words)).filter((record): record is WordRecord => record !== undefined);
    } catch (error) {
        Logger.error('Error retrieving word records:', error);
        return [];
    }
};

/** One letter's definition file, filtered by sense count / word length; null when it cannot be fetched. */
const getDefinitions = async ({
    locale,
    firstLetter,
    minSenses,
    minLen,
}: { locale: string; firstLetter: string } & DefinitionFileFilter): Promise<Record<string, WordEntry> | null> => {
    const file = await loadDefinition(firstLetter, locale);
    return file ? filterDefinitions(file, { minSenses, minLen }) : null;
};

/** The definition entry of one word (read from its base-letter file, ñ → n), or null. */
const getDefinition = async (word: string, locale: string): Promise<WordEntry | null> => {
    const letter = baseLetter(Array.from(word)[0] ?? '').replace('ñ', 'n');
    const file = await loadDefinition(letter, locale);
    return file && Object.hasOwn(file, word) ? file[word] : null;
};

/**
 * One-off move to the v2 word data: the v1 populated-level flags and word queues point at the old
 * stores, so they are cleared once; settings (locale, level, daily word, best scores) are kept.
 */
const migrateWordsData = (): void => {
    if (StorageService.getItem<number>(StorageService.WORDS_DATA_VERSION) === WORD_CHUNK_VERSION) return;
    clearWordGroupCaches();
    StorageService.removeItem(StorageService.LEVELS_POPULATED);
    StorageService.setItem(StorageService.WORDS_DATA_VERSION, WORD_CHUNK_VERSION);
};

// Locked entry points — see withDBLock. Helpers that already call a locked
// function (prefetchWordGroups, getSessionWords, getFullWordSet) stay
// unlocked to avoid deadlocking on their own queue entry.
const populateWordsDB = (level: string | null, locale: string, setError: SetErrorFunction, setLoadingProgress: SetLoadingProgressFunction): Promise<boolean> =>
    withDBLock(() => populateWordsDBImpl(level, locale, setError, setLoadingProgress));
const getWords: typeof getWordsImpl = (...args) => withDBLock(() => getWordsImpl(...args));
const getWordRecords: typeof getWordRecordsImpl = (...args) => withDBLock(() => getWordRecordsImpl(...args));
const deleteWordsDB: typeof deleteWordsDBImpl = (...args) => withDBLock(() => deleteWordsDBImpl(...args));
const loadDailyWordForLocale: typeof loadDailyWordForLocaleImpl = (...args) => withDBLock(() => loadDailyWordForLocaleImpl(...args));

export {
    populateWordsDB,
    getWords,
    deleteWordsDB,
    getFullWordSet,
    getSessionWords,
    clearWordGroupCaches,
    areWordGroupsCached,
    prefetchWordGroups,
    isLevelPopulated,
    loadDailyWordForLocale,
    getWordRecords,
    getDefinitions,
    getDefinition,
    migrateWordsData,
};
