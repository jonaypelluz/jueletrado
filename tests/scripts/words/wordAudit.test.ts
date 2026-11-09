/**
 * @jest-environment node
 */
import { isUsableClue } from '@utils/SpellingComparer';
import {
    EN_TYPES,
    ES_TYPES,
    auditLocale,
    classifySense,
    classifyWord,
    dedupeSenses,
    normalizeType,
} from '../../../scripts/words/wordAudit';

type Locale = 'es' | 'en';

type WordSetsOverrides = Partial<Record<'allow' | 'offensive' | 'properNouns' | 'foreign' | 'abbreviations' | 'htmlXml', readonly string[]>>;

const wordSets = (overrides: WordSetsOverrides = {}) => ({
    allow: new Set(overrides.allow ?? []),
    offensive: new Set(overrides.offensive ?? []),
    properNouns: new Set(overrides.properNouns ?? []),
    foreign: new Set(overrides.foreign ?? []),
    abbreviations: new Set(overrides.abbreviations ?? []),
    htmlXml: new Set(overrides.htmlXml ?? []),
});

const ctx = (locale: Locale, overrides: WordSetsOverrides = {}) => ({ locale, wordSets: wordSets(overrides) });

const enEntry = (...senses: Array<[string, string]>) => ({
    definitions: senses.map(([definition, type], i) => ({ number: i + 1, definition, type })),
});

const sense = (definition: string, type = 'nombre femenino', number: string | number = '1') => ({ number, type, definition });

describe('closed type lists', () => {
    test('es closed list is the spec list plus nombre masculino o femenino', () => {
        expect(new Set(ES_TYPES)).toEqual(new Set([
            'nombre masculino', 'nombre femenino', 'nombre masculino y femenino', 'nombre ambiguo', 'nombre',
            'verbo transitivo', 'verbo intransitivo', 'verbo pronominal', 'verbo copulativo', 'verbo auxiliar',
            'verbo impersonal', 'verbo', 'participio', 'adjetivo', 'adverbio', 'pronombre', 'artículo',
            'preposición', 'conjunción', 'interjección', 'onomatopeya', 'locución', 'expresión',
            'nombre masculino o femenino',
        ]));
        expect(ES_TYPES).toHaveLength(24);
    });

    test('en closed list is the nine part-of-speech labels', () => {
        expect(new Set(EN_TYPES)).toEqual(new Set([
            'noun', 'verb', 'adjective', 'adverb', 'preposition', 'pronoun', 'conjunction', 'interjection', 'numeral',
        ]));
        expect(EN_TYPES).toHaveLength(9);
    });
});

describe('classifyWord', () => {
    test.each([
        ['es', 'acción'.normalize('NFD'), { category: 'W1', action: 'FIX', fixed: 'acción' }],
        ['es', 'canciÃ³n', { category: 'W1', action: 'FIX', fixed: 'canción' }],
        ['es', 'ca�a', { category: 'W1', action: 'DELETE' }],
        ['es', 'Perro', { category: 'W2', action: 'FIX', fixed: 'perro' }],
        ['es', 'XIV', { category: 'W2', action: 'FIX', fixed: 'xiv' }],
        ['es', 'när', { category: 'W3', action: 'DELETE' }],
        ['en', 'café', { category: 'W3', action: 'DELETE' }],
        ['es', 'b', { category: 'W4', action: 'DELETE' }],
        ['es', 'km', { category: 'W5', action: 'DELETE' }],
        ['es', 'xiv', { category: 'W6', action: 'DELETE' }],
        ['es', 'holaaa', { category: 'W7', action: 'DELETE' }],
    ] as const)('in locale %p classifies %p as %p', (locale, word, expected) => {
        expect(classifyWord(word, undefined, ctx(locale))).toEqual(expect.objectContaining(expected));
    });

    test.each([
        ['W5', 'es', 'etc', { abbreviations: ['etc'] }],
        ['W8', 'es', 'madrid', { properNouns: ['madrid'] }],
        ['W9', 'es', 'konsekvens', { foreign: ['konsekvens'] }],
        ['W10', 'es', 'insultoprueba', { offensive: ['insultoprueba'] }],
        ['W11', 'en', 'mailto', { htmlXml: ['mailto'] }],
    ] as const)('deletes a word listed in the %s list file (%p %p)', (category, locale, word, sets) => {
        expect(classifyWord(word, undefined, ctx(locale, sets))).toEqual(
            expect.objectContaining({ category, action: 'DELETE' }),
        );
    });

    test('deletes an en entry whose senses are all abbreviations', () => {
        const entry = enEntry(['Abbreviation of as soon as possible.', 'adverb'], ['Initialism of as soon as possible.', 'adverb']);

        expect(classifyWord('asap', entry, ctx('en'))).toEqual(expect.objectContaining({ category: 'W5', action: 'DELETE' }));
    });

    test.each([
        ['es', 'y', {}],
        ['en', 'i', {}],
        ['en', 'hmm', { allow: ['hmm'] }],
        ['en', 'zzz', { allow: ['zzz'] }],
        ['es', 'mi', { allow: ['di', 'vi', 'mi', 'xi', 'li'] }],
        ['es', 'di', { allow: ['di', 'vi', 'mi', 'xi', 'li'] }],
        ['es', 'vi', { allow: ['di', 'vi', 'mi', 'xi', 'li'] }],
        ['es', 'xi', { allow: ['di', 'vi', 'mi', 'xi', 'li'] }],
        ['es', 'li', { allow: ['di', 'vi', 'mi', 'xi', 'li'] }],
        ['en', 'mix', { allow: ['mix', 'mi', 'xi', 'li'] }],
        ['en', 'version', { allow: ['version'], htmlXml: ['version'] }],
    ] as const)('in locale %p keeps %p (sets %p)', (locale, word, sets) => {
        expect(classifyWord(word, undefined, ctx(locale, sets))).toBeNull();
    });

    test('does not delete an en word whose senses are all proper nouns unless it is listed', () => {
        const entry = enEntry(['A city in Nebraska.', 'proper noun'], ['A US president.', 'proper noun']);

        expect(classifyWord('lincoln', entry, ctx('en'))).toBeNull();
    });
});

describe('classifySense', () => {
    test.each([
        ['es', sense('   '), 'D1'],
        ['en', sense('\\frac{a}{b} is a ratio.', 'noun', 1), 'D2'],
        ['en', sense('{{lb|en|obsolete}} An old word.', 'noun', 1), 'D2'],
        ['es', sense('<br/><br/>'), 'D2'],
        ['en', sense('A sign &#x110000; here.', 'noun', 1), 'D2'],
        ['es', sense('V. atender.', 'verbo transitivo'), 'D3'],
        ['es', sense('Ver atender 2.', 'verbo transitivo'), 'D3'],
        ['en', sense('See abacus.', 'noun', 1), 'D3'],
        ['en', sense('Cf. foo bar.', 'noun', 1), 'D3'],
        ['en', sense('Plural of cat.', 'noun', 1), 'D4'],
        ['en', sense('Alternative spelling of colour.', 'noun', 1), 'D4'],
        ['es', sense('plural de casa.'), 'D4'],
        ['es', sense('de,'), 'D5'],
        ['en', sense('A city in Nebraska.', 'proper noun', 1), 'D7'],
        ['en', sense('(proper noun) A city in Nebraska.', 'noun', 1), 'D7'],
    ] as const)('in locale %p deletes %p as %s', (locale, input, category) => {
        expect(classifySense(input, locale).delete).toBe(category);
    });

    test.each([
        ['es', sense('Ver con anticipación.', 'verbo transitivo')],
        ['es', sense('Forma de gobierno en que el poder reside en el pueblo.')],
        ['es', sense('Que termina en de.')],
        ['en', sense('See you later; goodbye.', 'interjection', 1)],
        ['en', sense('See the main entry for full details.', 'noun', 1)],
    ] as const)('in locale %p keeps %p', (locale, input) => {
        expect(classifySense(input, locale).delete).toBeUndefined();
    });

    test.each([
        ['es', sense('<i>Casa</i> &amp; hogar.'), 'D2', 'Casa & hogar.'],
        ['es', sense('  Edificio   para habitar. '), 'D8', 'Edificio para habitar.'],
        ['es', sense('Que se hace con,'), 'D5', 'Que se hace con.'],
        ['es', sense('Que se hace con;'), 'D5', 'Que se hace con.'],
        ['es', sense('Que se hace con:'), 'D5', 'Que se hace con.'],
        ['es', sense('Que se hace con,.'), 'D5', 'Que se hace con.'],
        ['es', sense('Perteneciente o relativo al abdomen. a un músculo,.'), 'D5', 'Perteneciente o relativo al abdomen.'],
        ['en', sense('The study of the past by excavation and analysis of its material remains:.', 'noun', 1), 'D5',
            'The study of the past by excavation and analysis of its material remains.'],
        ['en', sense('A formation of minerals, specifically:.', 'noun', 1), 'D5', 'A formation of minerals.'],
        ['en', sense('An aboriginal inhabitant of a region; in particular:', 'noun', 1), 'D5', 'An aboriginal inhabitant of a region.'],
        ['en', sense('A private cabinet, (particularly):', 'noun', 1), 'D5', 'A private cabinet.'],
    ] as const)('in locale %p fixes %p as %s to %p', (locale, input, fix, text) => {
        const result = classifySense(input, locale);

        expect(result).toEqual(expect.objectContaining({ fix, text }));
        expect(result.delete).toBeUndefined();
    });

    test.each([
        ['es', sense('magnífico.', 'adjetivo'), 'D3b'],
        ['es', sense('Dicho (de algo que se mueve.'), 'D5'],
    ] as const)('in locale %p flags %p as %s without deleting it', (locale, input, flag) => {
        const result = classifySense(input, locale);

        expect(result.flags).toContain(flag);
        expect(result.delete).toBeUndefined();
    });
});

describe('dedupeSenses', () => {
    test('keeps the first of two senses with the same text and drops the later one', () => {
        const first = sense('Edificio para habitar.', 'nombre femenino', '1');
        const other = sense('Familia que vive junta.', 'nombre femenino', '2');
        const duplicate = sense('Edificio para habitar.', 'nombre femenino', '3');

        expect(dedupeSenses([first, other, duplicate])).toEqual([first, other]);
    });
});

describe('normalizeType', () => {
    test.each([
        ['nombre femenino desusado', undefined, 'nombre femenino', 'desusado'],
        ['nombre masculino coloquial', 'Marina', 'nombre masculino', 'Marina, coloquial'],
        ['adjetivo poco usado', undefined, 'adjetivo', 'poco usado'],
        ['nombre femenino plural', undefined, 'nombre femenino', 'en plural'],
        ['verbo intransitivo impersonal', undefined, 'verbo impersonal', undefined],
        ['participio irregular', undefined, 'participio', undefined],
        ['adverbio de modo', undefined, 'adverbio', 'de modo'],
        ['locuciones adverbiales', undefined, 'locución', 'adverbiales'],
        ['locución sustantiva masculina', undefined, 'locución', 'sustantiva masculina'],
        ['  Nombre   Femenino ', undefined, 'nombre femenino', undefined],
        ['noun', undefined, 'nombre', 'sin verificar'],
        ['verb', 'coloquial', 'verbo', 'coloquial, sin verificar'],
        ['adjective', undefined, 'adjetivo', 'sin verificar'],
        ['adverb', undefined, 'adverbio', 'sin verificar'],
        ['preposition', undefined, 'preposición', 'sin verificar'],
        ['pronoun', undefined, 'pronombre', 'sin verificar'],
        ['conjunction', undefined, 'conjunción', 'sin verificar'],
        ['interjection', undefined, 'interjección', 'sin verificar'],
        ['article', undefined, 'artículo', 'sin verificar'],
    ])('es %p (type_extra %p) becomes %p with type_extra %p', (type, typeExtra, expectedType, expectedExtra) => {
        const result = normalizeType(type, typeExtra, 'es');

        expect(result.type).toBe(expectedType);
        expect(result.typeExtra).toBe(expectedExtra);
        expect(result.finding).toEqual(expect.objectContaining({ category: 'T1', action: 'FIX' }));
    });

    test.each([
        ['es', 'nombre masculino o femenino', undefined],
        ['es', 'nombre femenino', 'Marina'],
        ['en', 'noun', undefined],
    ] as const)('leaves %s %p unchanged with no finding', (locale, type, typeExtra) => {
        const result = normalizeType(type, typeExtra, locale);

        expect(result.type).toBe(type);
        expect(result.typeExtra).toBe(typeExtra);
        expect(result.finding).toBeUndefined();
    });

    test.each([
        ['es', 'sustantivo', undefined, 'T1'],
        ['en', 'adj', undefined, 'T1'],
        ['en', 'determiner', undefined, 'T1'],
        ['es', '', undefined, 'T3'],
        ['en', '', undefined, 'T3'],
        ['es', 'nombre', 'sin verificar', 'T2'],
    ] as const)('in locale %p flags type %p (type_extra %p) as %s', (locale, type, typeExtra, category) => {
        const result = normalizeType(type, typeExtra, locale);

        expect(result.finding).toEqual(expect.objectContaining({ category, action: 'FLAG' }));
    });

    test.each([
        'nombre femenino desusado',
        'nombre femenino plural',
        'locuciones adverbiales',
        'noun',
    ])('normalizing the es output of %p again is not a FIX and changes nothing', (type) => {
        const once = normalizeType(type, undefined, 'es');
        const twice = normalizeType(once.type, once.typeExtra, 'es');

        expect(twice.type).toBe(once.type);
        expect(twice.typeExtra).toBe(once.typeExtra);
        expect(twice.finding?.action).not.toBe('FIX');
    });
});

describe('spellingBee clue verdict across the es type mapping', () => {
    const VALID_DEFINITION = 'Vivienda donde habita una familia';

    test.each([
        'noun', 'verb', 'adjective', 'adverb', 'preposition',
        'pronoun', 'conjunction', 'interjection', 'article',
        'nombre femenino desusado', 'locuciones adverbiales', 'adjetivo poco usado',
    ])('isUsableClue gives the same verdict for es type %p before and after normalizeType', (type) => {
        const before = isUsableClue({ word: 'casa', definition: VALID_DEFINITION, type }, 'es');
        const normalized = normalizeType(type, undefined, 'es');
        const clueAfter = { word: 'casa', definition: VALID_DEFINITION, type: normalized.type, typeExtra: normalized.typeExtra };

        expect(isUsableClue(clueAfter, 'es')).toBe(before);
    });
});

describe('auditLocale', () => {
    const emptyLists = { beginner: [] as string[], intermediate: [] as string[], advanced: [] as string[] };

    test.each(['beginner', 'intermediate', 'advanced'] as const)(
        'flags an es foreign-pattern word found only in the %s list',
        (level) => {
            const result = auditLocale({
                locale: 'es',
                lists: { ...emptyLists, [level]: ['windsurf'] },
                definitions: {},
                wordSets: wordSets(),
            });

            expect(result.findings).toContainEqual(expect.objectContaining({ category: 'W9', action: 'FLAG', word: 'windsurf' }));
        },
    );

    test.each([
        ['es', 'deshacer'],
        ['en', 'windsurf'],
    ] as const)('in locale %p raises no W9 finding for %p', (locale, word) => {
        const result = auditLocale({
            locale,
            lists: { ...emptyLists, advanced: [word] },
            definitions: {},
            wordSets: wordSets(),
        });

        expect(result.findings.filter((finding: { category: string }) => finding.category === 'W9')).toEqual([]);
    });

    test('flags an accent-only pair when both forms are definition keys', () => {
        const entry = { definitions: [sense('Medio de transporte.', 'nombre masculino')] };

        const result = auditLocale({
            locale: 'es',
            lists: { ...emptyLists, beginner: ['vehiculo', 'vehículo'] },
            definitions: { v: { vehiculo: entry, 'vehículo': entry } },
            wordSets: wordSets(),
        });

        const w12 = result.findings.filter((finding: { category: string }) => finding.category === 'W12');
        expect(w12).toHaveLength(1);
        expect(w12[0].action).toBe('FLAG');
        expect(`${w12[0].word} ${w12[0].detail ?? ''}`).toEqual(expect.stringContaining('vehiculo'));
        expect(`${w12[0].word} ${w12[0].detail ?? ''}`).toEqual(expect.stringContaining('vehículo'));
    });
    test('merges two keys that repair to the same new form into one key with the first sense', () => {
        const result = auditLocale({
            locale: 'es',
            lists: { ...emptyLists, beginner: ['Gato', 'GATO'] },
            definitions: {
                g: {
                    Gato: { definitions: [sense('Animal felino doméstico.', 'nombre masculino')] },
                    GATO: { definitions: [sense('Máquina para levantar pesos.', 'nombre masculino')] },
                },
            },
            wordSets: wordSets(),
        });

        expect(Object.keys(result.definitions.g)).toEqual(['gato']);
        expect(result.definitions.g.gato.definitions.map((s: { definition: string }) => s.definition)).toEqual(['Animal felino doméstico.']);
        expect(result.lists.beginner).toEqual(['gato']);
        expect(result.findings).toContainEqual(
            expect.objectContaining({ word: 'gato', category: 'W2', action: 'FLAG', detail: expect.stringContaining('merged GATO') }),
        );
    });
});
