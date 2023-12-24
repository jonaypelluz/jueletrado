import { LevelConfig } from 'src/models/types';

const LevelsConfig: LevelConfig[] = [
    {
        level: 'basic',
        totalChunks: 1,
        chunkSize: 100000,
        minimumPopulatedCount: 8992,
    },
    {
        level: 'intermediate',
        totalChunks: 2,
        chunkSize: 100000,
        minimumPopulatedCount: 108764,
    },
    {
        level: 'hard',
        totalChunks: 7,
        chunkSize: 100000,
        minimumPopulatedCount: 646408,
    },
];

export default LevelsConfig;
