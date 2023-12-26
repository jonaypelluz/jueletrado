import dotenv from 'dotenv';
import { indexedDB } from 'fake-indexeddb';

global.indexedDB = indexedDB;

dotenv.config();
