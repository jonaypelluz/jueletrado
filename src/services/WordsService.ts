import LevelsConfig from '@config/LevelConfig';
import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
import StorageService from '@store/StorageService';

type SetErrorFunction = (error: Error | null) => void;
type SetLoadingProgressFunction = (progress: number) => void;

async function loadWords(level: string, start: number, end: number) {
    try {
        const response = await fetch(`/words/${level}_words_from_${start}_to_${end}.json`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        Logger.error('Error fetching words:', error);
    }
}

const populateWordsDB = async (
    level: string | null,
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
        dbService.setStoreName(levelConfig.level);
        await dbService.initDB();

        setLoadingProgress(0);
        StorageService.clearStorage();

        const totalChunks = levelConfig.totalChunks;
        const chunkSize = levelConfig.chunkSize;
        for (let i = 0; i < totalChunks; i++) {
            const loadedChunks =
                StorageService.getItem<number[]>(StorageService.LOADED_CHUNKS) || [];

            if (loadedChunks.includes(i)) {
                const errorMessage = `Error: Chunk ${i} is already loaded.`;
                Logger.error(errorMessage);
                throw new Error(errorMessage);
            }

            const start = i * chunkSize + 1;
            const end = (i + 1) * chunkSize;
            const words = await loadWords(levelConfig.level, start, end);

            await dbService.addWords(levelConfig.level, words, levelConfig.minimumPopulatedCount);
            loadedChunks.push(i);
            StorageService.setItem(StorageService.LOADED_CHUNKS, loadedChunks);

            setLoadingProgress(((i + 1) / totalChunks) * 100);
        }

        return await dbService.checkIfPopulated(
            levelConfig.level,
            levelConfig.minimumPopulatedCount,
        );
    } catch (error) {
        Logger.error('Error loading words:', error);
        setError(error as Error);
        return false;
    }
};

const getAllWords = async (
    level: string | null,
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
        dbService.setStoreName(levelConfig.level);
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
    count: number,
    setError: SetErrorFunction,
    maxLength: number | null = null,
): Promise<string[] | undefined> => {
    const levelConfig = LevelsConfig.find((config) => config.level === level);
    if (!levelConfig) {
        const errorMsg = 'Invalid level specified';
        Logger.error(errorMsg);
        setError(new Error(errorMsg));
        return;
    }

    try {
        dbService.setStoreName(levelConfig.level);
        await dbService.initDB();

        let words;
        if (maxLength !== null) {
            words = await dbService.getRandomWordsWithMaxLength(count, maxLength);
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

export { populateWordsDB, getWords, getAllWords, deleteWordsDB };
