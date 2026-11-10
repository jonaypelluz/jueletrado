import 'core-js/stable/structured-clone';
import 'fake-indexeddb/auto';
import { IDBFactory, IDBObjectStore, forceCloseDatabase } from 'fake-indexeddb';
import { Level, WordRow } from '@models/types';
import { DBService } from '@services/DBService';
import Logger from '@services/Logger';
import { WORD_CHUNK_ROWS, encodeRow } from '@utils/WordRecord';
import { plainRecord } from '../../fixtures/wordRecords';

const DB_NAME = 'jueletrado-db';
const V1_STORES = ['beginner', 'intermediate', 'advanced'].flatMap((level) => ['es', 'en'].map((locale) => `words_level_${level}_${locale}`));

const silentLogger = { error: jest.fn(), warn: jest.fn(), log: jest.fn(), info: jest.fn(), debug: jest.fn() } as unknown as typeof Logger;

let factory: IDBFactory;
let service: DBService;

const open = (version?: number, onUpgrade?: (db: IDBDatabase) => void): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const request = version === undefined ? factory.open(DB_NAME) : factory.open(DB_NAME, version);
        request.onupgradeneeded = () => onUpgrade?.(request.result);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

/** A v1 database as shipped today: one autoIncrement store per level × locale, with words in it. */
const createV1 = (): Promise<IDBDatabase> =>
    open(1, (db) => {
        for (const name of V1_STORES) {
            const store = db.createObjectStore(name, { autoIncrement: true });
            if (name === 'words_level_beginner_es') ['casa', 'perro'].forEach((word) => store.add(word));
        }
    });

type ChunkWriter = { putChunk(locale: string, level: Level, offset: number, rows: WordRow[]): Promise<void> };
const putChunk = (locale: string, level: Level, offset: number, rows: WordRow[]) => (service as unknown as ChunkWriter).putChunk(locale, level, offset, rows);

/** Every [key, value] of a store, in key order, read through a separate connection. */
const readStore = async (name: string): Promise<[IDBValidKey, unknown][]> => {
    const db = await open();
    try {
        const store = db.transaction(name, 'readonly').objectStore(name);
        const [keys, values] = await Promise.all(
            [store.getAllKeys(), store.getAll()].map(
                (request) =>
                    new Promise<unknown[]>((resolve, reject) => {
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    }),
            ),
        );
        return (keys as IDBValidKey[]).map((key, i) => [key, values[i]]);
    } finally {
        db.close();
    }
};

beforeEach(() => {
    factory = new IDBFactory();
    service = new DBService({ dbFactory: factory, logger: silentLogger });
});

// Closes the service connection so no upgrade request is left pending between tests.
afterEach(async () => {
    await service.deleteDatabase();
});

describe('DBService v2 schema', () => {
    test('a fresh install creates per locale a words store keyed by word with no index and a positions store with out-of-line keys', async () => {
        await service.initDB();

        const db = await open();
        try {
            expect(db.version).toBe(2);
            expect([...db.objectStoreNames].sort()).toEqual(['positions_en', 'positions_es', 'words_en', 'words_es']);
            const transaction = db.transaction(['words_es', 'words_en', 'positions_es', 'positions_en'], 'readonly');
            for (const locale of ['es', 'en']) {
                const words = transaction.objectStore(`words_${locale}`);
                expect(words.keyPath).toBe('word');
                expect([...words.indexNames]).toEqual([]);
                const positions = transaction.objectStore(`positions_${locale}`);
                expect(positions.keyPath).toBeNull();
                expect(positions.autoIncrement).toBe(false);
                expect([...positions.indexNames]).toEqual([]);
            }
        } finally {
            db.close();
        }
    });

    test('upgrading a v1 database with words drops the words_level_* stores and creates the v2 stores', async () => {
        (await createV1()).close();

        await service.initDB();

        const db = await open();
        try {
            expect(db.version).toBe(2);
            expect([...db.objectStoreNames].sort()).toEqual(['positions_en', 'positions_es', 'words_en', 'words_es']);
        } finally {
            db.close();
        }
    });

    test('an open v1 tab holding the upgrade back is reported, and the upgrade goes on once that tab closes', async () => {
        const v1Tab = await createV1(); // no onversionchange handler: never yields
        const states: boolean[] = [];
        const unsubscribe = service.onBlockedChange((blocked) => states.push(blocked));
        let settled = false;

        try {
            const result = service.initDB().then(() => (settled = true));
            await new Promise((resolve) => setTimeout(resolve, 20));
            expect(states).toEqual([true]);
            expect(settled).toBe(false); // it waits instead of failing

            v1Tab.close();
            await result;

            expect(states).toEqual([true, false]);
            const db = await open();
            expect(db.version).toBe(2);
            db.close();
        } finally {
            unsubscribe();
            v1Tab.close();
        }
    });

    test('rejects when opening the database fails', async () => {
        // A database already at a newer version makes open(DB_NAME, 2) fire onerror (VersionError).
        (await open(5)).close();

        await expect(service.initDB()).rejects.toBeDefined();
    });

    test('a v2 connection closes itself when a newer version is requested', async () => {
        await service.initDB();

        const outcome = await new Promise<string>((resolve) => {
            const request = factory.open(DB_NAME, 3);
            request.onblocked = () => resolve('blocked');
            request.onsuccess = () => {
                request.result.close();
                resolve('opened');
            };
            request.onerror = () => resolve('error');
        });

        expect(outcome).toBe('opened');
    });
});

describe('DBService v2 putChunk', () => {
    const casa = plainRecord('casa');
    const perro = plainRecord('perro');
    const madrid = plainRecord('madrid', { levels: ['beginner', 'advanced'], freqRank: null, senseCount: 2, pos: 'nombre', hasDiphthong: 0 });

    test('stores each row as { word, row } and full records hydrate back from it', async () => {
        await putChunk('es', 'beginner', 0, [encodeRow(madrid)]);

        // Only the key and the served row: the levels are in the row mask, nothing else is indexed.
        expect(await readStore('words_es')).toEqual([['madrid', { word: 'madrid', row: ['madrid', null, 5, 0, null, null, 'nombre', 2] }]]);
        await expect(service.getRecords('es', ['madrid'])).resolves.toEqual([madrid]);
    });

    test('keeps each level file as its words in order at [level, start], and the level file index', async () => {
        await putChunk('es', 'beginner', 0, [encodeRow(casa), encodeRow(perro)]);
        await putChunk('es', 'beginner', 2, [encodeRow(madrid)]);
        await putChunk('es', 'advanced', WORD_CHUNK_ROWS, [encodeRow(madrid)]);

        expect(await readStore('positions_es')).toEqual([
            [['advanced', WORD_CHUNK_ROWS], ['madrid']],
            [['advanced', 'files'], [[WORD_CHUNK_ROWS, 1]]],
            [['beginner', 0], ['casa', 'perro']],
            [['beginner', 2], ['madrid']],
            [['beginner', 'files'], [[0, 2], [2, 1]]],
        ]);
        expect(await readStore('positions_en')).toEqual([]);
    });

    test('a word put from two level files keeps one words entry and appears in both files', async () => {
        await putChunk('es', 'beginner', 0, [encodeRow(casa), encodeRow(madrid)]);
        await putChunk('es', 'advanced', 0, [encodeRow(madrid)]);

        expect((await readStore('words_es')).map(([key]) => key)).toEqual(['casa', 'madrid']);
        expect(await readStore('positions_es')).toEqual([
            [['advanced', 0], ['madrid']],
            [['advanced', 'files'], [[0, 1]]],
            [['beginner', 0], ['casa', 'madrid']],
            [['beginner', 'files'], [[0, 2]]],
        ]);
    });

    test('writes each word once, in transactions of at most putBatchRows rows, and the file one put, last', async () => {
        const batched = new DBService({ dbFactory: factory, logger: silentLogger, putBatchRows: 2 });
        const put = jest.spyOn(IDBObjectStore.prototype, 'put');
        const transaction = jest.spyOn(IDBDatabase.prototype, 'transaction');
        const words = ['casa', 'perro', 'mesa', 'silla', 'gato'];

        try {
            await (batched as unknown as ChunkWriter).putChunk('es', 'beginner', 0, words.map((word) => encodeRow(plainRecord(word))));
            const stores = put.mock.contexts.map((store) => (store as IDBObjectStore).name);
            // One put per word, then the whole file and the level index (the first load was two puts per word).
            expect(stores).toEqual([...words.map(() => 'words_es'), 'positions_es', 'positions_es']);
            expect(transaction.mock.calls.filter(([, mode]) => mode === 'readwrite')).toHaveLength(4);
        } finally {
            put.mockRestore();
            transaction.mockRestore();
        }
        expect(await readStore('positions_es')).toEqual([
            [['beginner', 0], words],
            [['beginner', 'files'], [[0, 5]]],
        ]);
        await batched.deleteDatabase();
    });


    test('putting the same chunk twice changes nothing', async () => {
        await putChunk('es', 'beginner', 0, [encodeRow(casa), encodeRow(perro)]);
        const words = await readStore('words_es');
        const positions = await readStore('positions_es');

        await putChunk('es', 'beginner', 0, [encodeRow(casa), encodeRow(perro)]);

        expect(await readStore('words_es')).toEqual(words);
        expect(await readStore('positions_es')).toEqual(positions);
    });
});

describe('DBService v2 checkIfPopulated', () => {
    const rows = ['casa', 'perro', 'mesa'].map((word) => encodeRow(plainRecord(word)));

    test('is true when the last served position of the level is stored and false when it is not', async () => {
        await putChunk('es', 'beginner', 0, rows);

        await expect(service.checkIfPopulated('es', 'beginner', 3)).resolves.toBe(true);
        await expect(service.checkIfPopulated('es', 'beginner', 4)).resolves.toBe(false);
        await expect(service.checkIfPopulated('en', 'beginner', 3)).resolves.toBe(false);
    });

    test('follows level positions, not level membership: a stored word of another level file does not populate this level', async () => {
        // madrid belongs to advanced (row mask), but only the beginner file was stored.
        await putChunk('es', 'beginner', 0, [encodeRow(plainRecord('madrid', { levels: ['beginner', 'advanced'] }))]);

        await expect(service.checkIfPopulated('es', 'beginner', 1)).resolves.toBe(true);
        await expect(service.checkIfPopulated('es', 'advanced', 1)).resolves.toBe(false);
    });

    test('does not count a range of the level or walk it (both linear in Chromium)', async () => {
        await putChunk('es', 'beginner', 0, rows);
        const count = jest.spyOn(IDBObjectStore.prototype, 'count');
        const spies = [
            jest.spyOn(IDBObjectStore.prototype, 'openCursor'),
            jest.spyOn(IDBObjectStore.prototype, 'openKeyCursor'),
            jest.spyOn(IDBObjectStore.prototype, 'getAll'),
            jest.spyOn(IDBObjectStore.prototype, 'getAllKeys'),
        ];

        try {
            await expect(service.checkIfPopulated('es', 'beginner', 3)).resolves.toBe(true);

            spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
            // A count of one exact key is a lookup; a count of a range or of the whole store is a walk.
            count.mock.calls.forEach(([query]) => expect(Array.isArray(query)).toBe(true));
        } finally {
            [count, ...spies].forEach((spy) => spy.mockRestore());
        }
    });
});

describe('DBService v2 getWordsAt and clearWordStores', () => {
    const rows = (words: string[]) => words.map((word) => encodeRow(plainRecord(word)));

    test('draws by position across level files, reading each file once', async () => {
        await putChunk('es', 'advanced', 0, rows(['casa', 'perro']));
        await putChunk('es', 'advanced', WORD_CHUNK_ROWS, rows(['mesa', 'silla']));
        const get = jest.spyOn(IDBObjectStore.prototype, 'get');

        try {
            const drawn = await service.getWordsAt('es', 'advanced', [1, WORD_CHUNK_ROWS, WORD_CHUNK_ROWS + 1, 0, 7]);
            expect(drawn.map((record) => record.word)).toEqual(['perro', 'mesa', 'silla', 'casa']); // 7 is not stored
            const positionReads = () => get.mock.contexts.filter((store) => (store as IDBObjectStore).name === 'positions_es').length;
            expect(positionReads()).toBe(3); // the level index, then each of its two files once
            await service.getWordsAt('es', 'advanced', [0, WORD_CHUNK_ROWS]);
            expect(positionReads()).toBe(3); // cached
        } finally {
            get.mockRestore();
        }
    });

    test('a level whose last position falls in the second file is populated only once that file is in', async () => {
        await putChunk('es', 'advanced', 0, rows(['casa']));
        await expect(service.checkIfPopulated('es', 'advanced', WORD_CHUNK_ROWS + 1)).resolves.toBe(false);
        await putChunk('es', 'advanced', WORD_CHUNK_ROWS, rows(['mesa']));
        await expect(service.checkIfPopulated('es', 'advanced', WORD_CHUNK_ROWS + 1)).resolves.toBe(true);
    });

    test('clearWordStores empties every locale and drops the caches', async () => {
        await putChunk('es', 'beginner', 0, rows(['casa']));
        await putChunk('en', 'beginner', 0, rows(['house']));
        await expect(service.checkIfPopulated('es', 'beginner', 1)).resolves.toBe(true);

        await service.clearWordStores();

        for (const name of ['words_es', 'positions_es', 'words_en', 'positions_en']) expect(await readStore(name)).toEqual([]);
        await expect(service.checkIfPopulated('es', 'beginner', 1)).resolves.toBe(false);
        await expect(service.getWordsAt('es', 'beginner', [0])).resolves.toEqual([]);
    });
});

describe('DBService v2 connection lifecycle', () => {
    const casa = plainRecord('casa');
    const mesa = plainRecord('mesa');
    const putCasa = () => putChunk('es', 'beginner', 0, [encodeRow(casa)]);
    const wordsOf = async () => [...(await service.getWordSet('es'))].sort();
    const serviceConnection = () => (service as unknown as { db: IDBDatabase | null }).db;

    /** Stores a record through a separate connection, behind the service's caches. */
    const putBehindService = async (record: ReturnType<typeof plainRecord>) => {
        const db = await open();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('words_es', 'readwrite');
            tx.objectStore('words_es').put({ word: record.word, row: encodeRow(record) });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();
    };

    test('putChunk rejects when the positions put aborts, and the level does not read as populated', async () => {
        const realPut = IDBObjectStore.prototype.put;
        const putSpy = jest.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
            const request = realPut.apply(this, args);
            // Abort once the positions request has succeeded: the transaction fires abort, no error event.
            if (this.name === 'positions_es') request.addEventListener('success', () => this.transaction.abort());
            return request;
        });

        try {
            await expect(putCasa()).rejects.toBeDefined();
        } finally {
            putSpy.mockRestore();
        }
        // The file is written last: without it the level is not populated, so the next load writes it again.
        expect(await readStore('positions_es')).toEqual([]);
        await expect(service.checkIfPopulated('es', 'beginner', 1)).resolves.toBe(false);
    });

    test('a forced close drops the connection and the caches, so the next read sees the current store', async () => {
        await putCasa();
        await expect(wordsOf()).resolves.toEqual(['casa']);
        await expect(service.checkIfPopulated('es', 'beginner', 1)).resolves.toBe(true);
        await putBehindService(mesa);

        forceCloseDatabase(serviceConnection() as unknown as Parameters<typeof forceCloseDatabase>[0]);

        expect(await wordsOf()).toEqual(['casa', 'mesa']);
    });

    test('a database deleted from another handle clears the caches of the closed connection', async () => {
        await putCasa();
        await expect(wordsOf()).resolves.toEqual(['casa']);
        await expect(service.checkIfPopulated('es', 'beginner', 1)).resolves.toBe(true);

        await new Promise<void>((resolve, reject) => {
            const request = factory.deleteDatabase(DB_NAME);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        await expect(wordsOf()).resolves.toEqual([]);
        await expect(service.checkIfPopulated('es', 'beginner', 1)).resolves.toBe(false);
    });
});
