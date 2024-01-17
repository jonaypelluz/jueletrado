import WordGameProcessor from 'src/utils/WordGameProcessor';

export const useWordProcessor = (locale: string) => {
    const processor = new WordGameProcessor(locale);

    const processWords = (words: string[]) => {
        return words.map((word) => processor.processWord(word));
    };

    const processWordsWithAccents = (words: string[]) => {
        return words.map((word) => processor.processWordWithAccent(word));
    };

    const filterWordsByLetters = (letters: string[], allWords: string[]) => {
        return processor.filterWordsByLetters(letters, allWords);
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

    return { processWords, processWordsWithAccents, processLastWords, filterWordsByLetters };
};
