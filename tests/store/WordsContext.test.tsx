import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { WORDS_DATA_VERSION } from '@config/WordsDataVersion';
import { WordsContextProvider } from '@store/WordsContext';
import { WORD_CHUNK_VERSION } from '@utils/WordRecord';

const STAMP = `${WORD_CHUNK_VERSION}:${WORDS_DATA_VERSION}`;

const stored = (value: unknown) => JSON.stringify({ value, timestamp: 1 });

/** localStorage as a v1 client left it: populated levels, word queues and the settings to keep. */
const V1_STORAGE: Record<string, string> = {
    LEVELS_POPULATED: stored({ es: { beginner: true } }),
    WORDS_DAILY: stored(['gato']),
    WORDS_FINDER: stored(['casa']),
    WORDS_TOWER: stored(['perro']),
    WORDS_RAIN: stored(['mesa']),
    WORDS_ACCENT: stored(['arbol']),
    WORDS_MATCHER: stored(['vaca']),
    WORDS_SYLLABLE: stored(['camino']),
    LOCALE: stored('es'),
    SELECTED_LEVEL: stored('intermediate'),
    SELECTED_DAY_WORD: stored('sol'),
    WORD_CHAIN_BEST: stored({ es: { beginner: 7 } }),
};
const CLEARED = ['LEVELS_POPULATED', 'WORDS_DAILY', 'WORDS_FINDER', 'WORDS_TOWER', 'WORDS_RAIN', 'WORDS_ACCENT', 'WORDS_MATCHER', 'WORDS_SYLLABLE'];
const KEPT = ['LOCALE', 'SELECTED_LEVEL', 'SELECTED_DAY_WORD', 'WORD_CHAIN_BEST'];

const storedVersion = () => {
    const raw = localStorage.getItem('WORDS_DATA_VERSION');
    return raw === null ? null : JSON.parse(raw).value;
};

describe('WordsContext words data migration', () => {
    beforeEach(() => {
        localStorage.clear();
        Object.entries(V1_STORAGE).forEach(([key, raw]) => localStorage.setItem(key, raw));
    });

    afterEach(() => {
        localStorage.clear();
    });

    test('hydrating v1 storage clears the populated levels and word queues, keeps the settings byte-identical and stores the data stamp', async () => {
        render(<WordsContextProvider>{null}</WordsContextProvider>);

        await waitFor(() => expect(storedVersion()).toBe(STAMP));
        CLEARED.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
        KEPT.forEach((key) => expect(localStorage.getItem(key)).toBe(V1_STORAGE[key]));
    });

    test('once migrated, a later hydration removes nothing', async () => {
        const first = render(<WordsContextProvider>{null}</WordsContextProvider>);
        await waitFor(() => expect(storedVersion()).toBe(STAMP));
        first.unmount();
        localStorage.setItem('LEVELS_POPULATED', V1_STORAGE.LEVELS_POPULATED);
        localStorage.setItem('WORDS_FINDER', V1_STORAGE.WORDS_FINDER);

        render(<WordsContextProvider>{null}</WordsContextProvider>);

        await waitFor(() => expect(storedVersion()).toBe(STAMP));
        expect(localStorage.getItem('LEVELS_POPULATED')).toBe(V1_STORAGE.LEVELS_POPULATED);
        expect(localStorage.getItem('WORDS_FINDER')).toBe(V1_STORAGE.WORDS_FINDER);
    });
});
