import { WordFilter } from '@models/types';

export const CHALLENGE_COUNT = 10;

export const LEVEL_FETCH_OPTIONS: Record<string, WordFilter> = {
    beginner: { minLen: 4, maxLen: 6 },
    intermediate: { minLen: 5, maxLen: 8 },
    advanced: { minLen: 6 },
};
