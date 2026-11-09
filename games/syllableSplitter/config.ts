import { syllabify } from '@utils/SyllableSplitter';

export const CHALLENGE_COUNT = 10;

export const LEVEL_FETCH_OPTIONS: Record<string, { minLength: number; maxLength?: number }> = {
    beginner: { minLength: 4, maxLength: 6 },
    intermediate: { minLength: 5, maxLength: 8 },
    // Capped so the tile row fits the game area (see styles/SyllableSplitter.scss).
    advanced: { minLength: 6, maxLength: 12 },
};

const SPANISH_LETTERS = /^[a-záéíóúüñ]+$/;
// RAE splits these by prefix (sub-lu-nar, sub-ra-yar, ab-ro-gar, ab-rup-to), which syllabify does not model.
const PREFIX_WORDS = /^(sub[lr]|abrog|abrup)/;
// Loanword `y` before a consonant (cyclocross, boyscout) or after a final consonant (penalty)
// does not follow the Spanish `y` rule.
const LOANWORD_Y = /y[^aeiouáéíóú]|[^aeiouáéíóúü]y$/;
// The RAE accepts both a-tle-ta and at-le-ta; the game targets Spain, so `tl` words are skipped.
const TL_CLUSTER = /tl/;

/**
 * True when the word can be played: within the level's length limits (the prefetched queue has no
 * maximum), Spanish letters only, two or more syllables, no known exceptions.
 */
export const isEligible = (word: string, { minLength, maxLength }: { minLength: number; maxLength?: number }): boolean =>
    word.length >= minLength &&
    (maxLength === undefined || word.length <= maxLength) &&
    SPANISH_LETTERS.test(word) &&
    !PREFIX_WORDS.test(word) &&
    !LOANWORD_Y.test(word) &&
    !TL_CLUSTER.test(word) &&
    syllabify(word).length >= 2;
