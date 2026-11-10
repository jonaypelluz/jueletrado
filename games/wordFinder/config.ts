import { WordFilter } from '@models/types';

export const WORD_LENGTH_BY_LEVEL: Record<string, WordFilter> = {
    beginner: { minLen: 3, maxLen: 4 },
    intermediate: { minLen: 4, maxLen: 6 },
    advanced: { minLen: 6, maxLen: 9 },
};
