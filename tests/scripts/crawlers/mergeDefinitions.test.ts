/**
 * @jest-environment node
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import type * as MergeDefinitions from '../../../scripts/crawlers/mergeDefinitions';

let mergeEntry: typeof MergeDefinitions.mergeEntry;
let mergeIntoFiles: typeof MergeDefinitions.mergeIntoFiles;

beforeAll(() => {
    // Loaded lazily with exit/console stubbed so a script that still runs main() on import fails as a missing export.
    jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    ({ mergeEntry, mergeIntoFiles } = jest.requireActual('../../../scripts/crawlers/mergeDefinitions'));
});

const senses = (count: number, text: string) =>
    Array.from({ length: count }, (_, i) => ({ number: String(i + 1), type: 'nombre femenino', definition: `${text} ${i + 1}.` }));

const existing = { level: 'advanced', definitions: senses(8, 'Antiguo') };
const incoming = { word: 'cama', locale: 'es', source: 'rae-api', crawledAt: '2026-11-18T00:00:00.000Z', definitions: senses(3, 'Nuevo') };

describe('mergeEntry', () => {
    test('replace mode swaps the senses wholesale and keeps the word level', () => {
        const { entry } = mergeEntry(existing, incoming, { replace: true });

        expect(entry.definitions).toEqual(incoming.definitions);
        expect(entry.level).toBe('advanced');
    });

    test('default mode still merges by sense number, keeping the senses the crawl did not return', () => {
        const { entry } = mergeEntry(existing, incoming);

        expect(entry.definitions).toEqual([...incoming.definitions, ...existing.definitions.slice(3)]);
    });

    test('an RAE crawl replaces every sense of a Wiktionary entry and drops its source, in default mode', () => {
        const wiktionary = { ...existing, source: 'wiktionary' };

        const { entry } = mergeEntry(wiktionary, incoming);

        expect(entry).toEqual({ level: 'advanced', definitions: incoming.definitions });
    });
});

describe('mergeIntoFiles', () => {
    test('an RAE crawl of a word in the advanced file moves it to the main file', async () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'crawl-merge-'));
        const dir = path.join(root, 'public/definitions/es');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'c_definitions.json'), JSON.stringify({}, null, 4));
        fs.writeFileSync(path.join(dir, 'c_definitions_advanced.json'), JSON.stringify({ cama: { ...existing, source: 'wiktionary' } }, null, 4));
        const read = (name: string) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf-8'));

        await mergeIntoFiles(root, [incoming]);

        expect(read('c_definitions.json')).toHaveProperty('cama');
        expect(read('c_definitions_advanced.json')).not.toHaveProperty('cama');
        fs.rmSync(root, { recursive: true, force: true });
    });
});
