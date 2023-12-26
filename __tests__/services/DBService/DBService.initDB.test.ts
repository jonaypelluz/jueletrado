import LevelsConfig from '@config/LevelConfig';
import { dbService } from '@services/DBService';
import Logger from '@services/Logger';
// import 'core-js/stable/structured-clone';
import 'fake-indexeddb/auto';

jest.mock('@services/Logger', () => ({
    __esModule: true,
    default: {
        error: jest.fn(),
    },
}));

describe('DBService.initDB', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('initDB correctly initializes the database and store names', async () => {
        await dbService.initDB();

        const dbName = 'jueletrado-db';
        const dbRequest = indexedDB.open(dbName);
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            dbRequest.onsuccess = () => resolve(dbRequest.result);
            dbRequest.onerror = () => reject(dbRequest.error);
        });

        for (const config of LevelsConfig) {
            const storeName = `words_level_${config.level}`;
            const storeExists = db.objectStoreNames.contains(storeName);
            expect(storeExists).toBe(true);
        }

        db.close();
    });

    test('initDB handles database opening errors', async () => {
        const errorMsg = 'DB Error';

        const mockOpenRequest = {
            onupgradeneeded: jest.fn(),
            onsuccess: jest.fn(),
            onerror: jest.fn(),
            result: {},
            error: new Error(errorMsg),
        };

        const mockOpen = jest.fn().mockImplementation(() => mockOpenRequest);
        jest.spyOn(indexedDB, 'open').mockImplementation(mockOpen);

        process.nextTick(() => {
            mockOpenRequest.onerror(new Event('error'));
        });

        await expect(dbService.initDB()).rejects.toEqual(`Database error: ${errorMsg}`);
        expect(Logger.error).toHaveBeenCalledWith('DB Initialization Error', errorMsg);
    });
});
