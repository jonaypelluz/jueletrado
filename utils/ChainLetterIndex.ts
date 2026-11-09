export const MIN_WORD_LENGTH = 3;
/** A letter with fewer words starting by it than this cannot continue the chain. */
export const DEAD_END_THRESHOLD = 50;

export type RejectionReason = 'wrong-letter' | 'too-short' | 'not-in-dictionary' | 'repeated' | 'dead-end';

export type ChainValidation = { ok: true; word: string } | { ok: false; reason: RejectionReason };

export type ChainContext = {
    /** Letter the word must start with, any case or accent. */
    requiredLetter: string;
    wordSet: ReadonlySet<string>;
    /** The chain so far, seed included. */
    used: readonly string[];
    index: ReadonlyMap<string, number>;
};

/** Lowercases and strips accents (á -> a, ü -> u) but keeps ñ as its own letter. */
export const normalizeChainLetter = (char: string): string => {
    const lower = char.normalize('NFC').toLowerCase();
    if (lower === 'ñ') return lower;
    return lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

export const firstChar = (word: string): string | undefined => [...word][0];

export const lastChar = (word: string): string | undefined => [...word].at(-1);

/** Counts words of at least MIN_WORD_LENGTH code points by their normalized first letter. */
export const buildFirstLetterIndex = (words: Iterable<string>): Map<string, number> => {
    const index = new Map<string, number>();
    for (const word of words) {
        const chars = [...word];
        if (chars.length < MIN_WORD_LENGTH) continue;
        const letter = normalizeChainLetter(chars[0]);
        index.set(letter, (index.get(letter) ?? 0) + 1);
    }
    return index;
};

export const isDeadEndLetter = (letter: string, index: ReadonlyMap<string, number>): boolean =>
    (index.get(normalizeChainLetter(letter)) ?? 0) < DEAD_END_THRESHOLD;

/** Checks a submitted word against the chain rules, first failing rule wins. */
export const validateChainWord = (raw: string, ctx: ChainContext): ChainValidation => {
    const word = raw.normalize('NFC').trim().toLowerCase();

    if (normalizeChainLetter(firstChar(word) ?? '') !== normalizeChainLetter(ctx.requiredLetter)) {
        return { ok: false, reason: 'wrong-letter' };
    }
    if ([...word].length < MIN_WORD_LENGTH) return { ok: false, reason: 'too-short' };
    if (!ctx.wordSet.has(word)) return { ok: false, reason: 'not-in-dictionary' };
    if (ctx.used.includes(word)) return { ok: false, reason: 'repeated' };
    if (isDeadEndLetter(lastChar(word) ?? '', ctx.index)) return { ok: false, reason: 'dead-end' };

    return { ok: true, word };
};
