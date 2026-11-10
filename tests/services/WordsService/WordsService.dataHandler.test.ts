import Logger from '@services/Logger';
import { getDefinition, getDefinitions } from '@services/WordsService';

const sense = (number: number) => ({ number, type: 'nombre', definition: `sentido ${number}` });

const serve = (body: unknown) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(body) });
};

describe('WordsService definitions', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('getDefinitions fetches the letter file and applies the sense filter', async () => {
        serve({ abajo: { definitions: [sense(1)] }, atender: { definitions: [sense(1), sense(2), sense(3)] } });

        const result = await getDefinitions({ locale: 'es', firstLetter: 'a', minSenses: 2 });

        expect(global.fetch).toHaveBeenCalledWith('/definitions/es/a_definitions.json');
        expect(result).toEqual({ atender: { definitions: [sense(1), sense(2), sense(3)] } });
    });

    test('getDefinitions returns null when the file cannot be fetched', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
        jest.spyOn(Logger, 'error').mockImplementation(() => {});

        await expect(getDefinitions({ locale: 'es', firstLetter: 'a' })).resolves.toBeNull();
    });

    test.each([
        ['ñandú', '/definitions/es/n_definitions.json'],
        ['árbol', '/definitions/es/a_definitions.json'],
    ])('getDefinition reads %s from %s', async (word, file) => {
        const entry = { definitions: [sense(1)] };
        serve({ [word]: entry, otra: { definitions: [sense(1)] } });

        const result = await getDefinition(word, 'es');

        expect(global.fetch).toHaveBeenCalledWith(file);
        expect(result).toEqual(entry);
    });

    test('getDefinition returns null for `constructor` when the letter file has no such key', async () => {
        serve({ casa: { definitions: [sense(1)] } });

        await expect(getDefinition('constructor', 'es')).resolves.toBeNull();
        expect(global.fetch).toHaveBeenCalledWith('/definitions/es/c_definitions.json');
    });
});
