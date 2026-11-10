import { AccentedVowels } from '../config/AccentRules';
import { LEVEL_BANDS } from '../config/LevelConfig';
import { Level, WordChunk, WordFlagName, WordRecord, WordRow } from '../models/types';
import { syllabify, vowelFeatures } from './SyllableSplitter';

export type DefinitionSense = { type?: string };

export type DeriveWordRecordInput = {
    word: string;
    locale: string;
    freqRank: number | null;
    lists: readonly Level[];
    senses?: readonly DefinitionSense[] | null;
    wordSet?: ReadonlySet<string>;
};

const LEVEL_ORDER: readonly Level[] = ['beginner', 'intermediate', 'advanced'];

/** Bit of each level in the chunk `levels` mask. */
const LEVEL_BITS: Record<Level, number> = { beginner: 1, intermediate: 2, advanced: 4 };

/** Bit i of the chunk `flags` mask is WORD_FLAGS[i]. */
export const WORD_FLAGS: readonly WordFlagName[] = [
    'hasAccent',
    'hasEnye',
    'hasDieresis',
    'hasTl',
    'hasDiphthong',
    'hasHiatus',
    'isPlural',
    'isVerbForm',
];

export const WORD_CHUNK_VERSION = 2;

export const WORD_CHUNK_FIELDS: readonly string[] = ['word', 'freqRank', 'levels', 'flags', 'syllables', 'stressedSyllable', 'pos', 'senseCount', 'source'];

const ACUTE_ACCENT = /[áéíóú]/;
const PENULTIMATE_STRESS_ENDING = /[aeiouns]$/;

// Approximate morphology checks against the locale word set (not used by any game yet).
const sOrEsStems = (word: string): string[] => (word.endsWith('s') ? [word.slice(0, -1), ...(word.endsWith('es') ? [word.slice(0, -2)] : [])] : []);
const PLURAL_STEMS: Record<string, (word: string) => string[]> = { es: sOrEsStems, en: sOrEsStems };
const VERB_FORM_STEMS: Record<string, (word: string) => string[]> = {
    es: (word) => {
        const match = /^(.+?)(ando|ado|iendo|yendo|ido)$/.exec(word);
        if (!match) return [];
        const [, stem, ending] = match;
        return ending === 'ando' || ending === 'ado' ? [`${stem}ar`] : [`${stem}er`, `${stem}ir`];
    },
    en: (word) => {
        const match = /^(.+?)(ing|ed)$/.exec(word);
        return match ? [match[1], `${match[1]}e`] : [];
    },
};

const flag = (value: boolean): 0 | 1 => (value ? 1 : 0);

/** Lowercase edge letter with the accent stripped (ü → u); ñ is kept. */
export const baseLetter = (char: string): string => {
    const lower = char.toLowerCase();
    return AccentedVowels[lower] ?? (lower === 'ü' ? 'u' : lower);
};

/**
 * Level from frequency: rank within the locale bands (LEVEL_BANDS). An unranked word keeps the
 * lowest source list that contains it; unranked and in no list → advanced.
 */
export const computeLevel = (freqRank: number | null, lists: readonly Level[], locale: string): Level => {
    if (freqRank !== null) {
        const bands = LEVEL_BANDS[locale];
        if (!bands) throw new Error(`No level bands for locale ${locale}`);
        if (freqRank <= bands.beginner) return 'beginner';
        return freqRank <= bands.intermediate ? 'intermediate' : 'advanced';
    }
    return LEVEL_ORDER.find((level) => lists.includes(level)) ?? 'advanced';
};

/** 0-based stressed syllable: the one with an acute accent; else vowel/n/s ending → penultimate, else last. */
export const stressedSyllableIndex = (syllables: readonly string[]): number => {
    const accented = syllables.findIndex((syllable) => ACUTE_ACCENT.test(syllable));
    if (accented !== -1) return accented;
    if (syllables.length <= 1) return 0;
    return PENULTIMATE_STRESS_ENDING.test(syllables[syllables.length - 1]) ? syllables.length - 2 : syllables.length - 1;
};

/** Pool membership: the computed level for a ranked word, every source list for an unranked one. */
const levelsFor = (freqRank: number | null, lists: readonly Level[], level: Level): Level[] =>
    freqRank === null && lists.length > 0 ? LEVEL_ORDER.filter((l) => lists.includes(l)) : [level];

/** Fields recomputed from the word itself, never stored in a chunk row. */
const derivedFields = (word: string, locale: string, freqRank: number | null, levels: readonly Level[]) => {
    const chars = Array.from(word);
    return {
        word,
        locale,
        level: computeLevel(freqRank, levels, locale),
        length: word.length,
        firstLetter: baseLetter(chars[0] ?? ''),
        lastLetter: baseLetter(chars[chars.length - 1] ?? ''),
        letters: [...chars].sort().join(''),
    };
};

export const deriveWordRecord = ({ word, locale, freqRank, lists, senses, wordSet = new Set() }: DeriveWordRecordInput): WordRecord => {
    const level = computeLevel(freqRank, lists, locale);
    const levels = levelsFor(freqRank, lists, level);
    const isSpanish = locale === 'es';
    const syllables = isSpanish ? syllabify(word) : null;
    const { hasDiphthong, hasHiatus } = isSpanish ? vowelFeatures(word) : { hasDiphthong: 0 as const, hasHiatus: 0 as const };
    const senseCount = senses?.length ?? 0;
    const inWordSet = (stems: string[]) => stems.some((stem) => wordSet.has(stem));

    return {
        ...derivedFields(word, locale, freqRank, levels),
        levels,
        freqRank,
        syllables: syllables ? syllables.length : null,
        stressedSyllable: syllables ? stressedSyllableIndex(syllables) : null,
        pos: senses?.[0]?.type ?? null,
        senseCount,
        source: isSpanish && senseCount > 0 ? 'rae' : null,
        hasAccent: flag(ACUTE_ACCENT.test(word)),
        hasEnye: flag(word.includes('ñ')),
        hasDieresis: flag(word.includes('ü')),
        hasTl: flag(word.includes('tl')),
        hasDiphthong,
        hasHiatus,
        isPlural: flag(inWordSet(PLURAL_STEMS[locale]?.(word) ?? [])),
        isVerbForm: flag(inWordSet(VERB_FORM_STEMS[locale]?.(word) ?? [])),
    };
};

/** Chunk row in WORD_CHUNK_FIELDS order: levels and flags as bitmasks, trailing null/0 trimmed. */
export const encodeRow = (record: WordRecord): WordRow => {
    const levels = record.levels.reduce((mask, level) => mask | LEVEL_BITS[level], 0);
    const flags = WORD_FLAGS.reduce((mask, name, bit) => mask | (record[name] << bit), 0);
    const row: WordRow = [record.word, record.freqRank, levels, flags, record.syllables, record.stressedSyllable, record.pos, record.senseCount, record.source];
    let end = row.length;
    while (end > 1 && (row[end - 1] === null || row[end - 1] === 0)) end--;
    return row.slice(0, end);
};

/** Levels of a chunk row's `levels` bitmask, in level order. */
export const levelsOfMask = (levelMask: number): Level[] => LEVEL_ORDER.filter((level) => levelMask & LEVEL_BITS[level]);

export const hydrateRow = (row: WordRow, locale: string): WordRecord => {
    const [word, freqRank = null, levelMask = 0, flagMask = 0, syllables = null, stressedSyllable, pos = null, senseCount = 0, source = null] = row as [
        string,
        number | null,
        number,
        number,
        number | null,
        number | null | undefined,
        string | null,
        number,
        'rae' | null,
    ];
    const levels = levelsOfMask(levelMask);
    const flags = Object.fromEntries(WORD_FLAGS.map((name, bit) => [name, flag((flagMask & (1 << bit)) !== 0)])) as Record<WordFlagName, 0 | 1>;

    return {
        ...derivedFields(word, locale, freqRank, levels),
        levels,
        freqRank,
        syllables,
        // A trimmed trailing 0 stress index only exists when the syllable count is known.
        stressedSyllable: stressedSyllable ?? (syllables === null ? null : 0),
        pos,
        senseCount,
        source,
        ...flags,
    };
};

/** Throws unless the chunk is in the served v2 format (version and field order). */
export const assertChunkFormat = (chunk: WordChunk): void => {
    const fieldsMatch = chunk.fields?.length === WORD_CHUNK_FIELDS.length && chunk.fields.every((field, i) => field === WORD_CHUNK_FIELDS[i]);
    if (chunk.version !== WORD_CHUNK_VERSION || !fieldsMatch) throw new Error('Unsupported word chunk format');
};

export const hydrateChunk = (chunk: WordChunk): WordRecord[] => {
    assertChunkFormat(chunk);
    return chunk.rows.map((row) => hydrateRow(row, chunk.locale));
};
