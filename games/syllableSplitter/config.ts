import { WordFilter } from '@models/types';

export const CHALLENGE_COUNT = 10;

/** Length window of the prefetched syllable queue per level. */
export const SYLLABLE_WINDOW: Record<string, { minLen: number; maxLen: number }> = {
    beginner: { minLen: 4, maxLen: 6 },
    intermediate: { minLen: 5, maxLen: 8 },
    // Capped so the tile row fits the game area (see styles/SyllableSplitter.scss).
    advanced: { minLen: 6, maxLen: 12 },
};

/**
 * Words playable at each level: the window, two or more syllables and no `tl` (the RAE accepts both
 * a-tle-ta and at-le-ta; the game targets Spain, so `tl` words are skipped).
 */
export const SYLLABLE_QUERY: Record<string, WordFilter> = Object.fromEntries(
    Object.entries(SYLLABLE_WINDOW).map(([level, window]) => [level, { ...window, exclude: { hasTl: true }, minSyllables: 2 }]),
);

const SPANISH_LETTERS = /^[a-záéíóúüñ]+$/;
// RAE splits these by prefix (sub-lu-nar, sub-ra-yar, ab-ro-gar, ab-rup-to), which syllabify does not model.
const PREFIX_WORDS = /^(sub[lr]|abrog|abrup)/;
// Loanword `y` before a consonant (cyclocross, boyscout) or after a final consonant (penalty)
// does not follow the Spanish `y` rule.
const LOANWORD_Y = /y[^aeiouáéíóú]|[^aeiouáéíóúü]y$/;

/** True when the word can be played on top of SYLLABLE_QUERY: Spanish letters only, no known exceptions. */
export const isPlayable = (word: string): boolean => SPANISH_LETTERS.test(word) && !PREFIX_WORDS.test(word) && !LOANWORD_Y.test(word);
