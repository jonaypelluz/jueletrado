import Logger from 'src/services/Logger';

export type StorageKey =
    | 'DAY_WORD_SELECTED'
    | 'WORDS_GROUP_20'
    | 'WORDS_GROUP_40'
    | 'WORDS_GROUP_60'
    | 'WORDS_GROUP_80';

type StoredItem<T> = {
    value: T;
    timestamp: number;
    expireIn?: number;
};

const StorageService = {
    DAY_WORD_SELECTED: 'DAY_WORD_SELECTED' as const,
    WORDS_GROUP_20: 'WORDS_GROUP_20' as const,
    WORDS_GROUP_40: 'WORDS_GROUP_40' as const,
    WORDS_GROUP_60: 'WORDS_GROUP_60' as const,
    WORDS_GROUP_80: 'WORDS_GROUP_80' as const,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setItem<T>(key: StorageKey, value: T, expireIn?: number): void {
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
        Logger.info('Removing localStorage key:', key);
        try {
            localStorage.removeItem(key);
        } catch (error) {
            Logger.error('Error removing data:', error);
        }
    },

    clearStorage(): void {
        Logger.info('Clearing localStorage');
        try {
            localStorage.clear();
        } catch (error) {
            Logger.error('Error clearing storage:', error);
        }
    },
};

export default StorageService;
