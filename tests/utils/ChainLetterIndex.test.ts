import {
    DEAD_END_THRESHOLD,
    buildFirstLetterIndex,
    isDeadEndLetter,
    normalizeChainLetter,
    validateChainWord,
} from '@utils/ChainLetterIndex';

const bulk = (letter: string, n: number): string[] =>
    Array.from({ length: n }, (_, i) => `${letter}aa${i}`);

describe('normalizeChainLetter', () => {
    test.each([
        ['á', 'a'],
        ['é', 'e'],
        ['í', 'i'],
        ['ó', 'o'],
        ['ú', 'u'],
        ['ü', 'u'],
        ['Á', 'a'],
        ['n', 'n'],
        ['ñ', 'ñ'],
        ['Ñ', 'ñ'],
        ['º', 'º'],
        ['1', '1'],
    ])('normalizes %s to %s', (input, expected) => {
        expect(normalizeChainLetter(input)).toBe(expected);
    });
});

describe('buildFirstLetterIndex', () => {
    test('counts words by first letter ignoring accents', () => {
        const index = buildFirstLetterIndex(['árbol', 'arco', 'ala']);

        expect(index.get('a')).toBe(3);
        expect(index.has('á')).toBe(false);
    });

    test('keeps ñ apart from n and ignores words shorter than 3 letters', () => {
        const index = buildFirstLetterIndex(['ñu', 'ñandú', 'no']);

        expect(index.get('ñ')).toBe(1);
        expect(index.has('n')).toBe(false);
    });
});

describe('isDeadEndLetter', () => {
    test('exposes a threshold of 50', () => {
        expect(DEAD_END_THRESHOLD).toBe(50);
    });

    test.each([
        ['a', 49, true],
        ['a', 50, false],
        ['á', 50, false],
    ])('letter %s with %i words starting by a is dead-end: %s', (letter, count, expected) => {
        expect(isDeadEndLetter(letter, new Map([['a', count]]))).toBe(expected);
    });

    test('a letter missing from the index is a dead-end', () => {
        expect(isDeadEndLetter('j', new Map([['a', 100]]))).toBe(true);
    });

    test('works on an index built from real words', () => {
        const index = buildFirstLetterIndex([...bulk('o', 50), ...bulk('p', 49)]);

        expect(isDeadEndLetter('o', index)).toBe(false);
        expect(isDeadEndLetter('p', index)).toBe(true);
    });
});

describe('validateChainWord', () => {
    const wordSet = new Set(['arco', 'árbol', 'al', 'oso', 'arroz', 'ñandú', 'nube']);
    const index = new Map(
        ['a', 'o', 'l', 'r', 'n', 'ñ', 'u', 'e'].map((letter) => [letter, DEAD_END_THRESHOLD]),
    );
    const validate = (raw: string, requiredLetter: string, used: string[] = []) =>
        validateChainWord(raw, { requiredLetter, wordSet, used, index });

    test.each([
        ['arco', 'a', 'arco'],
        ['árbol', 'a', 'árbol'],
        ['arco', 'á', 'arco'],
        ['arco', 'A', 'arco'],
        ['ñandú', 'ñ', 'ñandú'],
    ])('accepts %s when the required letter is %s', (raw, requiredLetter, word) => {
        expect(validate(raw, requiredLetter)).toEqual({ ok: true, word });
    });

    test('returns the word trimmed, lowercased and NFC-normalized', () => {
        expect(validate('  ÁRBOL '.normalize('NFD'), 'a')).toEqual({ ok: true, word: 'árbol' });
    });

    test.each([
        ['wrong-letter', 'oso', 'a', []],
        ['wrong-letter', 'nube', 'ñ', []],
        ['wrong-letter', 'ñandú', 'n', []],
        ['too-short', 'al', 'a', []],
        ['not-in-dictionary', 'arbol', 'a', []],
        ['repeated', 'arco', 'a', ['arco']],
        ['dead-end', 'arroz', 'a', []],
    ])('rejects with %s: %s for letter %s', (reason, raw, requiredLetter, used) => {
        expect(validate(raw, requiredLetter, used)).toEqual({ ok: false, reason });
    });

    test.each([
        ['wrong-letter over too-short', 'os', 'a', [], 'wrong-letter'],
        ['too-short over not-in-dictionary', 'ax', 'a', [], 'too-short'],
        ['not-in-dictionary over dead-end', 'aroz', 'a', [], 'not-in-dictionary'],
        ['repeated over dead-end', 'arroz', 'a', ['arroz'], 'repeated'],
    ])('applies %s', (_label, raw, requiredLetter, used, reason) => {
        expect(validate(raw, requiredLetter, used)).toEqual({ ok: false, reason });
    });
});
