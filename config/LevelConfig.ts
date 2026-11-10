import { LevelConfig } from '@models/types';

const LevelsConfig: LevelConfig[] = [
    {
        level: 'beginner',
        totalChunks: { en: 1, es: 1 },
        minimumPopulatedCount: { en: 2873, es: 2934 },
    },
    {
        level: 'intermediate',
        totalChunks: { en: 1, es: 1 },
        minimumPopulatedCount: { en: 31293, es: 73350 },
    },
    {
        level: 'advanced',
        totalChunks: { en: 4, es: 7 },
        minimumPopulatedCount: { en: 354643, es: 667837 },
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
