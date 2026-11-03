export type SyllableChallenge = {
    word: string;
    syllables: string[];
    dividers: number[];
};

type VowelStrength = 'strong' | 'weak' | 'accentedWeak';

type Token =
    | { kind: 'consonant'; text: string }
    | { kind: 'vowel'; text: string; strength: VowelStrength; base: string };

type VowelToken = Extract<Token, { kind: 'vowel' }>;

/** A nucleus spans token indices [start, end] (inclusive); a transparent `h` may sit inside it. */
type Nucleus = { start: number; end: number; hasStrong: boolean };

const DIGRAPHS = new Set(['ch', 'll', 'rr']);
const SILENT_U_FOLLOWERS = new Set(['e', 'é', 'i', 'í']);
const STRONG_VOWELS = new Set(['a', 'e', 'o', 'á', 'é', 'ó']);
const WEAK_VOWELS: Record<string, string> = { i: 'i', u: 'u', ü: 'u' };
const ACCENTED_WEAK_VOWELS: Record<string, string> = { í: 'i', ú: 'u' };

// `tl` is treated as an onset cluster (a-tle-ta, a-tlán-ti-co): documented choice following the
// American and Canarian pronunciation accepted by the RAE, instead of the alternative at-le-ta.
const ONSET_CLUSTERS = new Set([
    'pl', 'bl', 'cl', 'gl', 'fl', 'kl',
    'pr', 'br', 'tr', 'dr', 'cr', 'gr', 'fr', 'kr',
    'tl',
]);

// Out of scope: prefix/morphological boundaries are not modelled, so words such as subrayar
// (su-bra-yar instead of sub-ra-yar) or desamparar (de-sam-pa-rar instead of des-am-pa-rar) get the
// purely phonological split. The game's eligibility filter excludes the known problematic prefixes.

const vowelToken = (char: string): VowelToken | null => {
    if (STRONG_VOWELS.has(char)) return { kind: 'vowel', text: char, strength: 'strong', base: char };
    if (WEAK_VOWELS[char]) return { kind: 'vowel', text: char, strength: 'weak', base: WEAK_VOWELS[char] };
    if (ACCENTED_WEAK_VOWELS[char]) {
        return { kind: 'vowel', text: char, strength: 'accentedWeak', base: ACCENTED_WEAK_VOWELS[char] };
    }
    return null;
};

/** Splits the word into consonant / vowel units, each keeping its exact source text. */
const tokenize = (word: string): Token[] => {
    const tokens: Token[] = [];
    let i = 0;

    while (i < word.length) {
        const char = word[i];
        const pair = word.slice(i, i + 2);

        if (DIGRAPHS.has(pair) || ((pair === 'qu' || pair === 'gu') && SILENT_U_FOLLOWERS.has(word[i + 2]))) {
            tokens.push({ kind: 'consonant', text: pair });
            i += 2;
            continue;
        }

        const previous = tokens[tokens.length - 1];
        const vowel =
            char === 'y'
                ? i === word.length - 1 && previous?.kind === 'vowel'
                    ? { kind: 'vowel' as const, text: char, strength: 'weak' as const, base: 'i' }
                    : null
                : vowelToken(char);

        tokens.push(vowel ?? { kind: 'consonant', text: char });
        i += 1;
    }

    return tokens;
};

const isWeak = (vowel: VowelToken): boolean => vowel.strength !== 'strong';

/** Pair rule: true when two adjacent vowels belong to the same syllable. */
const joins = (left: VowelToken, right: VowelToken): boolean => {
    if (isWeak(left) && isWeak(right)) return left.base !== right.base;
    if (!isWeak(left) && !isWeak(right)) return false;
    return left.strength !== 'accentedWeak' && right.strength !== 'accentedWeak';
};

/** Index of the vowel adjacent to the one at `index`, looking through a single `h`; -1 if none. */
const nextVowelIndex = (tokens: Token[], index: number): number => {
    const next = tokens[index + 1];
    if (next?.kind === 'vowel') return index + 1;
    if (next?.text === 'h' && tokens[index + 2]?.kind === 'vowel') return index + 2;
    return -1;
};

/**
 * True when the vowel at `index` is reached through an `h` and itself joins the vowel right after
 * it: the `h` is then the onset of that diphthong (ca-ca-hue-te, vi-hue-la), not transparent.
 */
const startsDiphthongAfterH = (tokens: Token[], from: number, index: number): boolean => {
    const after = tokens[index + 1];
    return (
        index === from + 2 &&
        after?.kind === 'vowel' &&
        joins(tokens[index] as VowelToken, after)
    );
};

/**
 * Greedy left-to-right grouping of vowels into nuclei, with at most one strong vowel per nucleus.
 * A weak vowel between two strong vowels stays with the preceding one: paranoia → pa-ra-noi-a
 * (documented choice; pa-ra-no-ia is the alternative).
 */
const groupNuclei = (tokens: Token[]): Nucleus[] => {
    const nuclei: Nucleus[] = [];
    let i = 0;

    while (i < tokens.length) {
        const token = tokens[i];
        if (token.kind !== 'vowel') {
            i += 1;
            continue;
        }

        const nucleus: Nucleus = { start: i, end: i, hasStrong: !isWeak(token) };
        let last = token;
        let nextIndex = nextVowelIndex(tokens, i);

        while (nextIndex !== -1) {
            const candidate = tokens[nextIndex] as VowelToken;
            if (!joins(last, candidate) || (nucleus.hasStrong && !isWeak(candidate))) break;
            if (startsDiphthongAfterH(tokens, nucleus.end, nextIndex)) break;
            nucleus.end = nextIndex;
            nucleus.hasStrong ||= !isWeak(candidate);
            last = candidate;
            nextIndex = nextVowelIndex(tokens, nextIndex);
        }

        nuclei.push(nucleus);
        i = nucleus.end + 1;
    }

    return nuclei;
};

const isOnsetCluster = (first: Token, second: Token): boolean =>
    first.text.length === 1 && second.text.length === 1 && ONSET_CLUSTERS.has(first.text + second.text);

/** Token index where the syllable after `left` starts, given the consonants between two nuclei. */
const boundaryBetween = (tokens: Token[], left: Nucleus, right: Nucleus): number => {
    const consonantCount = right.start - left.end - 1;
    if (consonantCount <= 1) return left.end + 1;
    if (isOnsetCluster(tokens[right.start - 2], tokens[right.start - 1])) return right.start - 2;
    return right.start - 1;
};

/** Splits a lowercase NFC Spanish word into syllables. Pure, never throws; `''` → `[]`. */
export function syllabify(word: string): string[] {
    if (word === '') return [];

    const tokens = tokenize(word);
    const nuclei = groupNuclei(tokens);
    if (nuclei.length === 0) return [word];

    const starts = [0, ...nuclei.slice(1).map((nucleus, k) => boundaryBetween(tokens, nuclei[k], nucleus))];

    return starts.map((start, k) =>
        tokens
            .slice(start, starts[k + 1] ?? tokens.length)
            .map((token) => token.text)
            .join(''),
    );
}

/** Divider index i sits between word[i-1] and word[i]: cumulative syllable lengths minus the last. */
export function dividerPositions(word: string): number[] {
    const positions: number[] = [];
    let offset = 0;
    for (const syllable of syllabify(word).slice(0, -1)) {
        offset += syllable.length;
        positions.push(offset);
    }
    return positions;
}
