import WordGameProcessor from 'src/utils/WordGameProcessor';

export const useWordProcessor = () => {
    const processor = new WordGameProcessor();

    const processWords = (words: string[]) => {
        return words.map((word) => processor.processWord(word));
    };

    const processWordsWithAccents = (words: string[]) => {
        return words.map((word) => processor.processWordWithAccent(word));
    };

    const processLastWords = (words: string[][]) => {
        const processedWords = [];

        for (const wordArray of words) {
            if (wordArray.length === 1) {
                const processedVariants = processor.processWordWithAccent(wordArray[0]);
                processedWords.push(processedVariants);
            } else {
                processedWords.push(wordArray);
            }
        }

        return processedWords;
    };

    return { processWords, processWordsWithAccents, processLastWords };
};
