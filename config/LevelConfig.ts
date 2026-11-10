import { LevelConfig } from '@models/types';

const LevelsConfig: LevelConfig[] = [
    {
        level: 'beginner',
        totalChunks: { en: 1, es: 1 },
        minimumPopulatedCount: { en: 2774, es: 2911 },
    },
    {
        level: 'intermediate',
        totalChunks: { en: 1, es: 1 },
        minimumPopulatedCount: { en: 30742, es: 73287 },
    },
    {
        level: 'advanced',
        totalChunks: { en: 4, es: 7 },
        minimumPopulatedCount: { en: 354646, es: 667842 },
    },
];

/**
 * Frequency bands of the computed level, per locale: rank ≤ beginner → beginner, ≤ intermediate →
 * intermediate, else advanced. Provisional values pending the level calibration of JUE-0017.
 */
export const LEVEL_BANDS: Record<string, { beginner: number; intermediate: number }> = {
    es: { beginner: 3000, intermediate: 10000 },
    en: { beginner: 3000, intermediate: 10000 },
};

export default LevelsConfig;
