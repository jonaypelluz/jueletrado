export const DEFINITION_LETTERS: readonly string[] = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
];

export const LETTERS_WITHOUT_DEFINITIONS: Record<string, ReadonlySet<string>> = {
    es: new Set(['x']),
    en: new Set(['j', 'k', 'l', 'x', 'z']),
};

/** Appended to an es sense's type_extra when its type was mapped from an English label (words:audit). */
export const UNVERIFIED_TYPE_MARKER = 'sin verificar';

/** Locales whose letters may have a `<letter>_definitions_advanced.json` file (the client fetches it only for these). */
export const ADVANCED_DEFINITION_LOCALES: readonly string[] = ['es'];

/**
 * File name of one letter's definitions. `advanced` names the es file of the advanced-level Wiktionary
 * entries (`<letter>_definitions_advanced.json`), split out of the main file by words:audit's isAdvancedOnly.
 */
export const definitionFileName = (letter: string, advanced = false): string =>
    `${letter}_definitions${advanced ? '_advanced' : ''}.json`;
