import LocalesConfig from '@config/LocaleConfig';
import { Level, LocaleConfig, WordRecord, WordRow } from '@models/types';
import { hydrateRow } from '@utils/WordRecord';
import Logger from '@services/Logger';

const DB_NAME = 'jueletrado-db';
const DB_VERSION = 2;
const LEGACY_STORE_PREFIX = 'words_level_';

// Per locale: the words keyed by word (no index), and per served level file its words in order, keyed
// [level, start] (start = the file's first position), plus the level's file index at [level, 'files']:
// [[start, length], …]. A draw or the population check is a keyed lookup (Chromium walks an index cursor
// or a range count linearly), and a level file costs one positions put instead of one per word: the
// first load writes each word once.
const wordsStoreFor = (locale: string): string => `words_${locale}`;
const positionsStoreFor = (locale: string): string => `positions_${locale}`;
const FILES_KEY = 'files';
type LevelFiles = [start: number, length: number][];
const fileHolding = (files: LevelFiles, position: number): [number, number] | undefined =>
    files.find(([start, length]) => position >= start && position < start + length);

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

/** Told whether an open tab on an older version is holding the upgrade back (true) or let it run (false). */
export type BlockedListener = (blocked: boolean) => void;

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
    // The words of one served level file (`${locale}_${level}_${start}`) and a level's file index
    // (`${locale}_${level}_files`), read once and dropped whenever the locale stores change.
    private positionsCache: Map<string, string[] | LevelFiles> = new Map();
    private blockedListeners: Set<BlockedListener> = new Set();

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
        this.positionsCache.clear();
    }

    /** Subscribes to the blocked state of the upgrade (see initDB); returns the unsubscribe. */
    onBlockedChange(listener: BlockedListener): () => void {
        this.blockedListeners.add(listener);
        return () => this.blockedListeners.delete(listener);
    }

    private setBlocked(blocked: boolean): void {
        this.blockedListeners.forEach((listener) => listener(blocked));
    }

    private clearLocaleCaches(locale: string): void {
        for (const cache of [this.keyCache, this.wordSetCache, this.isPopulatedMap, this.positionsCache]) {
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

    /**
     * Opens (and on first run upgrades) the database; a no-op while a connection is open. While a tab on an
     * older version holds the upgrade back, it waits (onBlockedChange tells the page so it can ask to close
     * that tab) and goes on by itself once that tab closes.
     */
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
                // The older tab closed and the upgrade ran: the page can stop asking.
                if (blocked) this.setBlocked(false);
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
                this.setBlocked(true);
            };
        });
    }

    /**
     * Stores the served rows of the level file that starts at position offset: each row in the words store
     * (by word), in transactions of putBatchRows rows, then — last, in one transaction — the file's words in
     * order at [level, offset] and its entry in the level's file index, so a level reads as populated only
     * once all its words are in. Storing the same chunk twice is a no-op.
     */
    async putChunk(locale: string, level: Level, offset: number, rows: WordRow[]): Promise<void> {
        try {
            for (let start = 0; start < rows.length; start += this.putBatchRows) {
                await this.write(locale, (words) =>
                    rows.slice(start, start + this.putBatchRows).forEach((row) => words.put({ word: row[0] as string, row } satisfies StoredWord)),
                );
            }
            const fileWords = rows.map((row) => row[0] as string);
            await this.write(locale, (_words, positions) => {
                positions.put(fileWords, [level, offset]);
                const index = positions.get([level, FILES_KEY]) as IDBRequest<LevelFiles | undefined>;
                // Chained in the success callback, while the transaction is still active.
                index.onsuccess = () => {
                    const files = (index.result ?? []).filter(([start]) => start !== offset);
                    positions.put([...files, [offset, fileWords.length]].sort((a, b) => a[0] - b[0]), [level, FILES_KEY]);
                };
            });
        } finally {
            this.clearLocaleCaches(locale);
        }
    }

    /** One readwrite transaction over both stores of the locale; a throw inside `fill` writes nothing. */
    private async write(locale: string, fill: (words: IDBObjectStore, positions: IDBObjectStore) => void): Promise<void> {
        await this.ensureDBInitialized();
        await new Promise<void>((resolve, reject) => {
            const transaction = this.startTransaction([wordsStoreFor(locale), positionsStoreFor(locale)], 'readwrite');
            const fail = () => {
                this.logger.error('Transaction Error', transaction.error?.message);
                reject(transaction.error ?? new Error('transaction aborted'));
            };
            transaction.oncomplete = () => resolve();
            transaction.onerror = fail;
            transaction.onabort = fail;
            try {
                fill(transaction.objectStore(wordsStoreFor(locale)), transaction.objectStore(positionsStoreFor(locale)));
            } catch (error) {
                // A malformed row (e.g. no word) throws synchronously: write none of the batch.
                transaction.abort();
                reject(error);
            }
        });
    }

    /** Empties the words and positions stores of every locale (the served word data changed). */
    async clearWordStores(): Promise<void> {
        await this.ensureDBInitialized();
        const names = LocalesConfig.flatMap(({ lang }: LocaleConfig) => [wordsStoreFor(lang), positionsStoreFor(lang)]);
        try {
            await new Promise<void>((resolve, reject) => {
                const transaction = this.startTransaction(names, 'readwrite');
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
                transaction.onabort = () => reject(transaction.error ?? new Error('transaction aborted'));
                names.forEach((name) => transaction.objectStore(name).clear());
            });
        } finally {
            LocalesConfig.forEach(({ lang }: LocaleConfig) => this.clearLocaleCaches(lang));
        }
    }

    /** True when a stored level file holds the level's last served position (minimumPopulatedCount - 1). */
    async checkIfPopulated(locale: string, level: string, minimumPopulatedCount: number): Promise<boolean> {
        const cacheKey = `${locale}_${level}_${minimumPopulatedCount}`;
        if (this.isPopulatedMap.get(cacheKey)) return true;

        await this.ensureDBInitialized();
        try {
            const isPopulated = fileHolding(await this.levelFiles(locale, level), minimumPopulatedCount - 1) !== undefined;
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

    /** The level's file index ([[start, length], …]), read once and kept until the locale's stores change. */
    private async levelFiles(locale: string, level: string): Promise<LevelFiles> {
        const cacheKey = `${locale}_${level}_${FILES_KEY}`;
        const cached = this.positionsCache.get(cacheKey) as LevelFiles | undefined;
        if (cached) return cached;
        const store = this.startTransaction([positionsStoreFor(locale)], 'readonly').objectStore(positionsStoreFor(locale));
        const files = ((await requestResult(store.get([level, FILES_KEY]))) as LevelFiles | undefined) ?? [];
        if (files.length) this.positionsCache.set(cacheKey, files);
        return files;
    }

    /** The words of the level files starting at `starts`, read once and kept until the locale's stores change. */
    private async levelFileWords(locale: string, level: string, starts: number[]): Promise<Map<number, string[]>> {
        const files = new Map<number, string[]>();
        const missing = starts.filter((start) => {
            const cached = this.positionsCache.get(`${locale}_${level}_${start}`) as string[] | undefined;
            if (cached) files.set(start, cached);
            return !cached;
        });
        if (missing.length) {
            const store = this.startTransaction([positionsStoreFor(locale)], 'readonly').objectStore(positionsStoreFor(locale));
            const read = await Promise.all(missing.map((start) => requestResult(store.get([level, start]) as IDBRequest<string[] | undefined>)));
            missing.forEach((start, i) => {
                const words = read[i];
                if (!Array.isArray(words)) return;
                this.positionsCache.set(`${locale}_${level}_${start}`, words);
                files.set(start, words);
            });
        }
        return files;
    }

    /**
     * Records at the given positions of the level: each position's word from its level file, then the
     * records by word in one readonly transaction; a position not stored is skipped.
     */
    async getWordsAt(locale: string, level: string, positions: number[]): Promise<WordRecord[]> {
        await this.ensureDBInitialized();
        const index = await this.levelFiles(locale, level);
        const holding = positions.map((position) => fileHolding(index, position));
        const files = await this.levelFileWords(locale, level, [...new Set(holding.flatMap((file) => (file ? [file[0]] : [])))]);
        const drawn = positions
            .map((position, i) => {
                const file = holding[i];
                return file ? files.get(file[0])?.[position - file[0]] : undefined;
            })
            .filter((word): word is string => word !== undefined);
        if (!drawn.length) return [];
        const words = this.startTransaction([wordsStoreFor(locale)], 'readonly').objectStore(wordsStoreFor(locale));
        const stored = await Promise.all(drawn.map((word) => requestResult(words.get(word) as IDBRequest<StoredWord | undefined>)));
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
                this.positionsCache.clear();
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
