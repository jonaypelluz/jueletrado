import { compareSpelling, isUsableClue, pickHint, revealsWord } from '@utils/SpellingComparer';

describe('compareSpelling', () => {
    test.each([
        ['árbol', 'árbol'],
        ['ÁRBOL', 'árbol'],
        ['  árbol ', 'árbol'],
        ['árbol'.normalize('NFD'), 'árbol'],
    ])('treats %p as an exact spelling of %p', (guess, target) => {
        expect(compareSpelling(guess, target)).toBe('exact');
    });

    test.each([
        ['arbol', 'árbol'],
        ['árból', 'árbol'],
        ['pinguino', 'pingüino'],
    ])('treats %p as an accent miss of %p', (guess, target) => {
        expect(compareSpelling(guess, target)).toBe('accent-miss');
    });

    test.each([
        ['nino', 'niño'],
        ['', 'árbol'],
        ['   ', 'árbol'],
        ['casa', 'árbol'],
    ])('treats %p as a wrong spelling of %p', (guess, target) => {
        expect(compareSpelling(guess, target)).toBe('wrong');
    });
});

describe('pickHint', () => {
    test.each([
        [0, { length: 4, firstLetter: null, lastLetter: null }],
        [1, { length: 4, firstLetter: 'c', lastLetter: null }],
        [2, { length: 4, firstLetter: 'c', lastLetter: 'a' }],
        [3, { length: 4, firstLetter: 'c', lastLetter: 'a' }],
        [4, { length: 4, firstLetter: 'c', lastLetter: 'a' }],
    ])('after %i failed attempts gives the hint %p', (failedAttempts, expected) => {
        expect(pickHint('casa', failedAttempts)).toEqual(expected);
    });

    test('counts letters of an NFD word as composed characters', () => {
        expect(pickHint('pingüino'.normalize('NFD'), 0).length).toBe(8);
    });

    test('gives the composed first letter of an NFD word', () => {
        expect(pickHint('árbol'.normalize('NFD'), 1).firstLetter).toBe('á');
    });
});

describe('revealsWord', () => {
    test.each([
        ['Animal que tiene gato en su nombre', 'gato', true],
        ['El Gato es un felino doméstico', 'gato', true],
        ['Felino doméstico de compañía', 'gato', false],
    ])('for definition %p and word %p returns %p', (definition, word, expected) => {
        expect(revealsWord(definition, word)).toBe(expected);
    });
});

describe('isUsableClue', () => {
    const VALID_DEFINITION = 'Vivienda donde habita una familia';

    test.each([
        ['es', { word: 'casa', definition: VALID_DEFINITION, type: 'verb' }, false],
        ['es', { word: 'casa', definition: VALID_DEFINITION, type: 'Noun phrase' }, false],
        ['es', { word: 'casa', definition: VALID_DEFINITION, type: 'sustantivo' }, true],
        ['en', { word: 'house', definition: 'Building where a family lives', type: 'verb' }, true],
        ['es', { word: 'casa', definition: 'Ya', type: 'sustantivo' }, false],
        ['es', { word: 'casa', definition: 'abcde fghi', type: 'sustantivo' }, false],
        ['es', { word: 'casa', definition: 'abcde fghij', type: 'sustantivo' }, true],
        ['es', { word: 'casa', definition: ': 1234567890', type: 'sustantivo' }, false],
        ['es', { word: 'casa', definition: 'Una casa grande donde vive gente', type: 'sustantivo' }, false],
        ['es', { word: 'casa', definition: VALID_DEFINITION, type: 'nombre', typeExtra: 'coloquial, sin verificar' }, false],
        ['es', { word: 'casa', definition: VALID_DEFINITION, type: 'nombre', typeExtra: 'coloquial' }, true],
        ['en', { word: 'house', definition: 'Building where a family lives', type: 'noun', typeExtra: 'sin verificar' }, true],
    ])('in locale %p for clue %p returns %p', (locale, clue, expected) => {
        expect(isUsableClue(clue, locale)).toBe(expected);
    });
});
