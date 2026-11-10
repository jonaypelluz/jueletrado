import StorageService, { StorageKey } from '@store/StorageService';
import { WordFilter } from '@models/types';

/** Per-game word groups prefetched for a level: how many words and which query (length window). */
export const WORD_GROUP_FETCH_CONFIG: {
    key: StorageKey;
    count: number;
    query: WordFilter;
}[] = [
    // WORDS_DAILY: 7 words, one drawn per day (24h TTL applied when storing the daily word).
    { key: StorageService.WORDS_DAILY, count: 7, query: { minLen: 4 } },
    // WORDS_FINDER: persistent queue, 10 words/session × 6 sessions before refetch.
    { key: StorageService.WORDS_FINDER, count: 60, query: { minLen: 4, maxLen: 9 } },
    // WORDS_TOWER: persistent queue, 15 words/session × 8 sessions before refetch.
    { key: StorageService.WORDS_TOWER, count: 120, query: { minLen: 4 } },
    // WORDS_RAIN: cycling pool, 150 words (looped, not consumed).
    // Oversized — some words lose all invalid variants after dictionary validation.
    { key: StorageService.WORDS_RAIN, count: 150, query: { minLen: 4 } },
    // WORDS_ACCENT: persistent queue, oversized since many words are rejected
    // by the accent-eligibility filter in accentFixer.
    { key: StorageService.WORDS_ACCENT, count: 80, query: { minLen: 4 } },
    // WORDS_MATCHER: persistent queue, oversized since many words match no
    // confusion rule and are rejected by the letterMatcher challenge builder.
    { key: StorageService.WORDS_MATCHER, count: 80, query: { minLen: 4 } },
    // WORDS_SYLLABLE: persistent queue, 10 words/session drawn from 20, ~3 sessions before refetch.
    { key: StorageService.WORDS_SYLLABLE, count: 60, query: { minLen: 4 } },
];

/** The prefetch group of a key; throws when the key has no WORD_GROUP_FETCH_CONFIG entry. */
export const fetchConfig = (key: StorageKey) => {
    const config = WORD_GROUP_FETCH_CONFIG.find((group) => group.key === key);
    if (!config) throw new Error(`No WORD_GROUP_FETCH_CONFIG entry for ${key}`);
    return config;
};
