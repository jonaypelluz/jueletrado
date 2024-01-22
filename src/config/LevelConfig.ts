import { LevelConfig } from '@models/types';

const LevelsConfig: LevelConfig[] = [
    {
        level: 'beginner',
        totalChunks: 1,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 10160, es: 10963 },
    },
    {
        level: 'intermediate',
        totalChunks: 2,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 72128, es: 110159 },
    },
    {
        level: 'advanced',
        totalChunks: 7,
        chunkSize: 100000,
        minimumPopulatedCount: { en: 364368, es: 647804 },
    },
];

export default LevelsConfig;
},
