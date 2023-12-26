import { AccentedVowels, NonAccentedVowels } from '@config/AccentRules';
import { ChangeRule } from '@models/types';

class WordGameProcessor {
    private changeRules: ChangeRule[] = [];
    private exclusions: string[] = [];

    setChangeRules(rules: ChangeRule[]): void {
        this.changeRules = rules;
    }

    setExclusions(exclusions: string[]): void {
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

        if (word === wordVariant2) {
            return [word, wordVariant1];
        }

        return [word, wordVariant1, wordVariant2];
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
