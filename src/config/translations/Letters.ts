const commonConsonants: string[] = [
    'b',
    'c',
    'd',
    'f',
    'g',
    'h',
    'j',
    'k',
    'l',
    'm',
    'n',
    'p',
    'q',
    'r',
    's',
    't',
    'v',
    'w',
    'x',
    'y',
    'z',
];

const consonants: { [key: string]: string[] } = {
    en: [...commonConsonants],
    es: [...commonConsonants, 'ñ'],
};

const vowels: string[] = ['a', 'e', 'i', 'o', 'u'];

export { vowels, consonants };
