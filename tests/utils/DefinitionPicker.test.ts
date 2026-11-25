import { Definition } from '@models/types';
import { clueDefinitionsForLevel, formatDefinition, getDefinitionForLevel } from '@utils/DefinitionPicker';

const def = (number: number | string): Definition =>
    ({ number, type: 'sustantivo', definition: `definición ${number}` }) as Definition;

const DEFINITIONS: Definition[] = [def(1), def('2'), def(3), def(4), def(5)];

describe('getDefinitionForLevel', () => {
    beforeEach(() => {
        // 0.999 always picks the last eligible definition.
        jest.spyOn(Math, 'random').mockReturnValue(0.999);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test.each([
        ['beginner', 1],
        ['intermediate', 3],
        ['advanced', 5],
        [null, 5],
    ])('for level %p picks only among eligible definitions (last = %p)', (level, expectedNumber) => {
        expect(getDefinitionForLevel(DEFINITIONS, level).number).toBe(expectedNumber);
    });

    test('falls back to all definitions when none matches the level', () => {
        expect(getDefinitionForLevel([def(4), def(5)], 'beginner').number).toBe(5);
    });

    test('treats a string definition number as numeric for beginner', () => {
        expect(getDefinitionForLevel([def('1'), def(2)], 'beginner').number).toBe('1');
    });
});

describe('clueDefinitionsForLevel', () => {
    const sense = (number: number, definition: string): Definition => ({ number, type: 'nombre', definition });

    test('drops the senses that contain the headword, within the level', () => {
        const senses = [sense(1, 'Cría del Gato.'), sense(2, 'Animal felino.'), sense(4, 'Herramienta.')];
        expect(clueDefinitionsForLevel('gato', senses, 'intermediate')).toEqual([sense(2, 'Animal felino.')]);
    });

    test('is empty when every eligible sense reveals the word', () => {
        expect(clueDefinitionsForLevel('gato', [sense(1, 'Relativo al gato.'), sense(2, 'Animal.')], 'beginner')).toEqual([]);
    });
});

describe('formatDefinition', () => {
    test.each([
        ['animal doméstico. Otra cosa', 'Animal doméstico'],
        ['a', 'A'],
        ['', ''],
    ])('formats %p as %p', (input, expected) => {
        expect(formatDefinition(input)).toBe(expected);
    });
});
