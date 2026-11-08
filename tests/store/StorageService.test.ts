import StorageService from '@store/StorageService';

describe('StorageService.clearStorage', () => {
    afterEach(() => {
        localStorage.clear();
    });

    test('keeps the wordChain best scores and removes every other key', () => {
        const best = { es: { beginner: 7 }, en: { advanced: 3 } };
        StorageService.setItem(StorageService.WORD_CHAIN_BEST, best);
        StorageService.setItem(StorageService.LOCALE, 'es');
        StorageService.setItem(StorageService.WORDS_TOWER, ['gato']);
        StorageService.setItem(StorageService.LEVELS_POPULATED, { es: { beginner: true } });

        StorageService.clearStorage();

        expect(StorageService.getItem(StorageService.WORD_CHAIN_BEST)).toEqual(best);
        expect(StorageService.getItem(StorageService.LOCALE)).toBeNull();
        expect(StorageService.getItem(StorageService.WORDS_TOWER)).toBeNull();
        expect(StorageService.getItem(StorageService.LEVELS_POPULATED)).toBeNull();
    });

    test('does not write the wordChain best key back when none was stored', () => {
        StorageService.setItem(StorageService.LOCALE, 'es');

        StorageService.clearStorage();

        expect(localStorage.getItem(StorageService.WORD_CHAIN_BEST)).toBeNull();
        expect(localStorage.length).toBe(0);
    });
});
