import LevelsConfig from 'src/config/LevelConfig';
import Logger from './Logger';

const DB_NAME = 'jueletrado-db';
const DB_VERSION = 1;

class DBService {
    private db: IDBDatabase | null = null;
    private isPopulatedMap: Map<string, boolean> = new Map();
    private activeTransactions: Set<IDBTransaction> = new Set();
    private operationQueue: (() => Promise<void>)[] = [];
    private isProcessingQueue: boolean = false;

    private storeName: string = '';

    setStoreName(level: string) {
        this.storeName = `words_level_${level}`;
    }

    startTransaction(mode: IDBTransactionMode): IDBTransaction {
        if (!this.db) {
            throw new Error('Database has not been initialized');
        }

        const transaction = this.db.transaction([this.storeName], mode);
        this.activeTransactions.add(transaction);

        const completionCallback = () => this.activeTransactions.delete(transaction);
        transaction.oncomplete = completionCallback;
        transaction.onerror = completionCallback;
        transaction.onabort = completionCallback;

        return transaction;
    }

    abortAllTransactions() {
        this.activeTransactions.forEach((transaction) => {
            try {
                transaction.abort();
            } catch (error) {
                Logger.error('Error aborting transaction:', error);
            }
        });

        this.activeTransactions.clear();
    }

    async ensureDBInitialized(): Promise<void> {
        if (!this.db) {
            await this.initDB();
        }
    }

    async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                LevelsConfig.forEach((config) => {
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
                Logger.error('DB Initialization Error', request.error?.message);
                reject(`Database error: ${request.error?.message}`);
            };

            request.onblocked = () => {
                Logger.warn('DB Initialization Blocked', 'The database request was blocked.');
            };
        });
    }

    async addWords(level: string, words: string[], minimumPopulatedCount: number): Promise<void> {
        const populated = await this.checkIfPopulated(level, minimumPopulatedCount);
        if (populated) {
            Logger.log(
                `The database is already populated for level ${level}. Skipping adding words.`,
            );
            return;
        }

        return new Promise((resolve, reject) => {
            this.enqueueOperation(async () => {
                await this.ensureDBInitialized();
                const transaction = this.startTransaction('readwrite');
                const store = transaction.objectStore(this.storeName);

                for (const word of words) {
                    store.add(word);
                }

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => {
                    Logger.error('Transaction Error', transaction.error?.message);
                    reject(transaction.error);
                };
            });
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
                        Logger.error(`Error getting all words: ${request.error?.message}`);
                        reject(request.error);
                    };
                })
                .catch(reject);
        });
    }

    async checkIfPopulated(level: string, minimumPopulatedCount: number): Promise<boolean> {
        if (this.isPopulatedMap.get(level)) {
            Logger.log(`Database check: Already marked as populated for level ${level}.`);
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
                        Logger.log(
                            `Database check: Populated status for level ${level} - ${isPopulated}`,
                        );
                        resolve(isPopulated);
                    };

                    request.onerror = () => {
                        Logger.error(
                            `Error checking if populated for level ${level}: ${request.error?.message}`,
                        );
                        reject(request.error);
                    };
                })
                .catch(reject);
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
                        Logger.error(`Error counting records: ${countRequest.error?.message}`);
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

            this.abortAllTransactions();

            const request = indexedDB.deleteDatabase(DB_NAME);

            request.onsuccess = () => {
                this.isPopulatedMap.clear();
                Logger.log('Database successfully deleted');
                resolve();
            };

            request.onerror = () => {
                Logger.error('Error deleting database', request.error?.message);
                reject(request.error);
            };

            request.onblocked = () => {
                Logger.warn('Database deletion blocked. Retrying...');
                setTimeout(() => {
                    this.deleteDatabase().then(resolve).catch(reject);
                }, 1000);
            };
        });
    }

    private async processQueue() {
        if (this.isProcessingQueue || this.operationQueue.length === 0) {
            return;
        }
        this.isProcessingQueue = true;
        const operation = this.operationQueue.shift();
        if (operation) {
            await operation();
        }
        this.isProcessingQueue = false;
        this.processQueue();
    }

    private enqueueOperation(operation: () => Promise<void>) {
        this.operationQueue.push(operation);
        this.processQueue();
    }
}

export const dbService = new DBService();
