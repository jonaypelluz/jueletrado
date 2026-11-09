/**
 * @jest-environment node
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { EN_TYPES, ES_TYPES, auditLocale, loadLocaleInput, runCli } from '../../../scripts/words/wordAudit';

const FIXTURE_ROOT = path.join(__dirname, '../../fixtures/words');

const FIX_DELETE_CATEGORIES = [
    'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W15',
    'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'T1',
];

type Sense = { number: string | number; type: string; type_extra?: string; definition: string };
type DefinitionFile = Record<string, { definitions: Sense[] }>;

let root: string;

const read = (rel: string): string => fs.readFileSync(path.join(root, rel), 'utf-8');
const readDefinitions = (locale: string, letter: string): DefinitionFile =>
    JSON.parse(read(`public/definitions/${locale}/${letter}_definitions.json`));
const listWords = (locale: string): string[] =>
    ['beginner', 'intermediate', 'advanced'].flatMap((level) =>
        read(`ops/scripts/words/${locale}/${level}_words.txt`).split('\n'),
    );

/** Every data file (lists + definitions) with its bytes; reports are left out. */
const snapshotData = (): Record<string, string> => {
    const files: Record<string, string> = {};
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
            const rel = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(rel);
            else files[rel] = read(rel);
        }
    };
    walk('ops/scripts/words');
    walk('public/definitions');
    return files;
};

const definitionFiles = (locale: string): string[] =>
    fs.readdirSync(path.join(root, 'public/definitions', locale)).map((name) => `public/definitions/${locale}/${name}`);

describe('words:audit on the fixture tree', () => {
    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'words-audit-'));
        fs.cpSync(FIXTURE_ROOT, root, { recursive: true });
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(root, { recursive: true, force: true });
    });

    describe('check mode', () => {
        test('exits 1 and finds one hit of every FIX/DELETE category across es and en', async () => {
            const exitCode = await runCli(['--root', root], root);

            const findings = [
                ...auditLocale(await loadLocaleInput(root, 'es')).findings,
                ...auditLocale(await loadLocaleInput(root, 'en')).findings,
            ];
            const fixDelete = new Set(
                findings
                    .filter((finding: { action: string }) => finding.action !== 'FLAG')
                    .map((finding: { category: string }) => finding.category),
            );
            expect(exitCode).toBe(1);
            expect([...fixDelete].sort()).toEqual([...FIX_DELETE_CATEGORIES].sort());
        });

        test('writes a per-locale report whose table lists every FIX/DELETE category found', async () => {
            await runCli(['--root', root], root);

            const report = `${read('ops/crawl-output/audit/es-report.md')}\n${read('ops/crawl-output/audit/en-report.md')}`;
            FIX_DELETE_CATEGORIES.forEach((category) => {
                expect(report).toMatch(new RegExp(`^\\|\\s*${category}\\s*\\|\\s*(FIX|DELETE)\\s*\\|\\s*[1-9]`, 'm'));
            });
        });

        test('changes no data file', async () => {
            const before = snapshotData();

            await runCli(['--root', root], root);

            expect(snapshotData()).toEqual(before);
        });

        test('treats a missing block list as empty instead of failing', async () => {
            fs.rmSync(path.join(root, 'ops/scripts/words/proper_nouns_en.txt'));

            await expect(runCli(['--locale', 'en', '--root', root], root)).resolves.toBe(1);
        });
    });

    describe('--fix', () => {
        test('exits 0 and a following check exits 0', async () => {
            await expect(runCli(['--fix', '--root', root], root)).resolves.toBe(0);

            await expect(runCli(['--root', root], root)).resolves.toBe(0);
        });

        test('leaves only types from the closed list of each locale', async () => {
            await runCli(['--fix', '--root', root], root);

            for (const [locale, closed] of [['es', ES_TYPES], ['en', EN_TYPES]] as const) {
                const types = definitionFiles(locale).flatMap((file) =>
                    Object.values(JSON.parse(read(file)) as DefinitionFile).flatMap((entry) =>
                        entry.definitions.map((s) => s.type),
                    ),
                );
                expect(types.length).toBeGreaterThan(0);
                types.forEach((type) => expect(closed).toContain(type));
            }
        });

        test('renumbers remaining senses 1..n keeping string numbers in es and integers in en', async () => {
            await runCli(['--fix', '--root', root], root);

            expect(readDefinitions('es', 'c').casa.definitions.map((s) => s.number)).toEqual(['1', '2']);
            expect(readDefinitions('en', 'a').abacist.definitions.map((s) => s.number)).toEqual([1]);
            expect(readDefinitions('en', 'l').lincoln.definitions).toEqual([
                { number: 1, definition: 'A breed of long-wooled sheep.', type: 'noun' },
            ]);
        });

        test('puts a new type_extra right after type and keeps the other keys in order', async () => {
            await runCli(['--fix', '--root', root], root);

            const fixed = readDefinitions('es', 'c').casa.definitions[1];
            expect(Object.keys(fixed)).toEqual(['number', 'type', 'type_extra', 'definition']);
            expect(fixed).toEqual({
                number: '2',
                type: 'nombre femenino',
                type_extra: 'desusado',
                definition: 'Familia que vive junta.',
            });
        });

        test('removes a deleted word from every list and from its definition key', async () => {
            await runCli(['--fix', '--root', root], root);

            expect(listWords('es')).not.toContain('madrid'); // listed in beginner and advanced
            expect(readDefinitions('es', 'm')).not.toHaveProperty('madrid');
            expect(readDefinitions('es', 'm')).toHaveProperty('mesa');
            expect(listWords('en')).not.toContain('asap');
            expect(readDefinitions('en', 'a')).not.toHaveProperty('asap');
        });

        test('removes a definition key left with no senses but keeps the word in its list', async () => {
            await runCli(['--fix', '--root', root], root);

            expect(readDefinitions('es', 'a')).not.toHaveProperty('acudir');
            expect(listWords('es')).toContain('acudir');
            expect(readDefinitions('en', 'c')).not.toHaveProperty('cats');
            expect(listWords('en')).toContain('cats');
        });

        test('rewrites lists in their original line order, one word per line with a trailing newline', async () => {
            await runCli(['--fix', '--root', root], root);

            expect(read('ops/scripts/words/es/beginner_words.txt')).toBe(
                ['casa', 'acción', 'y', 'mi', 'atender', 'acudir', 'aviso', 'árbol'].join('\n') + '\n',
            );
            expect(read('ops/scripts/words/es/intermediate_words.txt')).toBe('perro\ncasas\ngobierno\n');
            expect(read('ops/scripts/words/es/advanced_words.txt')).toBe('mesa\n');
            expect(read('ops/scripts/words/en/beginner_words.txt')).toBe(
                ['a', 'i', 'cat', 'cats', 'hmm', 'mix', 'version', 'lincoln', 'abacist', 'angle'].join('\n') + '\n',
            );
        });

        test('writes definition files as 4-space JSON with no trailing newline', async () => {
            await runCli(['--fix', '--root', root], root);

            for (const file of [...definitionFiles('es'), ...definitionFiles('en')]) {
                const content = read(file);
                expect(content).toBe(JSON.stringify(JSON.parse(content), null, 4));
            }
        });

        test('a second --fix changes no file', async () => {
            await runCli(['--fix', '--root', root], root);
            const afterFirst = snapshotData();

            await expect(runCli(['--fix', '--root', root], root)).resolves.toBe(0);

            expect(snapshotData()).toEqual(afterFirst);
        });

        test.each([
            ['es', 'insultoprueba'],
            ['en', 'rudewordtest'],
        ])('lists every deleted offensive word of %s under its own report heading', async (locale, word) => {
            await runCli(['--fix', '--root', root], root);

            const report = read(`ops/crawl-output/audit/${locale}-report.md`);
            const heading = report.match(/^#+ .*offensive.*$/im);
            expect(heading).not.toBeNull();
            const section = report.slice((heading?.index ?? 0) + (heading?.[0].length ?? 0)).split(/^#+ /m)[0];
            expect(section).toContain(word);
        });

        test('merges a mixed-case definition key into the existing lowercase key, existing senses winning', async () => {
            await runCli(['--fix', '--root', root], root);

            const p = readDefinitions('es', 'p');
            expect(Object.keys(p)).toEqual(['perro']);
            expect(p.perro.definitions).toEqual([
                { number: '1', type: 'nombre masculino', definition: 'Mamífero doméstico de la familia de los cánidos.' },
            ]);
        });

        test('deletes an uppercase roman numeral in a single --fix', async () => {
            await runCli(['--fix', '--root', root], root);

            expect(listWords('es')).not.toContain('XIV');
            expect(listWords('es')).not.toContain('xiv');
        });
    });

    describe('bad input', () => {
        test.each([
            ['an unknown locale', ['--locale', 'fr']],
            ['--report without --locale', ['--report', 'report.md']],
            ['an unknown flag', ['--bogus']],
        ])('exits 2 on %s', async (_label, args) => {
            await expect(runCli([...args, '--root', root], root)).resolves.toBe(2);
        });

        test('exits 2 when a definition letter file is missing', async () => {
            fs.rmSync(path.join(root, 'public/definitions/es/q_definitions.json'));

            await expect(runCli(['--locale', 'es', '--root', root], root)).resolves.toBe(2);
        });

        test('exits 2 when a word list file is missing', async () => {
            fs.rmSync(path.join(root, 'ops/scripts/words/en/advanced_words.txt'));

            await expect(runCli(['--locale', 'en', '--root', root], root)).resolves.toBe(2);
        });
    });
});
