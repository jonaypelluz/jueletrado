import Logger from './Logger';

const DB_NAME = 'jueletrado-db';
const STORE_NAME = 'words';
const DB_VERSION = 1;

class DBService {
    db: IDBDatabase | null = null;
    isPopulated: boolean = false;

    async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            request.onupgradeneeded = (_event) => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { autoIncrement: true });
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            request.onsuccess = (_event) => {
                this.db = request.result;
                resolve();
            };

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            request.onerror = (_event) => {
                reject(`Database error: ${request.error?.message}`);
            };
        });
    }

    async addWords(words: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database has not been initialized');
                return;
            }

            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            for (const word of words) {
                store.add(word);
            }

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    getWord(id: number): Promise<string | undefined> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database has not been initialized');
                return;
            }

            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result as string);
            };

            request.onerror = () => {
                reject(`Error reading word: ${request.error?.message}`);
            };
        });
    }

    async checkIfPopulated(): Promise<boolean> {
        if (this.isPopulated) {
            Logger.log('Database check: Already marked as populated.');
            return true;
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database has not been initialized');
                return;
            }

            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.count();

            request.onsuccess = () => {
                this.isPopulated = request.result > 0;
                Logger.log(`Database check: Populated status - ${this.isPopulated}`);
                resolve(this.isPopulated);
            };

            request.onerror = () => {
                reject(`Error checking if populated: ${request.error?.message}`);
            };
        });
    }

    async getRandomWord(): Promise<string | undefined> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database has not been initialized');
                return;
            }

            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.count();

            request.onsuccess = () => {
                const totalCount = request.result;

                const randomIndex = Math.floor(Math.random() * totalCount);

                const requestCursor = store.openCursor();
                let currentIndex = 0;

                requestCursor.onsuccess = () => {
                    const cursor = requestCursor.result;
                    if (cursor) {
                        if (currentIndex === randomIndex) {
                            resolve(cursor.value as string);
                        } else {
                            currentIndex++;
                            cursor.continue();
                        }
                    } else {
                        resolve(undefined);
                    }
                };

                requestCursor.onerror = () => {
                    reject(`Error retrieving random word: ${requestCursor.error?.message}`);
                };
            };

            request.onerror = () => {
                reject(`Error counting words: ${request.error?.message}`);
            };
        });
    }
}

export const dbService = new DBService();
