/**
 * @jest-environment node
 */
import type * as CrawlRAE from '../../../scripts/crawlers/crawlRAE';

type Meanings = Parameters<typeof CrawlRAE.formatDefinitions>[0];

let formatDefinitions: typeof CrawlRAE.formatDefinitions;

beforeAll(() => {
    // Loaded lazily with exit/console stubbed so a script that still runs main() on import fails as a missing export.
    jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    ({ formatDefinitions } = jest.requireActual('../../../scripts/crawlers/crawlRAE'));
});

const meanings = (sense: Record<string, unknown>): Meanings =>
    [{ homonym_index: 1, senses: [{ meaning_number: 1, description: 'Texto de prueba', ...sense }] }] as unknown as Meanings;

const mapped = (sense: Record<string, unknown>) => {
    const [definition] = formatDefinitions(meanings(sense), jest.fn());
    return { type: definition.type, type_extra: definition.type_extra };
};

describe('formatDefinitions type mapping (es)', () => {
    test.each([
        ['noun + masculine', { category: 'noun', gender: 'masculine' }, 'nombre masculino', undefined],
        ['noun + RAE abbrev f', { category: 'noun', gender: 'f' }, 'nombre femenino', undefined],
        ['verb + transitive', { category: 'verb', verb_category: 'transitive' }, 'verbo transitivo', undefined],
        ['verb + RAE abbrev prnl', { category: 'verb', verb_category: 'prnl' }, 'verbo pronominal', undefined],
        ['adjective', { category: 'adjective' }, 'adjetivo', undefined],
        ['category_labels first', { category_labels: 'sustantivo femenino', category: 'noun', gender: null }, 'nombre femenino', undefined],
        ['bare label falls back to gender', { category_labels: ['sustantivo'], category: 'noun', gender: 'feminine' }, 'nombre femenino', undefined],
        ['noun with null gender', { category: 'noun', gender: null }, 'nombre', 'sin verificar'],
        ['usage obsolete', { category: 'adjective', usage: 'obsolete' }, 'adjetivo', 'desusado'],
        ['usage outdated', { category: 'adjective', usage: 'outdated' }, 'adjetivo', 'desusado'],
        ['usage colloquial', { category: 'adjective', usage: 'colloquial' }, 'adjetivo', 'coloquial'],
        ['usage common', { category: 'adjective', usage: 'common' }, 'adjetivo', undefined],
        ['usage rare + unverified', { category: 'noun', gender: null, usage: 'rare' }, 'nombre', 'poco usado, sin verificar'],
    ])('%s', (_label, sense, type, typeExtra) => {
        const result = mapped(sense);

        expect(result).toEqual({ type, type_extra: typeExtra });
    });

    test('reports an unrecognised gender value to the caller', () => {
        const onUnrecognised = jest.fn();

        formatDefinitions(meanings({ category: 'noun', gender: 'epiceno' }), onUnrecognised);

        expect(onUnrecognised).toHaveBeenCalledWith(expect.stringContaining('epiceno'));
    });
});
