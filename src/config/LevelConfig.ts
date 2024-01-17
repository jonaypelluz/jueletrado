import { LevelConfig } from '@models/types';

const LevelsConfig: LevelConfig[] = [
    {
        level: 'basic',
        totalChunks: 1,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 1977, es: 9086 },
    },
    {
        level: 'intermediate',
        totalChunks: 2,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 28113, es: 108764 },
    },
    {
        level: 'hard',
        totalChunks: 7,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 166468, es: 646408 },
    },
];

export default LevelsConfig;
