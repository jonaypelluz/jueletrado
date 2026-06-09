import LevelsConfig from '@config/LevelConfig';
import LocalesConfig from '@config/LocaleConfig';
import { LevelConfig, LocaleConfig } from '@models/types';
import Logger from '@services/Logger';

const DB_NAME = 'jueletrado-db';
const DB_VERSION = 1;

export interface IDbServiceOptions {
    dbFactory: IDBFactory;
    logger: typeof Logger;
}

class DBService {
    private db: IDBDatabase | null = null;
    private isPopulatedMap: Map<string, boolean> = new Map();

    private storeName: string = '';
    private logger: typeof Logger;
    private dbFactory: IDBFactory;

    constructor(options: IDbServiceOptions) {
        this.dbFactory = options.dbFactory;
        this.logger = options.logger;
    }

    setStoreName(level: string, locale: string) {
        this.storeName = `words_level_${level}_${locale}`;
    }

    getStoreName() {
        return this.storeName;
    }

    startTransaction(mode: IDBTransactionMode): IDBTransaction {
        if (!this.db) {
            throw new Error('Database has not been initialized');
        }

        const transaction = this.db.transaction([this.storeName], mode);

        return transaction;
    }

    async ensureDBInitialized(): Promise<void> {
        if (!this.db) {
            await this.initDB();
        }
    }

    async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = this.dbFactory.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                LevelsConfig.forEach((config: LevelConfig) => {
                    LocalesConfig.forEach((locale: LocaleConfig) => {
                        const storeName = `words_level_${config.level}_${locale.lang}`;
                        if (!db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName, { autoIncrement: true });
                        }
                    });
                });
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onerror = () => {
                this.logger.error('DB Initialization Error', request.error?.message);
                reject(`Database error: ${request.error?.message}`);
            };

            request.onblocked = () => {
                this.logger.warn('DB Initialization Blocked', 'The database request was blocked.');
            };
        });
    }

    async addWords(
        level: string,
        locale: string,
        words: string[],
        minimumPopulatedCount: { [key: string]: number },
    ): Promise<void> {
        const populated = await this.checkIfPopulated(level, locale, minimumPopulatedCount[locale]);
        if (populated) {
            this.logger.log(
                `The database is already populated for level ${level}. Skipping adding words.`,
            );
            return;
        }

        return new Promise((resolve, reject) => {
            this.ensureDBInitialized()
                .then(() => {
                    const transaction = this.startTransaction('readwrite');
                    const store = transaction.objectStore(this.storeName);

                    for (const word of words) {
                        store.add(word);
                    }

                    transaction.oncomplete = () => resolve();
                    transaction.onerror = () => {
                        this.logger.error('Transaction Error', transaction.error?.message);
                        reject(transaction.error);
                    };
                })
                .catch(reject);
        });
    }

    async getAllWords(): Promise<string[] | undefined> {
        return new Promise((resolve, reject) => {
            this.ensureDBInitialized()
                .then(() => {
                    const transaction = this.startTransaction('readonly');
                    const store = transaction.objectStore(this.storeName);
                    const request = store.getAll();

                    request.onsuccess = () => {
                        resolve(request.result as string[]);
                    };

                    request.onerror = () => {
                        this.logger.error(`Error getting all words: ${request.error?.message}`);
                        reject(request.error);
                    };
                })
                .catch(reject);
        });
    }

    async checkIfPopulated(
        level: string,
        locale: string,
        minimumPopulatedCount: number,
    ): Promise<boolean> {
        if (this.isPopulatedMap.get(`${level}_${locale}`)) {
            this.logger.log(`Database check: Already marked as populated for level ${level}.`);
            return true;
        }

        return new Promise((resolve, reject) => {
            this.ensureDBInitialized()
                .then(() => {
                    const transaction = this.startTransaction('readonly');
                    const store = transaction.objectStore(this.storeName);
                    const request = store.count();

                    request.onsuccess = () => {
                        const isPopulated = request.result > minimumPopulatedCount;
                        this.isPopulatedMap.set(`${level}_${locale}`, isPopulated);
                        this.logger.log(
                            `Database check: Populated status for ${level} ${locale} - ${isPopulated}`,
                        );
                        resolve(isPopulated);
                    };

                    request.onerror = () => {
                        this.logger.error(
                            `Error checking if populated for ${level} ${locale}: ${request.error?.message}`,
                        );
                        reject(request.error);
                    };
                })
                .catch(reject);
        });
    }

    async getRandomWordsWithMaxLength(
        count: number,
        maxLength: number,
        minLength = 3,
    ): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const fetchAndFilterWords = async (attempt = 1) => {
                const maxAttempts = 5;
                const sampleSize = count * attempt * 2;

                try {
                    const words = await this.getRandomWords(sampleSize);
                    const filteredWords = words.filter(
                        (word) => word.length >= minLength && (maxLength === Infinity || word.length < maxLength),
                    );

                    if (filteredWords.length >= count || attempt >= maxAttempts) {
                        resolve(filteredWords.slice(0, count));
                    } else {
                        await fetchAndFilterWords(attempt + 1);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            fetchAndFilterWords();
        });
    }

    async getRandomWords(count: number): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.ensureDBInitialized()
                .then(() => {
                    const transaction = this.startTransaction('readonly');
                    const store = transaction.objectStore(this.storeName);
                    const countRequest = store.count();

                    countRequest.onsuccess = () => {
                        const totalRecords = countRequest.result;
                        if (totalRecords === 0) {
                            resolve([]);
                            return;
                        }

                        const randomKeys = new Set<number>();
                        while (randomKeys.size < count) {
                            const randomIndex = Math.floor(Math.random() * totalRecords) + 1;
                            randomKeys.add(randomIndex);
                        }

                        const wordPromises = Array.from(randomKeys).map((key) => {
                            return new Promise<string>((resolve, reject) => {
                                const wordRequest = store.get(key);
                                wordRequest.onsuccess = () => resolve(wordRequest.result as string);
                                wordRequest.onerror = () => reject(wordRequest.error);
                            });
                        });

                        Promise.all(wordPromises).then(resolve).catch(reject);
                    };

                    countRequest.onerror = () => {
                        this.logger.error(`Error counting records: ${countRequest.error?.message}`);
                        reject(countRequest.error);
                    };
                })
                .catch(reject);
        });
    }

    async deleteDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close();
                this.db = null;
            }

            const request = indexedDB.deleteDatabase(DB_NAME);

            request.onsuccess = () => {
                this.isPopulatedMap.clear();
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
