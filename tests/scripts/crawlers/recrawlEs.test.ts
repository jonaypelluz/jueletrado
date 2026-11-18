/**
 * @jest-environment node
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { findCandidates, runCli } from '../../../scripts/crawlers/recrawlEs';
import { loadLocaleInput } from '../../../scripts/words/wordAudit';

const FIXTURE_ROOT = path.join(__dirname, '../../fixtures/words');
const OUT = 'ops/crawl-output/es-recrawl';
const PROGRESS = 'ops/crawl-progress/es-recrawl.json';

const sense = (definition: string, type = '', number = 1, typeExtra?: string) => ({
    number: String(number), type, ...(typeExtra && { type_extra: typeExtra }), definition,
});
const senses = (count: number, type: string) =>
    Array.from({ length: count }, (_, i) => sense(`Sentido número ${i + 1}.`, type, i + 1));

// cal C1+C2, caoba C1, cama C2+C3 (8 senses), cámara/cara/calle C2, caja C3 only, campo clean.
const C_FILE = {
    cal: { definitions: [sense('piedra.')] },
    caoba: { definitions: [sense('árbol.', 'nombre femenino')] },
    cama: { level: 'advanced', definitions: senses(8, '') },
    'cámara': { definitions: [sense('Sala o habitación.', 'nombre', 1, 'sin verificar')] },
    cara: { definitions: [sense('Parte delantera de la cabeza.')] },
    calle: { definitions: [sense('Vía pública.')] },
    caja: { definitions: senses(7, 'nombre femenino') },
    campo: { definitions: [sense('Terreno extenso fuera de poblado.', 'nombre masculino')] },
};

const crawlEntry = (word: string, count: number) =>
    JSON.stringify({ word, locale: 'es', source: 'rae-api', crawledAt: '2026-11-18T00:00:00.000Z', definitions: senses(count, 'nombre femenino') });

let root: string;
const file = (rel: string) => path.join(root, rel);
const read = (rel: string) => fs.readFileSync(file(rel), 'utf-8');
const write = (rel: string, content: string) => {
    fs.mkdirSync(path.dirname(file(rel)), { recursive: true });
    fs.writeFileSync(file(rel), content);
};
const queue = () => read(`${OUT}/queue.txt`).trim().split('\n');
const snapshot = (dir = ''): Record<string, string> =>
    Object.assign({}, ...fs.readdirSync(file(dir), { withFileTypes: true }).map((entry) => {
        const rel = path.join(dir, entry.name);
        return entry.isDirectory() ? snapshot(rel) : { [rel]: read(rel) };
    }));

describe('crawl:recrawl-es', () => {
    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'recrawl-es-'));
        fs.cpSync(FIXTURE_ROOT, root, { recursive: true });
        // Only the c file holds es words, so the shared fixture cannot leak candidates in.
        for (const name of fs.readdirSync(file('public/definitions/es'))) write(`public/definitions/es/${name}`, '{}');
        write('public/definitions/es/c_definitions.json', JSON.stringify(C_FILE, null, 4));
        write('ops/scripts/frequency/wordfreq_es.txt', 'calle\ncaja\ncampo\ncama\ncal\n');
        write(PROGRESS, JSON.stringify({ version: 1, done: { calle: { status: 'replaced', at: '2026-11-01' } } }, null, 4));
        // Leftover of an interrupted run: cara is merged without re-fetching; cazo has no entry and is never added.
        write(`${OUT}/c.jsonl`, `${crawlEntry('cara', 1)}\n${crawlEntry('cazo', 1)}\n`);
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(root, { recursive: true, force: true });
    });

    test('finds single-word-only (C1), unverified/empty type (C2) and >6 senses (C3) words', async () => {
        const { c1, c2, c3 } = findCandidates((await loadLocaleInput(root, 'es')).definitions);

        expect([...c1].sort()).toEqual(['cal', 'caoba'].sort());
        expect([...c2].sort()).toEqual(['cal', 'calle', 'cama', 'cara', 'cámara'].sort());
        expect([...c3].sort()).toEqual(['caja', 'cama'].sort());
    });

    test('--check exits 0 without crawling or writing any file', async () => {
        const crawl = jest.fn();
        const before = snapshot();

        await expect(runCli(['--check', '--root', root], root, crawl)).resolves.toBe(0);

        expect(crawl).not.toHaveBeenCalled();
        expect(snapshot()).toEqual(before);
        // C1 ∪ C2 = cal, caoba, cama, cámara, cara, calle.
        const output = (console.log as jest.Mock).mock.calls.flat().join('\n');
        expect(output).toMatch(/union\D*6\b/i);
    });

    test('exits 1 on an invalid progress file without crawling or touching it', async () => {
        write(PROGRESS, '{');
        const crawl = jest.fn();

        await expect(runCli(['--root', root], root, crawl)).resolves.toBe(1);

        expect(crawl).not.toHaveBeenCalled();
        expect(read(PROGRESS)).toBe('{');
    });

    test('queues C1 ∪ C2 by frequency rank, then unranked in Spanish collation, up to --limit', async () => {
        const crawl = jest.fn((..._args: unknown[]) => 0);

        await expect(runCli(['--limit', '3', '--root', root], root, crawl)).resolves.toBe(0);

        // calle done, cara already in the re-crawl JSONL, caja C3-only, campo clean.
        expect(queue()).toEqual(['cama', 'cal', 'cámara']);
        expect(crawl).toHaveBeenCalledTimes(1);
        expect(crawl.mock.calls[0][0]).toEqual([
            file(`${OUT}/queue.txt`), '--output-dir', file(OUT), '--not-found-file', file(`${OUT}/not-found.txt`), '--quiet-skip',
        ]);
    });

    test.each(['0', '101'])('exits 2 on --limit %s without crawling', async (limit) => {
        const crawl = jest.fn();

        await expect(runCli(['--limit', limit, '--root', root], root, crawl)).resolves.toBe(2);

        expect(crawl).not.toHaveBeenCalled();
    });

    test('on RAE quota still merges in replace mode, records progress and exits 2; next run skips done words', async () => {
        const quotaHit = jest.fn(() => {
            fs.appendFileSync(file(`${OUT}/c.jsonl`), `${crawlEntry('cama', 3)}\n`);
            fs.appendFileSync(file(`${OUT}/not-found.txt`), 'cal\n');
            return 2;
        });

        await expect(runCli(['--limit', '3', '--root', root], root, quotaHit)).resolves.toBe(2);

        const { done } = JSON.parse(read(PROGRESS));
        const at = expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/);
        expect(done).toEqual({
            calle: { status: 'replaced', at: '2026-11-01' },
            cama: { status: 'replaced', at },
            cara: { status: 'replaced', at },
            cal: { status: 'not-found', at },
        });
        expect(Object.keys(done)).toEqual(['cal', 'calle', 'cama', 'cara']);
        const cFile = JSON.parse(read('public/definitions/es/c_definitions.json'));
        expect(cFile.cama.definitions).toHaveLength(3);
        expect(cFile.cama.level).toBe('advanced');
        expect(cFile.cal).toEqual(C_FILE.cal);
        expect(cFile).not.toHaveProperty('cazo');

        await expect(runCli(['--limit', '3', '--root', root], root, jest.fn(() => 0))).resolves.toBe(0);

        expect(queue()).toEqual(['cámara', 'caoba']);
    });
});
