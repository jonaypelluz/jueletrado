export const TOTAL_QUIZ_DEFINITIONS = 5;

/** Senses a word needs to be offered at each level; an unknown level uses the advanced minimum. */
export const MIN_DEFINITIONS_BY_LEVEL: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
};
