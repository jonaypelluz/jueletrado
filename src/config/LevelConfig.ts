import { LevelConfig } from '@models/types';

const LevelsConfig: LevelConfig[] = [
    {
        level: 'beginner',
        totalChunks: 1,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 10210, es: 9086 },
    },
    {
        level: 'intermediate',
        totalChunks: 2,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 72180, es: 108698 },
    },
    {
        level: 'advanced',
        totalChunks: 7,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 312831, es: 646407 },
    },
];

export default LevelsConfig;
