export const WORD_LENGTH_BY_LEVEL: Record<string, { minLength?: number; maxLength?: number }> = {
    beginner: { maxLength: 4 },
    intermediate: { minLength: 4, maxLength: 6 },
    advanced: { minLength: 6, maxLength: 9 },
};
