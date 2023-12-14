import { dbService } from 'src/services/DBService';
import Logger from 'src/services/Logger';

type SetErrorFunction = (error: Error | null) => void;
type SetLoadingProgressFunction = (progress: number) => void;

const populateWordsDB = async (
    setError: SetErrorFunction,
    setLoadingProgress: SetLoadingProgressFunction,
) => {
    try {
        await dbService.initDB();

        const isPopulated = await dbService.checkIfPopulated();
        if (isPopulated) {
            return;
        }

        const totalChunks = 7;
        const chunkSize = 100000;
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize + 1;
            const end = (i + 1) * chunkSize;

            const words: string[] = await import(
                `src/data/words_from_${start}_to_${end}.json`
            ).then((module) => module.default);

            await dbService.addWords(words);

            setLoadingProgress(((i + 1) / totalChunks) * 100);
        }
    } catch (error) {
        Logger.error('Error loading words:', error);
        setError(error as Error);
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
