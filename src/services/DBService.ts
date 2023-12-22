import Logger from './Logger';

const DB_NAME = 'jueletrado-db';
const STORE_NAME = 'words';
const DB_VERSION = 1;
export const MINIMUM_POPULATED_COUNT = 108789;

class DBService {
    private db: IDBDatabase | null = null;
    private isPopulated: boolean = false;
    private activeTransactions: IDBTransaction[] = [];
    private operationQueue: (() => Promise<void>)[] = [];
    private isProcessingQueue: boolean = false;

    startTransaction(storeNames: string[], mode: IDBTransactionMode): IDBTransaction {
        if (!this.db) {
            throw new Error('Database has not been initialized');
        }

        const transaction = this.db.transaction(storeNames, mode);
        this.activeTransactions.push(transaction);

        transaction.oncomplete =
            transaction.onerror =
            transaction.onabort =
                () => {
                    this.activeTransactions = this.activeTransactions.filter(
                        (tr) => tr !== transaction,
                    );
                };

        return transaction;
    }

    abortAllTransactions() {
        this.activeTransactions.forEach((transaction) => transaction.abort());
        this.activeTransactions = [];
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
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { autoIncrement: true });
                }
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

    async addWords(words: string[]): Promise<void> {
        const populated = await this.checkIfPopulated();
        if (populated) {
            Logger.log('The database is already populated. Skipping adding words.');
            return;
        }

        return new Promise((resolve, reject) => {
            this.enqueueOperation(async () => {
                await this.ensureDBInitialized();
                const transaction = this.startTransaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);

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
                    const transaction = this.startTransaction([STORE_NAME], 'readonly');
                    const store = transaction.objectStore(STORE_NAME);
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

    async checkIfPopulated(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.isPopulated) {
                Logger.log('Database check: Already marked as populated.');
                resolve(true);
                return;
            }

            this.ensureDBInitialized()
                .then(() => {
                    const transaction = this.startTransaction([STORE_NAME], 'readonly');
                    const store = transaction.objectStore(STORE_NAME);
                    const request = store.count();

                    request.onsuccess = () => {
                        this.isPopulated = request.result > MINIMUM_POPULATED_COUNT;
                        Logger.log(`Database check: Populated status - ${this.isPopulated}`);
                        resolve(this.isPopulated);
                    };

                    request.onerror = () => {
                        Logger.error(`Error checking if populated: ${request.error?.message}`);
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
                    const transaction = this.startTransaction([STORE_NAME], 'readonly');
                    const store = transaction.objectStore(STORE_NAME);
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
