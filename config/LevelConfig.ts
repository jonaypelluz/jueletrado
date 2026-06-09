import { LevelConfig } from '@models/types';

const LevelsConfig: LevelConfig[] = [
    {
        level: 'beginner',
        totalChunks: { en: 1, es: 1 },
        minimumPopulatedCount: { en: 3051, es: 2934 },
    },
    {
        level: 'intermediate',
        totalChunks: { en: 1, es: 1 },
        minimumPopulatedCount: { en: 33344, es: 73052 },
    },
    {
        level: 'advanced',
        totalChunks: { en: 4, es: 7 },
        minimumPopulatedCount: { en: 354519, es: 640854 },
    },
];

export default LevelsConfig;
