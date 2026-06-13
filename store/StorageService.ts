import Logger from '@services/Logger';

export type StorageKey =
    | 'SELECTED_DAY_WORD'
    | 'SELECTED_LEVEL'
    | 'WORDS_DAILY'
    | 'WORDS_RAIN'
    | 'WORDS_FINDER'
    | 'WORDS_TOWER'
    | 'WORDS_ACCENT'
    | 'LOCALE'
    | 'LEVELS_POPULATED';

type StoredItem<T> = {
    value: T;
    timestamp: number;
    expireIn?: number;
};

const isBrowser = (): boolean => typeof window !== 'undefined';

const StorageService = {
    SELECTED_DAY_WORD: 'SELECTED_DAY_WORD' as const,
    SELECTED_LEVEL: 'SELECTED_LEVEL' as const,
    /** Pool of words for word-of-the-day (1 drawn per day, 24h TTL). */
    WORDS_DAILY: 'WORDS_DAILY' as const,
    /** Cycling word pool for wordsRain. */
    WORDS_RAIN: 'WORDS_RAIN' as const,
    /** Persistent queue for wordFinder (drawn N per session, background-refetched when low). */
    WORDS_FINDER: 'WORDS_FINDER' as const,
    /** Persistent queue for spellTower (drawn N per session, background-refetched when low). */
    WORDS_TOWER: 'WORDS_TOWER' as const,
    /** Persistent queue for accentFixer (drawn N per session, background-refetched when low). */
    WORDS_ACCENT: 'WORDS_ACCENT' as const,
    LOCALE: 'LOCALE' as const,
    /** Tracks which level+locale combinations are already populated in IndexedDB. */
    LEVELS_POPULATED: 'LEVELS_POPULATED' as const,

    setItem<T>(key: StorageKey, value: T, expireIn?: number): void {
        if (!isBrowser()) return;
        Logger.log(`Setting localStorage key: ${key}`, value);
        try {
            const item: StoredItem<T> = {
                value,
                timestamp: new Date().getTime(),
                expireIn,
            };
            const serializedValue = JSON.stringify(item);
            localStorage.setItem(key, serializedValue);
        } catch (error) {
            Logger.error('Error storing data:', error);
        }
    },

    getItem<T = unknown>(key: StorageKey): T | null {
        if (!isBrowser()) return null;
        Logger.info('Getting from localStorage the key:', key);
        try {
            const serializedItem = localStorage.getItem(key);
            if (!serializedItem) return null;

            const { value, timestamp, expireIn } = JSON.parse(serializedItem) as StoredItem<T>;
            const now = new Date().getTime();

            if (expireIn && now - timestamp > expireIn) {
                this.removeItem(key);
                return null;
            }

            return value;
        } catch (error) {
            Logger.error('Error retrieving data:', error);
            return null;
        }
    },

    removeItem(key: StorageKey): void {
        if (!isBrowser()) return;
        Logger.info('Removing localStorage key:', key);
        try {
            localStorage.removeItem(key);
        } catch (error) {
            Logger.error('Error removing data:', error);
        }
    },

    clearStorage(): void {
        if (!isBrowser()) return;
        Logger.info('Clearing localStorage');
        try {
            localStorage.clear();
        } catch (error) {
            Logger.error('Error clearing storage:', error);
        }
    },
};

export default StorageService;
