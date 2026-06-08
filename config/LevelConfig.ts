import { LevelConfig } from '@models/types';

const LevelsConfig: LevelConfig[] = [
    {
        level: 'beginner',
        totalChunks: { en: 1, es: 1 },
        minimumPopulatedCount: { en: 10160, es: 22697 },
    },
    {
        level: 'intermediate',
        totalChunks: { en: 1, es: 2 },
        minimumPopulatedCount: { en: 72096, es: 110159 },
    },
    {
        level: 'advanced',
        totalChunks: { en: 4, es: 7 },
        minimumPopulatedCount: { en: 364361, es: 647804 },
    },
];

export default LevelsConfig;
