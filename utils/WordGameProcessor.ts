import { AccentedVowels, NonAccentedVowels } from '@config/AccentRules';
import createChangeRules from '@config/ChangeRules';
import { ChangeRule } from '@models/types';

class WordGameProcessor {
    private changeRules: ChangeRule[];
    private wordSet: Set<string>;
    private locale: string;

    constructor(locale: string, wordSet: Set<string> = new Set()) {
        this.changeRules = createChangeRules(locale);
        this.wordSet = wordSet;
        this.locale = locale;
    }

    private isValidWord(word: string): boolean {
        if (this.wordSet.size === 0) return false;
        return this.wordSet.has(word.toLowerCase());
    }

    private applyRule(word: string, rule: ChangeRule): string | null {
        const [search, replace] = Object.entries(rule)[0];
        const variant = word.replace(new RegExp(search), replace);
        if (variant === word || this.isValidWord(variant)) return null;
        return variant;
    }

    processWord(word: string): string[] {
        const applicableRules = this.changeRules.filter((rule) => {
            const key = Object.keys(rule)[0];
            return new RegExp(key).test(word);
        });

        if (applicableRules.length === 0) return [word];

        if (applicableRules.length === 1) {
            const variant = this.applyRule(word, applicableRules[0]);
            return variant ? [word, variant] : [word];
        }

        const variants: string[] = [];
        const shuffled = [...applicableRules].sort(() => Math.random() - 0.5);

        for (const rule of shuffled) {
            if (variants.length >= 2) break;
            const variant = this.applyRule(word, rule);
            if (variant && !variants.includes(variant)) variants.push(variant);
        }

        return [word, ...variants];
    }

    processWordWithAccent(word: string): string[] {
        // English has no accent marks — no variants to generate
        if (this.locale === 'en') return [word];

        let wordVariant1 = '';
        let wordVariant2 = '';
        let randomVariant = { index: -1, variant: '' };

        const vowels = [...Object.keys(AccentedVowels), ...Object.keys(NonAccentedVowels)];
        let vowelIndices = this.getAllVowelIndices(word, vowels);

        if (vowelIndices.length === 1) {
            wordVariant1 = this.replaceFirstVowelWithAccent(word);
            if (this.isValidWord(wordVariant1)) return [word];
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

        if (this.isValidWord(wordVariant1)) wordVariant1 = '';

        if (wordVariant1 !== '') {
            randomVariant = this.addRandomAccent(wordVariant1, vowelIndices);
            wordVariant2 = this.isValidWord(randomVariant.variant) ? '' : randomVariant.variant;
        } else {
            randomVariant = this.addRandomAccent(word, vowelIndices);
            if (!this.isValidWord(randomVariant.variant)) {
                wordVariant1 = randomVariant.variant;
            }
            vowelIndices = vowelIndices.filter(
                (v, i, self) => v !== randomVariant.index || self.indexOf(v) !== i,
            );
            if (wordVariant1 !== '' && vowelIndices.length > 0) {
                randomVariant = this.addRandomAccent(word, vowelIndices);
                if (!this.isValidWord(randomVariant.variant)) {
                    wordVariant2 = randomVariant.variant;
                }
            }
        }

        if (wordVariant1 === '') return [word];
        if (word === wordVariant2 || wordVariant2 === '') return [word, wordVariant1];
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
