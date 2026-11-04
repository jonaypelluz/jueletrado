export const DEFINITION_LETTERS: readonly string[] = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
];

export const LETTERS_WITHOUT_DEFINITIONS: Record<string, ReadonlySet<string>> = {
    es: new Set(['x']),
    en: new Set(['j', 'k', 'l', 'x', 'z']),
};
