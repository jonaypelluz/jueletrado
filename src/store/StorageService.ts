import Logger from 'src/services/Logger';

type StorageKey = 'WORDS_SELECTED' | 'GAME_WORDS_SELECTED' | 'DAY_WORD_SELECTED';

const StorageService = {
    WORDS_SELECTED: 'WORDS_SELECTED' as const,
    GAME_WORDS_SELECTED: 'GAME_WORDS_SELECTED' as const,
    DAY_WORD_SELECTED: 'DAY_WORD_SELECTED' as const,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setItem(key: StorageKey, value: any): void {
        Logger.log(`Setting localStorage key: ${key}`, value);
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
        } catch (error) {
            Logger.error('Error storing data:', error);
        }
    },

    getItem<T = unknown>(key: StorageKey): T | null {
        Logger.info('Getting from localStorage the key:', key);
        try {
            const serializedValue = localStorage.getItem(key);
            return serializedValue ? (JSON.parse(serializedValue) as T) : null;
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
