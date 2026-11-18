/**
 * @jest-environment node
 */
import type * as MergeDefinitions from '../../../scripts/crawlers/mergeDefinitions';

let mergeEntry: typeof MergeDefinitions.mergeEntry;

beforeAll(() => {
    // Loaded lazily with exit/console stubbed so a script that still runs main() on import fails as a missing export.
    jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    ({ mergeEntry } = jest.requireActual('../../../scripts/crawlers/mergeDefinitions'));
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
});
