import { WordRecord } from '@models/types';
import { filterDefinitions, matchesQuery } from '@utils/WordQuery';

const record = (overrides: Partial<WordRecord> = {}): WordRecord => ({
    word: 'camino',
    locale: 'es',
    level: 'beginner',
    levels: ['beginner'],
    freqRank: 800,
    length: 6,
    syllables: 3,
    stressedSyllable: 1,
    firstLetter: 'c',
    lastLetter: 'o',
    letters: 'acimno',
    pos: 'nombre masculino',
    senseCount: 1,
    source: 'rae',
    hasAccent: 0,
    hasEnye: 0,
    hasDieresis: 0,
    hasTl: 0,
    hasDiphthong: 0,
    hasHiatus: 0,
    isPlural: 0,
    isVerbForm: 0,
    ...overrides,
});

describe('matchesQuery', () => {
    test('level matches pool membership, not the computed level', () => {
        const multiLevel = record({ level: 'intermediate', levels: ['intermediate', 'advanced'] });

        expect(matchesQuery(multiLevel, { level: 'advanced' })).toBe(true);
        expect(matchesQuery(multiLevel, { level: 'intermediate' })).toBe(true);
        expect(matchesQuery(multiLevel, { level: 'beginner' })).toBe(false);
    });

    test.each([
        [3, false],
        [4, true],
        [6, true],
        [7, false],
    ])('minLen 4 / maxLen 6 are inclusive (length %i → %s)', (length, expected) => {
        expect(matchesQuery(record({ length }), { minLen: 4, maxLen: 6 })).toBe(expected);
    });

    test('a maximum alone applies no implicit minimum length', () => {
        expect(matchesQuery(record({ word: 'ni', length: 2 }), { maxLen: 4 })).toBe(true);
    });

    test('exclude rejects a record whose flag is set and keeps one whose flag is clear', () => {
        expect(matchesQuery(record({ word: 'atleta', hasTl: 1 }), { exclude: { hasTl: true } })).toBe(false);
        expect(matchesQuery(record({ hasTl: 0 }), { exclude: { hasTl: true } })).toBe(true);
    });

    test.each([
        [1, false],
        [2, true],
        [null, false],
    ])('minSyllables 2 with %p syllables → %s', (syllables, expected) => {
        expect(matchesQuery(record({ syllables }), { minSyllables: 2 })).toBe(expected);
    });

    test('an empty filter matches every record', () => {
        expect(matchesQuery(record(), {})).toBe(true);
    });
});

describe('filterDefinitions', () => {
    const senses = (count: number) => ({ definitions: Array.from({ length: count }, (_, i) => ({ number: i + 1, type: 'nombre', definition: `d${i}` })) });

    test('minSenses keeps only entries with at least that many senses', () => {
        const file = { casa: senses(3), cama: senses(1) };

        expect(Object.keys(filterDefinitions(file, { minSenses: 2 }))).toEqual(['casa']);
    });

    test('minLen counts characters, not UTF-16 units', () => {
        // 'a😀b' is 4 UTF-16 units but 3 characters, so it is too short.
        const file = { ñandú: senses(1), sol: senses(1), 'a😀b': senses(1) };

        expect(Object.keys(filterDefinitions(file, { minLen: 4 }))).toEqual(['ñandú']);
    });

    test('keeps a `constructor` entry as an own key', () => {
        const file = { constructor: senses(2) } as Record<string, ReturnType<typeof senses>>;

        const filtered = filterDefinitions(file, { minSenses: 1 });

        expect(Object.hasOwn(filtered, 'constructor')).toBe(true);
        expect(filtered.constructor).toEqual(senses(2));
    });
});

describe('filterDefinitions without options', () => {
    test('returns the same file object when no filter option is given', () => {
        const file = { casa: { definitions: [{ number: 1, type: 'nombre', definition: 'd' }] } };

        expect(filterDefinitions(file, {})).toBe(file);
    });
});
