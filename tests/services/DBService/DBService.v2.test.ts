import 'core-js/stable/structured-clone';
import 'fake-indexeddb/auto';
import { IDBFactory, IDBObjectStore, forceCloseDatabase } from 'fake-indexeddb';
import { Level, WordRow } from '@models/types';
import { DBService, DBUpgradeBlockedError } from '@services/DBService';
import Logger from '@services/Logger';
import { encodeRow } from '@utils/WordRecord';
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

    test('rejects with DBUpgradeBlockedError when an open v1 tab does not close', async () => {
        const v1Tab = await createV1(); // no onversionchange handler: never yields

        try {
            const result = service.initDB();

            await expect(result).rejects.toBeInstanceOf(DBUpgradeBlockedError);
            await expect(result).rejects.toThrow('database upgrade blocked by another open tab');
        } finally {
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

    test('maps [level, offset + j] to the word of row j', async () => {
        await putChunk('es', 'beginner', 0, [encodeRow(casa), encodeRow(perro)]);
        await putChunk('es', 'beginner', 2, [encodeRow(madrid)]);

        expect(await readStore('positions_es')).toEqual([
            [['beginner', 0], 'casa'],
            [['beginner', 1], 'perro'],
            [['beginner', 2], 'madrid'],
        ]);
        expect(await readStore('positions_en')).toEqual([]);
    });

    test('a word put from two level files keeps one words entry and one position per level', async () => {
        await putChunk('es', 'beginner', 0, [encodeRow(casa), encodeRow(madrid)]);
        await putChunk('es', 'advanced', 0, [encodeRow(madrid)]);

        expect((await readStore('words_es')).map(([key]) => key)).toEqual(['casa', 'madrid']);
        expect(await readStore('positions_es')).toEqual([
            [['advanced', 0], 'madrid'],
            [['beginner', 0], 'casa'],
            [['beginner', 1], 'madrid'],
        ]);
    });

    test('writes a large chunk in transactions of at most putBatchRows rows, each over both stores, in order', async () => {
        const batched = new DBService({ dbFactory: factory, logger: silentLogger, putBatchRows: 2 });
        const transaction = jest.spyOn(IDBDatabase.prototype, 'transaction');
        const rows = ['casa', 'perro', 'mesa', 'silla', 'gato'].map((word) => encodeRow(plainRecord(word)));

        try {
            await (batched as unknown as ChunkWriter).putChunk('es', 'beginner', 10, rows);
            const writes = transaction.mock.calls.filter(([, mode]) => mode === 'readwrite');
            expect(writes).toHaveLength(3);
            writes.forEach(([stores]) => expect([...(stores as string[])].sort()).toEqual(['positions_es', 'words_es']));
            transaction.mockRestore();
            expect((await readStore('positions_es')).map(([key, word]) => [(key as [string, number])[1], word])).toEqual([
                [10, 'casa'],
                [11, 'perro'],
                [12, 'mesa'],
                [13, 'silla'],
                [14, 'gato'],
            ]);
        } finally {
            transaction.mockRestore();
            await batched.deleteDatabase();
        }
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

    test('putChunk rejects when the positions put aborts, and the words put of the same chunk is rolled back with it', async () => {
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
        // One transaction for both stores: a word without its position is never left behind.
        expect(await readStore('words_es')).toEqual([]);
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
