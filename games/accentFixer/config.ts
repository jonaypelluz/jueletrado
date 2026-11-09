export const CHALLENGE_COUNT = 10;

export const LEVEL_FETCH_OPTIONS: Record<string, { minLength: number; maxLength?: number }> = {
    beginner: { minLength: 4, maxLength: 6 },
    intermediate: { minLength: 5, maxLength: 8 },
    advanced: { minLength: 6 },
};
