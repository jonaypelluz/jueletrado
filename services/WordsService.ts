import LevelsConfig from '@config/LevelConfig';
import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
import StorageService from '@store/StorageService';

type SetErrorFunction = (error: Error | null) => void;
type SetLoadingProgressFunction = (progress: number) => void;

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

const loadDefinition = async (letter: string, locale: string) => {
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

        setLoadingProgress(0);
        StorageService.clearStorage();
        StorageService.setItem(StorageService.LOCALE, locale);

        const totalChunks = levelConfig.totalChunks[locale];
        const chunkSize = 100000;
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
            const words = await loadWords(levelConfig.level, start, end, locale);

            await dbService.addWords(
                levelConfig.level,
                locale,
                words,
                levelConfig.minimumPopulatedCount,
            );
            loadedChunks.push(i);
            StorageService.setItem(StorageService.LOADED_CHUNKS, loadedChunks);

            setLoadingProgress(((i + 1) / totalChunks) * 100);
        }

        const minimumPopulatedCount = levelConfig.minimumPopulatedCount[locale];

        return await dbService.checkIfPopulated(levelConfig.level, locale, minimumPopulatedCount);
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

export { populateWordsDB, getWords, getAllWords, deleteWordsDB, loadWords, loadDefinition };
