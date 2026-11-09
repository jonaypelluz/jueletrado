import StorageService, { StorageKey } from '@store/StorageService';

/** Per-game word groups prefetched for a level: how many words and which length window. */
export const WORD_GROUP_FETCH_CONFIG: {
    count: number;
    key: StorageKey;
    maxLength?: number;
    minLength?: number;
}[] = [
    // WORDS_DAILY: 7 words, one drawn per day (24h TTL applied when storing the daily word).
    { count: 7, key: StorageService.WORDS_DAILY, minLength: 4 },
    // WORDS_FINDER: persistent queue, 10 words/session × 6 sessions before refetch.
    { count: 60, key: StorageService.WORDS_FINDER, maxLength: 9, minLength: 4 },
    // WORDS_TOWER: persistent queue, 15 words/session × 8 sessions before refetch.
    { count: 120, key: StorageService.WORDS_TOWER, minLength: 4 },
    // WORDS_RAIN: cycling pool, 150 words (looped, not consumed).
    // Oversized — some words lose all invalid variants after dictionary validation.
    { count: 150, key: StorageService.WORDS_RAIN, minLength: 4 },
    // WORDS_ACCENT: persistent queue, oversized since many words are rejected
    // by the accent-eligibility filter in accentFixer.
    { count: 80, key: StorageService.WORDS_ACCENT, minLength: 4 },
    // WORDS_MATCHER: persistent queue, oversized since many words match no
    // confusion rule and are rejected by the letterMatcher challenge builder.
    { count: 80, key: StorageService.WORDS_MATCHER, minLength: 4 },
    // WORDS_SYLLABLE: persistent queue, 10 words/session drawn from 20, ~3 sessions before refetch.
    { count: 60, key: StorageService.WORDS_SYLLABLE, minLength: 4 },
];
