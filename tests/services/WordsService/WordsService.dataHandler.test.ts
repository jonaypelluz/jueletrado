import Logger from '@services/Logger';
import { getDefinition, getDefinitions } from '@services/WordsService';

const sense = (number: number) => ({ number, type: 'nombre', definition: `sentido ${number}` });

const serve = (body: unknown) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(body) });
};

describe('WordsService definitions', () => {
    beforeEach(() => {
        // Anything not served is a 404 (e.g. a letter with no advanced file).
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
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

    const MAIN = '/definitions/es/a_definitions.json';
    const ADVANCED = '/definitions/es/a_definitions_advanced.json';
    const imported = { level: 'advanced', source: 'wiktionary', definitions: [sense(1)] };

    test.each([
        ['beginner', [MAIN]],
        ['intermediate', [MAIN]],
        ['advanced', [MAIN, ADVANCED]],
        [undefined, [MAIN]],
    ])('getDefinitions at level %s fetches %j', async (level, urls) => {
        serve({ abajo: { definitions: [sense(1)] } });
        serve({ ábaco: imported });

        await getDefinitions({ locale: 'es', firstLetter: 'a', level });

        expect((global.fetch as jest.Mock).mock.calls.map(([url]) => url)).toEqual(urls);
    });

    test('getDefinitions at level advanced merges the advanced file after the main file', async () => {
        serve({ abajo: { definitions: [sense(1)] } });
        serve({ ábaco: imported });

        const result = await getDefinitions({ locale: 'es', firstLetter: 'a', level: 'advanced' });

        expect(result).toEqual({ abajo: { definitions: [sense(1)] }, ábaco: imported });
    });

    test('getDefinitions treats a 404 on the advanced file as empty, not as an error', async () => {
        serve({ abajo: { definitions: [sense(1)] } });
        const error = jest.spyOn(Logger, 'error').mockImplementation(() => {});

        const result = await getDefinitions({ locale: 'es', firstLetter: 'a', level: 'advanced' });

        expect(global.fetch).toHaveBeenCalledWith(ADVANCED);
        expect(result).toEqual({ abajo: { definitions: [sense(1)] } });
        expect(error).not.toHaveBeenCalled();
    });

    test('getDefinitions logs a failed advanced fetch other than a 404 and treats it as empty', async () => {
        serve({ abajo: { definitions: [sense(1)] } });
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
        const error = jest.spyOn(Logger, 'error').mockImplementation(() => {});

        const result = await getDefinitions({ locale: 'es', firstLetter: 'a', level: 'advanced' });

        expect(result).toEqual({ abajo: { definitions: [sense(1)] } });
        expect(error).toHaveBeenCalled();
    });

    test('getDefinitions for a locale without advanced files fetches only the main file', async () => {
        serve({ apple: { definitions: [sense(1)] } });

        await getDefinitions({ locale: 'en', firstLetter: 'a', level: 'advanced' });

        expect((global.fetch as jest.Mock).mock.calls.map(([url]) => url)).toEqual(['/definitions/en/a_definitions.json']);
    });

    test('getDefinition falls back to the advanced file when the word is not in the main file', async () => {
        serve({ casa: { definitions: [sense(1)] } });
        serve({ cabaña: imported });

        await expect(getDefinition('cabaña', 'es')).resolves.toEqual(imported);
        expect(global.fetch).toHaveBeenCalledWith('/definitions/es/c_definitions_advanced.json');
    });
});
