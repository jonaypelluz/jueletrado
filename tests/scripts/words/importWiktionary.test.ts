/**
 * @jest-environment node
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { cleanSense, decodeEntities, mapPos, mergeLetter, parsePage, runCli } from '../../../scripts/words/importWiktionary';
import { splitDefinitionFile } from '../../../scripts/words/wordAudit';

// es-sample.xml: real es.wiktionary dump pages, trimmed: casa (an RAE key in the fixture tree), cabaña, ácaro,
// corrió (Forma verbal only), Japón (capitalised), achóki (redirect), moitos ({{lengua|gl}} only), and cabaña's
// markup under the title `xxiv` (a roman numeral, which classifyWord rejects).
const FIXTURE_ROOT = path.join(__dirname, '../../fixtures/words');
const DUMP = path.join(__dirname, '../../fixtures/wiktionary/es-sample.xml');

describe('parsePage', () => {
    test('maps a {{lengua|es}} noun, resolves its markup into plain text and drops the vulgar sense', () => {
        const wikitext = [
            '== {{lengua|es}} ==',
            '=== {{sustantivo femenino|es}} ===',
            ';1: Mujer {{plm|astuta}}.',
            '{{uso|vulgar}}',
            ";2 {{csem|aves}}: [[ave|Pájaro]] pequeño de la familia de los {{plm|fringílidos}}.<ref>{{DLE}}</ref>",
            ";3: Persona que [[canto|canta]] ''bien''.",
        ].join('\n');

        expect(parsePage('pinzona', wikitext)).toEqual({
            definitions: [
                { number: '1', type: 'nombre femenino', type_extra: 'Aves', definition: 'Pájaro pequeño de la familia de los Fringílidos.' },
                { number: '2', type: 'nombre femenino', definition: 'Persona que canta bien.' },
            ],
        });
    });

    test('ignores a {{lengua|gl}} section and a Forma section, so a page with only those is null', () => {
        const formOnly = [
            '== {{lengua|gl}} ==',
            '=== {{sustantivo masculino|gl}} ===',
            ';1: Casa grande.',
            '== {{lengua|es}} ==',
            '=== Forma verbal ===',
            ';1: {{forma verbo|correr|p=3s|t=pret ind}}.',
        ].join('\n');
        const lemmaAndForm = [
            '== {{lengua|es}} ==',
            '=== Etimología 1 ===',
            '==== {{adjetivo|es}} ====',
            ';1: Que está situado en lugar inferior.',
            ';2: {{plm|bajar}} (uso pronominal de ...)',
            '=== Etimología 2 ===',
            '==== Forma sustantiva ====',
            ';1: Ciudad pequeña junto al río.',
        ].join('\n');

        expect(parsePage('corrió', formOnly)).toBeNull();
        expect(parsePage('bajo', lemmaAndForm)).toEqual({
            definitions: [{ number: '1', type: 'adjetivo', definition: 'Que está situado en lugar inferior.' }],
        });
    });

    test('maps {{uso|utcs}} to RAE wording and drops the soez and insult senses', () => {
        const wikitext = [
            '== {{lengua|es}} ==',
            '=== {{adjetivo|es}} ===',
            ';1: Que trabaja en el campo.',
            '{{uso|utcs}}',
            ';2: Que habla con palabras groseras.',
            '{{uso|soez}}',
            ';3: Persona torpe y necia.',
            '{{uso|insulto}}',
        ].join('\n');

        expect(parsePage('gorzobia', wikitext)).toEqual({
            definitions: [
                { number: '1', type: 'adjetivo', type_extra: 'Usado también como sustantivo', definition: 'Que trabaja en el campo.' },
            ],
        });
    });

    test('a page whose only sense holds an unknown template is null (markup never leaks)', () => {
        const wikitext = ['== {{lengua|es}} ==', '=== {{sustantivo masculino|es}} ===', ';1: {{plantilla inventada|agua}} de río.'].join('\n');

        expect(parsePage('arroyo', wikitext)).toBeNull();
    });
});

describe('mapPos', () => {
    test.each([
        ['sustantivo masculino  y femenino', { type: 'nombre masculino y femenino' }],
        ['sustantivo femenino y masculino', { type: 'nombre masculino y femenino' }],
        ['adverbio de modo', { type: 'adverbio', typeExtra: 'de modo' }],
        ['artículo determinado', { type: 'artículo', typeExtra: 'determinado' }],
        ['sustantivo masculino plural', { type: 'nombre masculino', typeExtra: 'en plural' }],
        ['sustantivo propio', null],
        ['sigla', null],
    ])('%s → %p', (header, expected) => {
        expect(mapPos(header)).toEqual(expected);
    });
});

test('decodeEntities decodes one level only', () => {
    expect(decodeEntities('&amp;lt;b&amp;gt; &#241;')).toBe('&lt;b&gt; ñ');
});

test('cleanSense keeps numeric super/subscripts and drops other scripted text', () => {
    expect(cleanSense('Diez elevado a dieciocho (10<sup>18</sup>)')).toEqual({ text: 'Diez elevado a dieciocho (10¹⁸).' });
    expect(cleanSense('Agua, H{{subíndice|2}}O')).toEqual({ text: 'Agua, H₂O.' });
    expect(cleanSense('Fórmula x<sup>n</sup>')).toHaveProperty('drop');
});

test('cleanSense strips sense references but keeps formulas and units', () => {
    expect(cleanSense('Persona de carácter de {{plm|apuesto}}{{-sub|3}}')).toEqual({ text: 'Persona de carácter de Apuesto.' });
    expect(cleanSense('Acción o efecto de aforar<sub>1-2</sub>')).toEqual({ text: 'Acción o efecto de aforar.' });
    expect(cleanSense('Fruto de la alborocera(1)')).toEqual({ text: 'Fruto de la alborocera.' });
    expect(cleanSense('Mineral de fórmula Fe<sup>3+</sup>O, 5 m<sup>2</sup> o 8 kg/cm<sup>3</sup>')).toEqual({
        text: 'Mineral de fórmula Fe³⁺O, 5 m² o 8 kg/cm³.',
    });
});

test('cleanSense drops named template args with accented keys and renders the gentilicio contraction', () => {
    expect(cleanSense('Persona {{l|es|basto|núm=1}}')).toEqual({ text: 'Persona basto.' });
    expect(cleanSense('{{gentilicio|contracción=sí|[[Tíbet]]}}')).toEqual({ text: 'Originario, relativo a, o propio del Tíbet.' });
    expect(cleanSense('{{gentilicio|[[Chile]]}}')).toEqual({ text: 'Originario, relativo a, o propio de Chile.' });
    // Safety net: a named arg that leaks anyway is dropped; a formula with `=` is kept.
    expect(cleanSense('Persona núm=1 tosca')).toHaveProperty('drop');
    expect(cleanSense('Análogo n-dimensional de un cubo (n=3)')).toEqual({ text: 'Análogo n-dimensional de un cubo (n=3).' });
});

test('parsePage drops an entry whose offensive-labelled gloss is repeated in an unlabelled sense', () => {
    const wikitext = [
        '== {{lengua|es}} ==',
        '=== {{sustantivo masculino|es}} ===',
        ';1: Hueco pequeño.',
        ';2: {{plm|homosexual}}.',
        '{{uso|despectivo}}',
        ';3: Homosexual.',
    ].join('\n');

    expect(parsePage('gorzobio', wikitext)).toBeNull();
    expect(parsePage('gorzobio', wikitext.replace(';3: Homosexual.', ';3: Agujero redondo.'))).toEqual({
        definitions: [
            { number: '1', type: 'nombre masculino', definition: 'Hueco pequeño.' },
            { number: '2', type: 'nombre masculino', definition: 'Agujero redondo.' },
        ],
    });
});

test('cleanSense drops a sense with a leftover link pipe', () => {
    expect(cleanSense('Medida agraria de superficie utilizar|utilizada en Cuba')).toHaveProperty('drop');
});

test('mergeLetter places a new advanced word in collator order within the advanced file', () => {
    const sense = [{ number: '1', type: 'nombre', definition: 'Sentido de prueba.' }];
    const wiktionary = { level: 'advanced', source: 'wiktionary' as const, definitions: sense };
    // A letter read from disk is the main file's keys, then the advanced file's.
    const existing = { abad: { definitions: sense }, abrir: { definitions: sense }, aba: wiktionary, abeto: wiktionary };
    const imported = new Map([['aba', wiktionary], ['abedul', wiktionary], ['abeto', wiktionary]]);

    const { file, added } = mergeLetter(existing, imported, new Intl.Collator('es-ES', { sensitivity: 'base' }));

    expect(Object.keys(splitDefinitionFile(file).advanced)).toEqual(['aba', 'abedul', 'abeto']);
    expect(added).toEqual(['abedul']);
});

describe('runCli on a fixture dump', () => {
    let root: string;
    const defsFile = (letter: string) => path.join(root, 'public/definitions/es', `${letter}_definitions.json`);
    const readDefs = (letter: string) => JSON.parse(fs.readFileSync(defsFile(letter), 'utf-8'));
    const readAdvancedDefs = (letter: string) =>
        JSON.parse(fs.readFileSync(path.join(root, 'public/definitions/es', `${letter}_definitions_advanced.json`), 'utf-8'));
    const listOf = (level: string) => path.join(root, 'ops/scripts/words/es', `${level}_words.txt`);
    const readList = (level: string) => fs.readFileSync(listOf(level), 'utf-8').split('\n').filter(Boolean);
    const advancedList = () => readList('advanced');
    const dataFiles = () => {
        const defsDir = path.join(root, 'public/definitions/es');
        const listsDir = path.join(root, 'ops/scripts/words/es');
        return Object.fromEntries(
            [...fs.readdirSync(defsDir).map((name) => path.join(defsDir, name)), ...fs.readdirSync(listsDir).map((name) => path.join(listsDir, name))].map(
                (file) => [file, fs.readFileSync(file, 'utf-8')],
            ),
        );
    };
    const run = () => runCli(['--dump', DUMP, '--root', root], root);

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiktionary-import-'));
        fs.cpSync(FIXTURE_ROOT, root, { recursive: true });
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(root, { recursive: true, force: true });
    });

    test('imports new unranked lemmas into the advanced file, refreshes a stale one and never touches an RAE key', async () => {
        const c = readDefs('c');
        c.cabaña = { level: 'advanced', source: 'wiktionary', definitions: [{ number: '1', type: 'nombre', definition: 'Sentido viejo.' }] };
        fs.writeFileSync(defsFile('c'), JSON.stringify(c, null, 4));
        const casaBefore = JSON.stringify(c.casa);
        const advancedBefore = advancedList();

        await expect(run()).resolves.toBe(0);

        const after = readAdvancedDefs('c');
        expect(JSON.stringify(readDefs('c').casa)).toBe(casaBefore);
        expect(readDefs('c')).not.toHaveProperty('cabaña');
        expect(after.cabaña).toEqual({ level: 'advanced', source: 'wiktionary', definitions: expect.any(Array) });
        expect(after.cabaña.definitions[0]).toEqual({
            number: '1',
            type: 'nombre femenino',
            definition:
                'Casilla tosca, hecha en el campo, generalmente de palos entretejidos con cañas y cubierta de ramas, de paja o de hierbas, para refugio o habitación de pastores, pescadores y gente humilde.',
        });
        expect(readAdvancedDefs('a').ácaro).toEqual(expect.objectContaining({ level: 'advanced', source: 'wiktionary' }));
        expect(readDefs('a')).not.toHaveProperty('ácaro');
        const keys = 'abcdefghijklmnopqrstuvwxyz'.split('').flatMap((letter) => Object.keys(readDefs(letter)));
        expect(keys.filter((key) => ['corrió', 'japón', 'Japón', 'achóki', 'moitos', 'xxiv'].includes(key))).toEqual([]);
        expect(advancedList()).toEqual([...advancedBefore, 'ácaro', 'cabaña']);
    });

    test('an unranked word already in the intermediate list is imported as advanced and its lists stay unchanged', async () => {
        fs.appendFileSync(listOf('intermediate'), 'ácaro\n');
        const intermediateBefore = readList('intermediate');

        await expect(run()).resolves.toBe(0);

        expect(readAdvancedDefs('a').ácaro).toEqual(expect.objectContaining({ level: 'advanced', source: 'wiktionary' }));
        expect(readDefs('a')).not.toHaveProperty('ácaro');
        expect(readList('intermediate')).toEqual(intermediateBefore);
        expect(advancedList()).not.toContain('ácaro');
    });

    test('a top-ranked new word is imported as advanced and added to no list (words:build would serve it at beginner)', async () => {
        const freq = path.join(root, 'ops/scripts/frequency/wordfreq_es.txt');
        fs.writeFileSync(freq, `cabaña\n${fs.readFileSync(freq, 'utf-8')}`);
        const lists = () => ['beginner', 'intermediate', 'advanced'].map(readList);
        const listsBefore = lists();

        await expect(run()).resolves.toBe(0);

        expect(readAdvancedDefs('c').cabaña).toEqual(expect.objectContaining({ level: 'advanced', source: 'wiktionary' }));
        expect(lists().map((list) => list.filter((word) => word !== 'ácaro'))).toEqual(listsBefore);
    });

    test('a second run on the same dump changes no byte', async () => {
        await run();
        const first = dataFiles();

        await expect(run()).resolves.toBe(0);

        expect(dataFiles()).toEqual(first);
    });
});
