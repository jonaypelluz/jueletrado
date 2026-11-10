import { WordFilter } from '@models/types';

/** Candidate words drawn to pick the chain's first word: SEED_POOL_SIZE words matching SEED_QUERY. */
export const SEED_POOL_SIZE = 20;
export const SEED_QUERY: WordFilter = { minLen: 4 };
