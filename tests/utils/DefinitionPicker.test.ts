import { Definition } from '@models/types';
import { formatDefinition, getDefinitionForLevel } from '@utils/DefinitionPicker';

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

describe('formatDefinition', () => {
    test.each([
        ['animal doméstico. Otra cosa', 'Animal doméstico'],
        ['a', 'A'],
        ['', ''],
    ])('formats %p as %p', (input, expected) => {
        expect(formatDefinition(input)).toBe(expected);
    });
});
