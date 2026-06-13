import { AccentedVowels } from '@config/AccentRules';

export type AccentChallenge = {
    original: string;
    displayed: string;
    accentIndex: number;
    vowelIndices: number[];
};

const VOWELS = ['a', 'e', 'i', 'o', 'u'];

export function stripAccents(word: string): string {
    return word
        .split('')
        .map((char) => AccentedVowels[char] ?? char)
        .join('');
}

export function buildChallenge(word: string, fullWordSet: Set<string>): AccentChallenge | null {
    const displayed = stripAccents(word);

    let accentIndex = -1;
    for (let i = 0; i < word.length; i++) {
        if (AccentedVowels[word[i]]) {
            if (accentIndex !== -1) return null;
            accentIndex = i;
        }
    }

    if (accentIndex !== -1 && fullWordSet.has(displayed.toLowerCase())) return null;

    const vowelIndices: number[] = [];
    for (let i = 0; i < displayed.length; i++) {
        if (VOWELS.includes(displayed[i].toLowerCase())) {
            vowelIndices.push(i);
        }
    }

    if (vowelIndices.length < 2) return null;

    return { original: word, displayed, accentIndex, vowelIndices };
}
