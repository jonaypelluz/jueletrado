import { dbService } from 'src/services/DBService';
import Logger from 'src/services/Logger';

type SetErrorFunction = (error: Error | null) => void;
type SetLoadingProgressFunction = (progress: number) => void;
type SetLoadingFunction = React.Dispatch<React.SetStateAction<boolean>>;

const LoadWords = async (
    setError: SetErrorFunction,
    setLoadingProgress: SetLoadingProgressFunction,
    setLoading: SetLoadingFunction,
) => {
    setLoading(true);
    try {
        await dbService.initDB();

        const isPopulated = await dbService.checkIfPopulated();
        if (isPopulated) {
            setLoading(false);
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
    } finally {
        setLoading(false);
    }
};

const getGameWords = async (
    count: number,
    setError: SetErrorFunction,
    setLoading: SetLoadingFunction,
): Promise<string[] | undefined> => {
    setLoading(true);
    try {
        await dbService.initDB();

        const words = await dbService.getRandomWords(count);
        return words;
    } catch (error) {
        Logger.error('Error retrieving game words:', error);
        setError(error as Error);
    } finally {
        setLoading(false);
    }
};

const getRandomWord = async (
    setError: SetErrorFunction,
    setLoading: SetLoadingFunction,
): Promise<string | undefined> => {
    setLoading(true);
    try {
        await dbService.initDB();

        const randomWord = await dbService.getRandomWord();
        return randomWord;
    } catch (error) {
        Logger.error('Error retrieving random word:', error);
        setError(error as Error);
    } finally {
        setLoading(false);
    }
};

export { LoadWords, getRandomWord, getGameWords };
