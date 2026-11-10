import { Level, WordChunk, WordRecord } from '@models/types';
import { syllabify } from '@utils/SyllableSplitter';
import {
    computeLevel,
    deriveWordRecord,
    encodeRow,
    hydrateChunk,
    hydrateRow,
    stressedSyllableIndex,
} from '@utils/WordRecord';

// Field order of a v2 chunk row (the served data contract).
const CHUNK_FIELDS = ['word', 'freqRank', 'levels', 'flags', 'syllables', 'stressedSyllable', 'pos', 'senseCount', 'source'];

type Case = {
    label?: string;
    input: { word: string; locale: string; freqRank: number | null; lists: Level[]; senses?: { type: string }[] };
    // isPlural / isVerbForm are approximate heuristics: asserted in their own cases below.
    expected: Omit<WordRecord, 'isPlural' | 'isVerbForm'>;
};

const sustantivo = (count: number) => Array.from({ length: count }, () => ({ type: 'nombre femenino' }));

const CASES: Case[] = [
    {
        input: { word: 'canción', locale: 'es', freqRank: 1200, lists: ['beginner'], senses: sustantivo(2) },
        expected: {
            word: 'canción', locale: 'es', level: 'beginner', levels: ['beginner'], freqRank: 1200, length: 7,
            syllables: 2, stressedSyllable: 1, firstLetter: 'c', lastLetter: 'n', letters: 'accinnó',
            pos: 'nombre femenino', senseCount: 2, source: 'rae',
            hasAccent: 1, hasEnye: 0, hasDieresis: 0, hasTl: 0, hasDiphthong: 1, hasHiatus: 0,
        },
    },
    {
        input: { word: 'niño', locale: 'es', freqRank: 500, lists: ['beginner'], senses: [{ type: 'nombre masculino' }] },
        expected: {
            word: 'niño', locale: 'es', level: 'beginner', levels: ['beginner'], freqRank: 500, length: 4,
            syllables: 2, stressedSyllable: 0, firstLetter: 'n', lastLetter: 'o', letters: 'inoñ',
            pos: 'nombre masculino', senseCount: 1, source: 'rae',
            hasAccent: 0, hasEnye: 1, hasDieresis: 0, hasTl: 0, hasDiphthong: 0, hasHiatus: 0,
        },
    },
    {
        // Unranked word in two lists: legacy membership, computed level is the lowest list.
        input: { word: 'pingüino', locale: 'es', freqRank: null, lists: ['advanced', 'intermediate'] },
        expected: {
            word: 'pingüino', locale: 'es', level: 'intermediate', levels: ['intermediate', 'advanced'], freqRank: null, length: 8,
            syllables: 3, stressedSyllable: 1, firstLetter: 'p', lastLetter: 'o', letters: 'giinnopü',
            pos: null, senseCount: 0, source: null,
            hasAccent: 0, hasEnye: 0, hasDieresis: 1, hasTl: 0, hasDiphthong: 1, hasHiatus: 0,
        },
    },
    {
        input: { word: 'atleta', locale: 'es', freqRank: 9000, lists: ['intermediate'], senses: [{ type: 'nombre común' }] },
        expected: {
            word: 'atleta', locale: 'es', level: 'intermediate', levels: ['intermediate'], freqRank: 9000, length: 6,
            syllables: 3, stressedSyllable: 1, firstLetter: 'a', lastLetter: 'a', letters: 'aaeltt',
            pos: 'nombre común', senseCount: 1, source: 'rae',
            hasAccent: 0, hasEnye: 0, hasDieresis: 0, hasTl: 1, hasDiphthong: 0, hasHiatus: 0,
        },
    },
    {
        input: { word: 'país', locale: 'es', freqRank: 400, lists: ['beginner'], senses: [{ type: 'nombre masculino' }] },
        expected: {
            word: 'país', locale: 'es', level: 'beginner', levels: ['beginner'], freqRank: 400, length: 4,
            syllables: 2, stressedSyllable: 1, firstLetter: 'p', lastLetter: 's', letters: 'apsí',
            pos: 'nombre masculino', senseCount: 1, source: 'rae',
            hasAccent: 1, hasEnye: 0, hasDieresis: 0, hasTl: 0, hasDiphthong: 0, hasHiatus: 1,
        },
    },
    {
        input: { word: 'cuidado', locale: 'es', freqRank: 2000, lists: ['beginner'], senses: [{ type: 'nombre masculino' }] },
        expected: {
            word: 'cuidado', locale: 'es', level: 'beginner', levels: ['beginner'], freqRank: 2000, length: 7,
            syllables: 3, stressedSyllable: 1, firstLetter: 'c', lastLetter: 'o', letters: 'acddiou',
            pos: 'nombre masculino', senseCount: 1, source: 'rae',
            hasAccent: 0, hasEnye: 0, hasDieresis: 0, hasTl: 0, hasDiphthong: 1, hasHiatus: 0,
        },
    },
    {
        input: { word: 'ácido', locale: 'es', freqRank: 6000, lists: ['intermediate'], senses: [{ type: 'adjetivo' }] },
        expected: {
            word: 'ácido', locale: 'es', level: 'intermediate', levels: ['intermediate'], freqRank: 6000, length: 5,
            syllables: 3, stressedSyllable: 0, firstLetter: 'a', lastLetter: 'o', letters: 'cdioá',
            pos: 'adjetivo', senseCount: 1, source: 'rae',
            hasAccent: 1, hasEnye: 0, hasDieresis: 0, hasTl: 0, hasDiphthong: 0, hasHiatus: 0,
        },
    },
    {
        label: 'constructor (es): unranked, no senses, consonant ending stressed on the last syllable',
        input: { word: 'constructor', locale: 'es', freqRank: null, lists: ['advanced'] },
        expected: {
            word: 'constructor', locale: 'es', level: 'advanced', levels: ['advanced'], freqRank: null, length: 11,
            syllables: 3, stressedSyllable: 2, firstLetter: 'c', lastLetter: 'r', letters: 'ccnoorrsttu',
            pos: null, senseCount: 0, source: null,
            hasAccent: 0, hasEnye: 0, hasDieresis: 0, hasTl: 0, hasDiphthong: 0, hasHiatus: 0,
        },
    },
    {
        label: 'constructor (en): no syllable data, no diphthong/hiatus, source unknown (null) even with senses',
        input: { word: 'constructor', locale: 'en', freqRank: 12000, lists: ['advanced'], senses: [{ type: 'noun' }] },
        expected: {
            word: 'constructor', locale: 'en', level: 'advanced', levels: ['advanced'], freqRank: 12000, length: 11,
            syllables: null, stressedSyllable: null, firstLetter: 'c', lastLetter: 'r', letters: 'ccnoorrsttu',
            pos: 'noun', senseCount: 1, source: null,
            hasAccent: 0, hasEnye: 0, hasDieresis: 0, hasTl: 0, hasDiphthong: 0, hasHiatus: 0,
        },
    },
];

const derive = (input: Case['input'], wordSet: Set<string> = new Set()) => deriveWordRecord({ ...input, wordSet });

const caseLabel = (c: Case) => c.label ?? `${c.input.word} (${c.input.locale})`;

describe('deriveWordRecord', () => {
    test.each(CASES.map((c) => [caseLabel(c), c] as const))('derives every field of %s', (_label, { input, expected }) => {
        expect(derive(input)).toEqual(expect.objectContaining(expected));
    });

    test.each([
        ['ñandú', { firstLetter: 'ñ', lastLetter: 'u' }], // ñ kept, accented vowel stripped
        ['café', { firstLetter: 'c', lastLetter: 'e' }],
        ['üe', { firstLetter: 'u', lastLetter: 'e' }], // synthetic: ü at an edge becomes u
    ])('edge letters of %s are %o', (word, expected) => {
        expect(derive({ word, locale: 'es', freqRank: null, lists: ['beginner'] })).toEqual(expect.objectContaining(expected));
    });

    test('flags a plural whose singular is in the word set', () => {
        const wordSet = new Set(['casa', 'casas']);

        expect(derive({ word: 'casas', locale: 'es', freqRank: null, lists: ['intermediate'] }, wordSet).isPlural).toBe(1);
        expect(derive({ word: 'casa', locale: 'es', freqRank: null, lists: ['beginner'] }, wordSet).isPlural).toBe(0);
    });

    test('flags a gerund whose infinitive is in the word set as a verb form', () => {
        const wordSet = new Set(['cantar', 'cantando', 'casa']);

        expect(derive({ word: 'cantando', locale: 'es', freqRank: null, lists: ['advanced'] }, wordSet).isVerbForm).toBe(1);
        expect(derive({ word: 'casa', locale: 'es', freqRank: null, lists: ['beginner'] }, wordSet).isVerbForm).toBe(0);
    });

    test('a ranked word belongs only to its computed level, whatever lists contain it', () => {
        const record = derive({ word: 'mesa', locale: 'es', freqRank: 2, lists: ['advanced'] });

        expect(record.level).toBe('beginner');
        expect(record.levels).toEqual(['beginner']);
    });
});

describe('computeLevel', () => {
    test.each([
        [3000, 'beginner'],
        [3001, 'intermediate'],
        [10000, 'intermediate'],
        [10001, 'advanced'],
    ] as const)('frequency rank %i is %s, whatever the lists say', (rank, level) => {
        expect(computeLevel(rank, ['advanced'], 'es')).toBe(level);
    });

    test('an unranked word takes the lowest list that contains it', () => {
        expect(computeLevel(null, ['intermediate', 'advanced'], 'es')).toBe('intermediate');
    });

    test('an unranked word in no list is advanced', () => {
        expect(computeLevel(null, [], 'es')).toBe('advanced');
    });
});

describe('stressedSyllableIndex', () => {
    test.each([
        ['canción', 1],
        ['casa', 0],
        ['reloj', 1],
        ['sol', 0],
    ] as const)('%s is stressed on syllable %i', (word, index) => {
        expect(stressedSyllableIndex(syllabify(word))).toBe(index);
    });
});

describe('chunk rows', () => {
    test.each(CASES.map((c) => [caseLabel(c), c] as const))('%s survives encodeRow → hydrateRow unchanged', (_label, { input }) => {
        const record = derive(input);

        expect(hydrateRow(encodeRow(record), input.locale)).toEqual(record);
    });

    test('encodes levels and flags as bitmasks and trims trailing null/0 fields', () => {
        const pingüino = derive(CASES[2].input);

        // levels: intermediate 2 | advanced 4; flags: hasDieresis (bit 2) 4 | hasDiphthong (bit 4) 16.
        expect(encodeRow(pingüino)).toEqual(['pingüino', null, 6, 20, 3, 1]);
    });

    test('keeps a null in the middle of the row and trims only the trailing ones', () => {
        const constructorEn = derive(CASES[8].input);

        expect(encodeRow(constructorEn)).toEqual(['constructor', 12000, 4, 0, null, null, 'noun', 1]);
    });

    test('hydrateChunk returns one record per row with the chunk locale', () => {
        const chunk: WordChunk = { version: 2, locale: 'es', level: 'beginner', fields: CHUNK_FIELDS, rows: [['niño', 500, 1, 2, 2, 0, 'nombre masculino', 1, 'rae']] };

        expect(hydrateChunk(chunk)).toEqual([derive(CASES[1].input)]);
    });

    test.each([
        ['version 1', { version: 1, fields: CHUNK_FIELDS }],
        ['reordered fields', { version: 2, fields: ['freqRank', ...CHUNK_FIELDS.filter((f) => f !== 'freqRank')] }],
    ])('hydrateChunk rejects a chunk with %s', (_label, overrides) => {
        const chunk = { locale: 'es', level: 'beginner', rows: [['niño']], ...overrides } as unknown as WordChunk;

        expect(() => hydrateChunk(chunk)).toThrow('Unsupported word chunk format');
    });
});
