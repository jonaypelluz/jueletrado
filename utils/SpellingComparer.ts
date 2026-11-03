import { AccentedVowels } from '@config/AccentRules';

export type SpellingResult = 'exact' | 'accent-miss' | 'wrong';

export type SpellingHint = {
    length: number;
    firstLetter: string | null;
    lastLetter: string | null;
};

export type SpellingClue = {
    word: string;
    definition: string;
    type: string;
};

// ñ is deliberately absent: n/ñ are different letters, not an accent.
const STRIPPED_VOWELS: Record<string, string> = { ...AccentedVowels, ü: 'u' };

const ENGLISH_TYPE_LABELS = new Set([
    'verb', 'noun', 'adjective', 'adverb', 'preposition',
    'pronoun', 'conjunction', 'interjection', 'determiner', 'article',
]);

const MIN_CLUE_LETTERS = 10;

const normalize = (text: string): string => text.normalize('NFC').trim().toLowerCase();

const stripAccents = (text: string): string =>
    Array.from(text).map((char) => STRIPPED_VOWELS[char] ?? char).join('');

export const compareSpelling = (guess: string, target: string): SpellingResult => {
    const normalizedGuess = normalize(guess);
    const normalizedTarget = normalize(target);
    if (!normalizedGuess) return 'wrong';
    if (normalizedGuess === normalizedTarget) return 'exact';
    if (stripAccents(normalizedGuess) === stripAccents(normalizedTarget)) return 'accent-miss';
    return 'wrong';
};

export const pickHint = (word: string, failedAttempts: number): SpellingHint => {
    const chars = Array.from(word.normalize('NFC'));
    return {
        length: chars.length,
        firstLetter: failedAttempts >= 1 ? chars[0] : null,
        lastLetter: failedAttempts >= 2 ? chars[chars.length - 1] : null,
    };
};

export const revealsWord = (definition: string, word: string): boolean =>
    definition.toLowerCase().includes(word.toLowerCase());

const isEnglishTypeLabel = (type: string): boolean =>
    ENGLISH_TYPE_LABELS.has(type.toLowerCase().match(/\p{L}+/u)?.[0] ?? '');

export const isUsableClue = ({ word, definition, type }: SpellingClue, locale: string): boolean =>
    (definition.match(/\p{L}/gu)?.length ?? 0) >= MIN_CLUE_LETTERS &&
    !revealsWord(definition, word) &&
    (locale !== 'es' || !isEnglishTypeLabel(type));
