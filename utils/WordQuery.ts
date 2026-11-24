import { Level, WordFilter, WordFlagName, WordRecord } from '../models/types';
import { LEVEL_ORDER } from './WordRecord';

/** level: a Wiktionary entry above this level is dropped (cumulative); RAE entries and an unknown level are unaffected. */
export type DefinitionFileFilter = { minSenses?: number; minLen?: number; level?: string };

/**
 * True when the record passes every option of the filter: level is pool membership (record.levels),
 * minLen/maxLen are inclusive with no implicit minimum, exclude rejects set flags, minSyllables needs
 * a known syllable count.
 */
export const matchesQuery = (record: WordRecord, { level, minLen, maxLen, exclude, minSyllables }: WordFilter): boolean => {
    if (level !== undefined && !record.levels.includes(level as Level)) return false;
    if (minLen !== undefined && record.length < minLen) return false;
    if (maxLen !== undefined && record.length > maxLen) return false;
    if (exclude && (Object.keys(exclude) as WordFlagName[]).some((name) => exclude[name] && record[name] === 1)) return false;
    if (minSyllables !== undefined && (record.syllables === null || record.syllables < minSyllables)) return false;
    return true;
};

/** True when a Wiktionary entry sits above the game level; an RAE entry or an unknown level never is. */
const isAboveLevel = (entry: { level?: string; source?: string }, level: string | undefined): boolean => {
    const max = LEVEL_ORDER.indexOf(level as Level);
    return max !== -1 && entry.source === 'wiktionary' && LEVEL_ORDER.indexOf((entry.level ?? 'advanced') as Level) > max;
};

/** Entries of a definition file with at least minSenses senses and minLen characters (not UTF-16 units), within level. */
export const filterDefinitions = <T extends { definitions: unknown[]; level?: string; source?: string }>(
    file: Record<string, T>,
    { minSenses, minLen, level }: DefinitionFileFilter,
): Record<string, T> => {
    if (minSenses === undefined && minLen === undefined && level === undefined) return file;
    return Object.fromEntries(
        Object.entries(file).filter(
            ([word, entry]) =>
                (minSenses === undefined || entry.definitions.length >= minSenses) &&
                (minLen === undefined || Array.from(word).length >= minLen) &&
                !isAboveLevel(entry, level),
        ),
    );
};
