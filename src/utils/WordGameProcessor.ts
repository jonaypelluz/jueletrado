import { ChangeRule } from 'src/models/types';

class WordGameProcessor {
    private changeRules: ChangeRule[];
    private exclusions: string[];

    constructor(changeRules: ChangeRule[], exclusions: string[] = []) {
        this.changeRules = changeRules;
        this.exclusions = exclusions;
    }

    processWord(word: string): string[] {
        const applicableRules = this.changeRules.filter((rule) => {
            const key = Object.keys(rule)[0];

            const hasExclusion = this.exclusions.some((exclusion) => word.includes(exclusion));
            if (hasExclusion) {
                return false;
            }

            return word.includes(key);
        });

        if (applicableRules.length === 0) {
            return [word];
        }

        const randomRule = applicableRules[Math.floor(Math.random() * applicableRules.length)];
        const [search, [replace1, replace2]] = Object.entries(randomRule)[0];

        const wordVariant1 = word.replace(search, replace1);
        const wordVariant2 = word.replace(search, replace2);

        return [word, wordVariant1, wordVariant2];
    }
}

export default WordGameProcessor;
