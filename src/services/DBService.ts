import LevelsConfig from '@config/LevelConfig';
import { LevelConfig } from '@models/types';
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

    setStoreName(level: string) {
        this.storeName = `words_level_${level}`;
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
                    const storeName = `words_level_${config.level}`;
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { autoIncrement: true });
                    }
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

    async addWords(level: string, words: string[], minimumPopulatedCount: number): Promise<void> {
        const populated = await this.checkIfPopulated(level, minimumPopulatedCount);
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

    async checkIfPopulated(level: string, minimumPopulatedCount: number): Promise<boolean> {
        if (this.isPopulatedMap.get(level)) {
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
                        this.isPopulatedMap.set(level, isPopulated);
                        this.logger.log(
                            `Database check: Populated status for level ${level} - ${isPopulated}`,
                        );
                        resolve(isPopulated);
                    };

                    request.onerror = () => {
                        this.logger.error(
                            `Error checking if populated for level ${level}: ${request.error?.message}`,
                        );
                        reject(request.error);
                    };
                })
                .catch(reject);
        });
    }

    async getRandomWordsWithMaxLength(count: number, maxLength: number): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const fetchAndFilterWords = async (attempt = 1) => {
                const maxAttempts = 5;
                const sampleSize = count * attempt * 2;

                try {
                    const words = await this.getRandomWords(sampleSize);
                    const filteredWords = words.filter((word) => word.length < maxLength);

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

const dbService = new DBService({
    dbFactory: indexedDB as IDBFactory,
    logger: Logger,
});

export { dbService };
