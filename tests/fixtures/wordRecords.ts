import { Level, WordRecord } from '@models/types';
import { deriveWordRecord } from '@utils/WordRecord';

type RecordOptions = {
    locale?: string;
    freqRank?: number | null;
    lists?: Level[];
    senses?: { type: string }[];
    wordSet?: Set<string>;
};

/** A real WordRecord for tests, derived the same way the generator and the client hydrator do. */
export const recordFor = (word: string, { locale = 'es', freqRank = null, lists = ['beginner'], senses, wordSet = new Set() }: RecordOptions = {}): WordRecord =>
    deriveWordRecord({ word, locale, freqRank, lists, senses, wordSet });

/** A hand-built WordRecord for storage tests that must not depend on deriveWordRecord. */
export const plainRecord = (word: string, overrides: Partial<WordRecord> = {}): WordRecord => ({
    word,
    locale: 'es',
    level: 'beginner',
    levels: ['beginner'],
    freqRank: null,
    length: word.length,
    syllables: null,
    stressedSyllable: null,
    firstLetter: word[0],
    lastLetter: word[word.length - 1],
    letters: Array.from(word).sort().join(''),
    pos: null,
    senseCount: 0,
    source: null,
    hasAccent: 0,
    hasEnye: 0,
    hasDieresis: 0,
    hasTl: 0,
    hasDiphthong: 0,
    hasHiatus: 0,
    isPlural: 0,
    isVerbForm: 0,
    isProperNoun: 0,
    ...overrides,
});
