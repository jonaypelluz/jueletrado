import { LevelConfig } from '@models/types';

const LevelsConfig: LevelConfig[] = [
    {
        level: 'beginner',
        totalChunks: { en: 1, es: 1 },
        minimumPopulatedCount: { en: 2993, es: 2988 },
    },
    {
        level: 'intermediate',
        totalChunks: { en: 1, es: 1 },
        minimumPopulatedCount: { en: 31518, es: 73376 },
    },
    {
        level: 'advanced',
        totalChunks: { en: 4, es: 7 },
        minimumPopulatedCount: { en: 355242, es: 665541 },
    },
];

export default LevelsConfig;
