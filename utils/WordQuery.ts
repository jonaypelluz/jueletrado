import { Level, WordFilter, WordFlagName, WordRecord } from '../models/types';

export type DefinitionFileFilter = { minSenses?: number; minLen?: number };

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

/** Entries of a definition file with at least minSenses senses and minLen characters (not UTF-16 units). */
export const filterDefinitions = <T extends { definitions: unknown[] }>(file: Record<string, T>, { minSenses, minLen }: DefinitionFileFilter): Record<string, T> => {
    if (minSenses === undefined && minLen === undefined) return file;
    return Object.fromEntries(
        Object.entries(file).filter(
            ([word, entry]) => (minSenses === undefined || entry.definitions.length >= minSenses) && (minLen === undefined || Array.from(word).length >= minLen),
        ),
    );
};
