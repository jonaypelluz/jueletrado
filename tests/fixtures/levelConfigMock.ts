/**
 * A LevelConfig whose minimumPopulatedCount follows the rows a test stored per locale + level (see
 * storeLevel), as the real config follows the served rows; totalChunks is 1 unless a test sets it.
 * No imports: jest.mock factories require it.
 *
 *   jest.mock('@config/LevelConfig', () => require('../../fixtures/levelConfigMock').levelConfigModule);
 */
const levelRows: Record<string, number> = {};
const levelChunks: Record<string, number> = {};

export const setLevelRows = (locale: string, level: string, rows: number): void => {
    levelRows[`${locale}_${level}`] = rows;
};

export const setLevelChunks = (locale: string, level: string, chunks: number): void => {
    levelChunks[`${locale}_${level}`] = chunks;
};

export const levelRowsOf = (locale: string, level: string): number => levelRows[`${locale}_${level}`] ?? 0;

export const resetLevelRows = (): void => {
    [levelRows, levelChunks].forEach((sizes) => Object.keys(sizes).forEach((key) => delete sizes[key]));
};

export const levelConfigModule = {
    __esModule: true,
    default: ['beginner', 'intermediate', 'advanced'].map((level) => ({
        level,
        get totalChunks() {
            return { es: levelChunks[`es_${level}`] ?? 1, en: levelChunks[`en_${level}`] ?? 1 };
        },
        // A level nothing was stored for still needs one row, so it reads as not populated.
        get minimumPopulatedCount() {
            return { es: levelRowsOf('es', level) || 1, en: levelRowsOf('en', level) || 1 };
        },
    })),
};
