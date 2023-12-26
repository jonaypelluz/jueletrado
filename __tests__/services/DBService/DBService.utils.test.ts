import { dbService } from '@services/DBService';
import 'fake-indexeddb/auto';

describe('DBService utils methods', () => {
    test('setStoreName correctly sets the storeName', () => {
        const level = 'basic';
        dbService.setStoreName(level);

        expect(dbService.getStoreName()).toBe(`words_level_${level}`);
    });

    test('startTransaction throws an error if DB is not initialized', () => {
        expect(() => dbService.startTransaction('readwrite')).toThrow(
            'Database has not been initialized',
        );
    });

    test('startTransaction creates a transaction when is called', async () => {
        await dbService.initDB();
        expect(dbService.startTransaction('readwrite')).toBeInstanceOf(IDBTransaction);
    });
});
