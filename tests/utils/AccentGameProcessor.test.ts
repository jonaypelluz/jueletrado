import { buildChallenge, stripAccents } from '@utils/AccentGameProcessor';

describe('stripAccents', () => {
    test('removes tildes from accented vowels', () => {
        expect(stripAccents('canción')).toBe('cancion');
    });

    test('leaves ü untouched', () => {
        expect(stripAccents('pingüino')).toBe('pingüino');
    });

    test('leaves ñ untouched', () => {
        expect(stripAccents('ñoño')).toBe('ñoño');
    });
});

describe('buildChallenge', () => {
    test('builds a challenge for a word with a tilde', () => {
        const challenge = buildChallenge('canción', new Set());

        expect(challenge).not.toBeNull();
        expect(challenge?.displayed).toBe('cancion');
        expect(challenge?.accentIndex).toBe(5);
        expect(challenge?.vowelIndices).toEqual([1, 4, 5]);
    });

    test('accentIndex is -1 for a word without a tilde', () => {
        const challenge = buildChallenge('ventana', new Set());

        expect(challenge).not.toBeNull();
        expect(challenge?.accentIndex).toBe(-1);
    });

    test('rejects an ambiguous accented word whose stripped form is also valid', () => {
        const challenge = buildChallenge('maduró', new Set(['maduro', 'maduró']));

        expect(challenge).toBeNull();
    });

    test('accepts an accented word whose stripped form is not a valid word', () => {
        const challenge = buildChallenge('maduró', new Set(['maduró']));

        expect(challenge).not.toBeNull();
    });

    test('rejects words with fewer than 2 vowels', () => {
        expect(buildChallenge('pan', new Set())).toBeNull();
    });

    test('accentIndex maps to the stripped string for a tilde on the first vowel', () => {
        const challenge = buildChallenge('árbol', new Set());

        expect(challenge?.displayed).toBe('arbol');
        expect(challenge?.accentIndex).toBe(0);
        expect(challenge?.vowelIndices).toEqual([0, 3]);
    });

    test('accentIndex maps to the stripped string for a tilde on a later vowel', () => {
        const challenge = buildChallenge('cantó', new Set());

        expect(challenge?.displayed).toBe('canto');
        expect(challenge?.accentIndex).toBe(4);
        expect(challenge?.vowelIndices).toEqual([1, 4]);
    });
});
