import WordGameProcessor from 'src/utils/WordGameProcessor';
import { ChangeRule } from 'src/models/types';

export const useWordProcessor = () => {
    const generateWords = (words: string[], rules: ChangeRule[], exclusions: string[]) => {
        const processor = new WordGameProcessor(rules, exclusions);
        return words.map((word) => processor.processWord(word));
    };

    return { generateWords };
};
