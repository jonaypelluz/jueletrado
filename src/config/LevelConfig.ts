import { LevelConfig } from '@models/types';

const LevelsConfig: LevelConfig[] = [
    {
        level: 'beginner',
        totalChunks: 1,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 1980, es: 9086 },
    },
    {
        level: 'intermediate',
        totalChunks: 2,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 27384, es: 108764 },
    },
    {
        level: 'advanced',
        totalChunks: 7,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 177026, es: 646408 },
    },
];

export default LevelsConfig;
