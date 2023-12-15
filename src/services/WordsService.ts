import { dbService } from 'src/services/DBService';
import Logger from 'src/services/Logger';
import StorageService from 'src/store/StorageService';

type SetErrorFunction = (error: Error | null) => void;
type SetLoadingProgressFunction = (progress: number) => void;

const populateWordsDB = async (
    setError: SetErrorFunction,
    setLoadingProgress: SetLoadingProgressFunction,
): Promise<boolean> => {
    try {
        await dbService.initDB();

        const isAlreadyPopulated = await dbService.checkIfPopulated();
        if (isAlreadyPopulated) {
            Logger.log('Database is already populated.');
            return true;
        }

        const totalChunks = 7;
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

            const words: string[] = await import(
                `src/data/words_from_${start}_to_${end}.json`
            ).then((module) => module.default);

            await dbService.addWords(words);
            loadedChunks.push(i);
            StorageService.setItem(StorageService.LOADED_CHUNKS, loadedChunks);

            setLoadingProgress(((i + 1) / totalChunks) * 100);
        }

        return await dbService.checkIfPopulated();
    } catch (error) {
        Logger.error('Error loading words:', error);
        setError(error as Error);
        return false;
    }
};

const getGameWords = async (
    count: number,
    setError: SetErrorFunction,
): Promise<string[] | undefined> => {
    try {
        await dbService.initDB();

        const words = await dbService.getRandomWords(count);

        return words;
    } catch (error) {
        Logger.error('Error retrieving game words:', error);
        setError(error as Error);
    }
};

export { populateWordsDB, getGameWords };
