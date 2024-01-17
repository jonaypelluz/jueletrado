import { AccentedVowels, NonAccentedVowels } from '@config/AccentRules';
import createChangeRules from '@config/ChangeRules';
import { ChangeRule } from '@models/types';
import Logger from '@services/Logger';

class WordGameProcessor {
    private changeRules: ChangeRule[];

    constructor(locale: string) {
        this.changeRules = createChangeRules(locale);
    }

    processWord(word: string): string[] {
        const applicableRules = this.changeRules.filter((rule) => {
            const key = Object.keys(rule)[0];
            const regex = new RegExp(key);
            return regex.test(word);
        });

        if (applicableRules.length === 0) {
            return [word];
        } else if (applicableRules.length === 1) {
            const [search, replace] = Object.entries(applicableRules[0])[0];
            return [word, word.replace(new RegExp(search), replace)];
        } else {
            const variants: string[] = [];

            while (variants.length < Math.min(2, applicableRules.length)) {
                const randomRule =
                    applicableRules[Math.floor(Math.random() * applicableRules.length)];
                const [search, replace] = Object.entries(randomRule)[0];
                const newVariant = word.replace(new RegExp(search), replace);

                if (!variants.includes(newVariant)) {
                    variants.push(newVariant);
                }
            }

            return [word, ...variants];
        }
    }

    processWordWithAccent(word: string): string[] {
        let wordVariant1 = '';
        let wordVariant2 = '';
        let randomVariant = { index: -1, variant: '' };

        const vowels = [...Object.keys(AccentedVowels), ...Object.keys(NonAccentedVowels)];
        let vowelIndices = this.getAllVowelIndices(word, vowels);

        if (vowelIndices.length === 1) {
            wordVariant1 = this.replaceFirstVowelWithAccent(word);
            return [word, wordVariant1];
        }

        const accentedIndex = this.findAccentedVowel(word, Object.keys(NonAccentedVowels));
        vowelIndices = vowelIndices.filter(
            (v, i, self) => v !== accentedIndex || self.indexOf(v) !== i,
        );

        Object.keys(AccentedVowels).forEach((accentedVowel) => {
            if (word.includes(accentedVowel)) {
                const regex = new RegExp(accentedVowel, 'g');
                wordVariant1 = word.replace(regex, AccentedVowels[accentedVowel]);
            }
        });

        if (wordVariant1 !== '') {
            randomVariant = this.addRandomAccent(wordVariant1, vowelIndices);
            wordVariant2 = randomVariant.variant;
        } else {
            randomVariant = this.addRandomAccent(word, vowelIndices);
            wordVariant1 = randomVariant.variant;
            vowelIndices = vowelIndices.filter(
                (v, i, self) => v !== randomVariant.index || self.indexOf(v) !== i,
            );
            if (vowelIndices.length > 0) {
                randomVariant = this.addRandomAccent(word, vowelIndices);
                wordVariant2 = randomVariant.variant;
            }
        }

        if (word === wordVariant2 || wordVariant2 === '') {
            return [word, wordVariant1];
        }

        return [word, wordVariant1, wordVariant2];
    }

    filterWordsByLetters(letters: string[], allWords: string[]): string[] {
        const letterSet = new Set(letters);
        Logger.debug('letterSet', letterSet);
        return allWords.filter((word) => {
            if (word.length <= 1) {
                return false;
            }

            return Array.from(word).every((char) => letterSet.has(char));
        });
    }

    private addRandomAccent(word: string, indices: number[]): { index: number; variant: string } {
        const randomIndex = indices[Math.floor(Math.random() * indices.length)];
        const vowel = word[randomIndex];
        const accentedVowel = NonAccentedVowels[vowel] || vowel;
        const variant =
            word.substring(0, randomIndex) + accentedVowel + word.substring(randomIndex + 1);

        return { index: randomIndex, variant };
    }

    private getAllVowelIndices(word: string, vowels: string[]): number[] {
        const vowelIndices = [];
        for (let i = 0; i < word.length; i++) {
            if (vowels.includes(word[i])) {
                vowelIndices.push(i);
            }
        }
        return vowelIndices;
    }

    private findAccentedVowel(word: string, vowels: string[]): number {
        for (let i = 0; i < word.length; i++) {
            if (vowels.includes(word[i])) {
                return i;
            }
        }
        return -1;
    }

    private replaceFirstVowelWithAccent(word: string): string {
        const firstVowelIndex = word.split('').findIndex((char) => NonAccentedVowels[char]);
        return firstVowelIndex === -1
            ? word
            : word.substring(0, firstVowelIndex) +
                  NonAccentedVowels[word[firstVowelIndex]] +
                  word.substring(firstVowelIndex + 1);
    }
}

export default WordGameProcessor;
