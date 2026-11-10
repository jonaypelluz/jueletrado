import LocalesConfig from '@config/LocaleConfig';
import { Level, LocaleConfig, WordRecord, WordRow } from '@models/types';
import { hydrateRow } from '@utils/WordRecord';
import Logger from '@services/Logger';

const DB_NAME = 'jueletrado-db';
const DB_VERSION = 2;
const LEGACY_STORE_PREFIX = 'words_level_';

// Per locale: the words keyed by word (no index), and the served rows of each level file keyed by
// [level, position] → word, so a draw or the population check is a keyed lookup (Chromium walks an
// index cursor or a range count linearly).
const wordsStoreFor = (locale: string): string => `words_${locale}`;
const positionsStoreFor = (locale: string): string => `positions_${locale}`;

/**
 * What the words store keeps per word: the key and the served chunk row (its levels are in the row
 * mask). The cheap fields (level, length, edge letters, letters, flag names) are derived again on read.
 */
type StoredWord = { word: string; row: WordRow };

// Rows written per readwrite transaction: one 100k-row chunk in a single transaction took 70–117 s in
// Chromium and sometimes aborted with QuotaExceededError (JUE-0009 QA).
const PUT_BATCH_ROWS = 10_000;

export interface IDbServiceOptions {
    dbFactory: IDBFactory;
    logger: typeof Logger;
    putBatchRows?: number;
}

/** Rejected by initDB when an open tab on an older version does not let the v2 upgrade run. */
export class DBUpgradeBlockedError extends Error {
    constructor() {
        super('database upgrade blocked by another open tab');
        this.name = 'DBUpgradeBlockedError';
    }
}

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
    new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

export class DBService {
    private db: IDBDatabase | null = null;
    private isPopulatedMap: Map<string, boolean> = new Map();
    // Every word of a locale (`${locale}_keys`), dropped whenever the locale stores change.
    private keyCache: Map<string, string[]> = new Map();
    // Every word of a locale as a Set (`${locale}_set`), dropped with the key cache.
    private wordSetCache: Map<string, Set<string>> = new Map();

    private logger: typeof Logger;
    private dbFactory: IDBFactory;
    private putBatchRows: number;

    constructor(options: IDbServiceOptions) {
        this.dbFactory = options.dbFactory;
        this.logger = options.logger;
        this.putBatchRows = options.putBatchRows ?? PUT_BATCH_ROWS;
    }

    private startTransaction(stores: string[], mode: IDBTransactionMode): IDBTransaction {
        if (!this.db) {
            throw new Error('Database has not been initialized');
        }

        return this.db.transaction(stores, mode);
    }

    /** Forgets a connection that closed or yielded to another version, with everything cached from it. */
    private dropConnection(db: IDBDatabase): void {
        if (this.db !== db) return;
        this.db = null;
        this.keyCache.clear();
        this.wordSetCache.clear();
        this.isPopulatedMap.clear();
    }

    private clearLocaleCaches(locale: string): void {
        for (const cache of [this.keyCache, this.wordSetCache, this.isPopulatedMap]) {
            for (const key of [...cache.keys()]) {
                if (key.startsWith(`${locale}_`)) cache.delete(key);
            }
        }
    }

    async ensureDBInitialized(): Promise<void> {
        if (!this.db) {
            await this.initDB();
        }
    }

    /** Opens (and on first run upgrades) the database; a no-op while a connection is open. */
    async initDB(): Promise<void> {
        if (this.db) return;
        return new Promise((resolve, reject) => {
            const request = this.dbFactory.open(DB_NAME, DB_VERSION);
            let blocked = false;

            request.onupgradeneeded = (event) => {
                const db = request.result;
                if (event.oldVersion < 2) {
                    [...db.objectStoreNames].filter((name) => name.startsWith(LEGACY_STORE_PREFIX)).forEach((name) => db.deleteObjectStore(name));
                }
                LocalesConfig.forEach(({ lang }: LocaleConfig) => {
                    if (!db.objectStoreNames.contains(wordsStoreFor(lang))) db.createObjectStore(wordsStoreFor(lang), { keyPath: 'word' });
                    if (!db.objectStoreNames.contains(positionsStoreFor(lang))) db.createObjectStore(positionsStoreFor(lang));
                });
            };

            request.onsuccess = () => {
                const db = request.result;
                // The upgrade went through after initDB already rejected as blocked: nobody owns this connection.
                if (blocked) {
                    db.close();
                    return;
                }
                db.onversionchange = () => {
                    db.close();
                    this.dropConnection(db);
                };
                // Closed abnormally (e.g. site data cleared while open): reopen on the next call.
                db.onclose = () => this.dropConnection(db);
                this.db = db;
                resolve();
            };

            request.onerror = () => {
                this.logger.error('DB Initialization Error', request.error?.message);
                reject(`Database error: ${request.error?.message}`);
            };

            request.onblocked = () => {
                blocked = true;
                this.logger.warn('DB Initialization Blocked', 'An open tab keeps an older database version.');
                reject(new DBUpgradeBlockedError());
            };
        });
    }

    /**
     * Stores the served rows of a level file at positions offset.., in transactions of putBatchRows rows:
     * each row in the words store (by word) and its word at [level, offset + j]; storing the same chunk
     * twice is a no-op.
     */
    async putChunk(locale: string, level: Level, offset: number, rows: WordRow[]): Promise<void> {
        try {
            // In order: the last position of the chunk is written last.
            for (let start = 0; start < rows.length; start += this.putBatchRows) {
                await this.putRows(locale, level, offset + start, rows.slice(start, start + this.putBatchRows));
            }
        } finally {
            this.clearLocaleCaches(locale);
        }
    }

    /** One readwrite transaction over both stores: a word is never stored without its position. */
    private async putRows(locale: string, level: Level, offset: number, rows: WordRow[]): Promise<void> {
        await this.ensureDBInitialized();
        await new Promise<void>((resolve, reject) => {
            const transaction = this.startTransaction([wordsStoreFor(locale), positionsStoreFor(locale)], 'readwrite');
            const words = transaction.objectStore(wordsStoreFor(locale));
            const positions = transaction.objectStore(positionsStoreFor(locale));
            const fail = () => {
                this.logger.error('Transaction Error', transaction.error?.message);
                reject(transaction.error ?? new Error('transaction aborted'));
            };
            transaction.oncomplete = () => resolve();
            transaction.onerror = fail;
            transaction.onabort = fail;
            try {
                rows.forEach((row, j) => {
                    const word = row[0] as string;
                    words.put({ word, row } satisfies StoredWord);
                    positions.put(word, [level, offset + j]);
                });
            } catch (error) {
                // A malformed row (e.g. no word) throws synchronously: write none of the chunk.
                transaction.abort();
                reject(error);
            }
        });
    }

    /** True when the last served position of the level, [level, minimumPopulatedCount - 1], holds a word. */
    async checkIfPopulated(locale: string, level: string, minimumPopulatedCount: number): Promise<boolean> {
        const cacheKey = `${locale}_${level}_${minimumPopulatedCount}`;
        if (this.isPopulatedMap.get(cacheKey)) return true;

        await this.ensureDBInitialized();
        const positions = this.startTransaction([positionsStoreFor(locale)], 'readonly').objectStore(positionsStoreFor(locale));
        try {
            const word = await requestResult(positions.get([level, minimumPopulatedCount - 1]));
            const isPopulated = word !== undefined;
            this.isPopulatedMap.set(cacheKey, isPopulated);
            this.logger.log(`Database check: Populated status for ${level} ${locale} - ${isPopulated}`);
            return isPopulated;
        } catch (error) {
            this.logger.error(`Error checking if populated for ${level} ${locale}: ${(error as DOMException | null)?.message}`);
            throw error;
        }
    }

    /** Every word of the locale store; cached until the store changes. */
    async getKeys(locale: string): Promise<string[]> {
        const cacheKey = `${locale}_keys`;
        const cached = this.keyCache.get(cacheKey);
        if (cached) return [...cached];

        await this.ensureDBInitialized();
        const store = this.startTransaction([wordsStoreFor(locale)], 'readonly').objectStore(wordsStoreFor(locale));
        const keys = (await requestResult(store.getAllKeys())) as string[];
        this.keyCache.set(cacheKey, keys);
        return [...keys];
    }

    /**
     * Records at the given positions of the level, in one readonly transaction of keyed lookups
     * ([level, position] → word → record); a position not stored is skipped.
     */
    async getWordsAt(locale: string, level: string, positions: number[]): Promise<WordRecord[]> {
        await this.ensureDBInitialized();
        const transaction = this.startTransaction([wordsStoreFor(locale), positionsStoreFor(locale)], 'readonly');
        const words = transaction.objectStore(wordsStoreFor(locale));
        const positionStore = transaction.objectStore(positionsStoreFor(locale));
        const stored = await Promise.all(
            positions.map(
                (position) =>
                    new Promise<StoredWord | undefined>((resolve, reject) => {
                        const request = positionStore.get([level, position]) as IDBRequest<string | undefined>;
                        request.onerror = () => reject(request.error);
                        // Chained in the success callback, while the transaction is still active.
                        request.onsuccess = () => {
                            if (request.result === undefined) return resolve(undefined);
                            requestResult(words.get(request.result) as IDBRequest<StoredWord | undefined>).then(resolve, reject);
                        };
                    }),
            ),
        );
        return stored.filter((entry): entry is StoredWord => entry !== undefined).map((entry) => hydrateRow(entry.row, locale));
    }

    /** Every word of the locale store as a Set, shared between callers until the store changes (do not mutate). */
    async getWordSet(locale: string): Promise<Set<string>> {
        const cacheKey = `${locale}_set`;
        const cached = this.wordSetCache.get(cacheKey);
        if (cached) return cached;

        const wordSet = new Set(await this.getKeys(locale));
        this.wordSetCache.set(cacheKey, wordSet);
        return wordSet;
    }

    /** Records for the given words, in input order (undefined for a word not stored), in one transaction. */
    async getRecords(locale: string, words: string[]): Promise<(WordRecord | undefined)[]> {
        await this.ensureDBInitialized();
        const store = this.startTransaction([wordsStoreFor(locale)], 'readonly').objectStore(wordsStoreFor(locale));
        const stored = await Promise.all(words.map((word) => requestResult(store.get(word) as IDBRequest<StoredWord | undefined>)));
        return stored.map((entry) => entry && hydrateRow(entry.row, locale));
    }

    async deleteDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close();
                this.db = null;
            }

            const request = this.dbFactory.deleteDatabase(DB_NAME);

            request.onsuccess = () => {
                this.isPopulatedMap.clear();
                this.keyCache.clear();
                this.wordSetCache.clear();
                this.logger.log('Database successfully deleted');
                resolve();
            };

            request.onerror = () => {
                this.logger.error('Error deleting database', request.error?.message);
                reject(request.error);
            };

            request.onblocked = () => {
                this.logger.warn('Database deletion blocked. Retrying...');
                setTimeout(() => {
                    this.deleteDatabase().then(resolve).catch(reject);
                }, 1000);
            };
        });
    }
}

// SSR-safe singleton: indexedDB doesn't exist on the server.
// The service is only ever used inside `useEffect` / event handlers
// (i.e. always on the client), but importing this module on the server
// must not throw, so we create a lazy proxy.
//
// IMPORTANT: when proxying a class instance you must:
//   1. Bind methods to the real instance so `this` inside them is the
//      instance and not the Proxy. Otherwise property access (especially
//      private-ish fields like `this.db`) goes through the Proxy and
//      writes/reads land on the empty target instead of the instance.
//   2. Forward `set` so writes like `this.db = ...` reach the instance.
let _dbService: DBService | null = null;

const getInstance = (): DBService => {
    if (typeof window === 'undefined') {
        throw new Error(
            'dbService cannot be used on the server. ' +
                'Wrap the call in a "use client" component or useEffect.',
        );
    }
    if (!_dbService) {
        _dbService = new DBService({
            dbFactory: window.indexedDB as IDBFactory,
            logger: Logger,
        });
    }
    return _dbService;
};

const dbService: DBService = new Proxy({} as DBService, {
    get(_target, prop) {
        const instance = getInstance();
        const value = (instance as unknown as Record<string | symbol, unknown>)[
            prop as string | symbol
        ];
        if (typeof value === 'function') {
            // Jest mocks carry _isMockFunction — return them as-is so jest.spyOn keeps mock identity.
            // Regular prototype methods are bound so `this` is the real instance, not the Proxy.
            if ((value as { _isMockFunction?: boolean })._isMockFunction) {
                return value;
            }
            return (value as (...args: unknown[]) => unknown).bind(instance);
        }
        return value;
    },
    set(_target, prop, newValue) {
        const instance = getInstance();
        (instance as unknown as Record<string | symbol, unknown>)[prop as string | symbol] =
            newValue;
        return true;
    },
    deleteProperty(_target, prop) {
        const instance = getInstance();
        delete (instance as unknown as Record<string | symbol, unknown>)[prop as string | symbol];
        return true;
    },
});

export { dbService };
