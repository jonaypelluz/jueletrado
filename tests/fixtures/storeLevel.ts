import { Level, WordRecord, WordRow } from '@models/types';
import { dbService } from '@services/DBService';
import { encodeRow } from '@utils/WordRecord';
import { levelRowsOf, setLevelRows } from './levelConfigMock';

type ChunkWriter = { putChunk(locale: string, level: Level, offset: number, rows: WordRow[]): Promise<void> };

/**
 * Stores the records as served rows of the level at positions offset.. (as populate does) and makes
 * the mocked LevelConfig serve that many rows for the level, so it reads as populated.
 */
export const storeLevel = async (locale: string, level: Level, records: WordRecord[], offset = 0): Promise<void> => {
    await (dbService as unknown as ChunkWriter).putChunk(locale, level, offset, records.map(encodeRow));
    setLevelRows(locale, level, Math.max(levelRowsOf(locale, level), offset + records.length));
};
