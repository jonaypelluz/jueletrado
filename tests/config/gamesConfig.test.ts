import { createAllGamesConfig, createGamesConfig } from '@hooks/useGamesConfig';

const GAME_IDS = [
    'spellTower',
    'wordsRain',
    'wordBuilder',
    'wordFinder',
    'definitionMaster',
    'crossWordPuzzle',
] as const;

describe('createGamesConfig', () => {
    test('returns null for unknown game id', () => {
        expect(createGamesConfig('es', 'unknownGame')).toBeNull();
        expect(createGamesConfig('en', 'unknownGame')).toBeNull();
    });

    test.each(GAME_IDS)('returns config for %s in es locale', (id) => {
        const config = createGamesConfig('es', id);
        expect(config).not.toBeNull();
        expect(config?.id).toBe(id);
    });

    test.each(GAME_IDS)('returns config for %s in en locale', (id) => {
        const config = createGamesConfig('en', id);
        expect(config).not.toBeNull();
        expect(config?.id).toBe(id);
    });

    test('es config has Spanish route (no /en/ prefix)', () => {
        GAME_IDS.forEach((id) => {
            const config = createGamesConfig('es', id);
            expect(config?.link).not.toMatch(/^\/en\//);
        });
    });

    test('en config has /en/ route prefix', () => {
        GAME_IDS.forEach((id) => {
            const config = createGamesConfig('en', id);
            expect(config?.link).toMatch(/^\/en\//);
        });
    });

    test('config includes all required fields', () => {
        const config = createGamesConfig('es', 'wordsRain');
        expect(config).toMatchObject({
            id: expect.any(String),
            link: expect.any(String),
            imgSrc: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            gameRules: expect.any(Object),
        });
    });

    test('title is locale-specific (es vs en differ)', () => {
        const esConfig = createGamesConfig('es', 'wordsRain');
        const enConfig = createGamesConfig('en', 'wordsRain');
        // Titles in different locales should differ
        expect(esConfig?.title).not.toBe(enConfig?.title);
    });

    test('gameRules has expected structure', () => {
        const config = createGamesConfig('es', 'spellTower');
        expect(config?.gameRules).toHaveProperty('gameGoal');
        expect(config?.gameRules).toHaveProperty('howToPlay');
    });
});

describe('createAllGamesConfig', () => {
    test('returns array with all 6 games for es', () => {
        const configs = createAllGamesConfig('es');
        expect(configs).toHaveLength(6);
    });

    test('returns array with all 6 games for en', () => {
        const configs = createAllGamesConfig('en');
        expect(configs).toHaveLength(6);
    });

    test('all game IDs are present', () => {
        const configs = createAllGamesConfig('es');
        const ids = configs.map((c) => c.id);
        GAME_IDS.forEach((id) => expect(ids).toContain(id));
    });

    test('each game has a unique id', () => {
        const configs = createAllGamesConfig('es');
        const ids = configs.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('each game has a non-empty link', () => {
        ['es', 'en'].forEach((locale) => {
            const configs = createAllGamesConfig(locale);
            configs.forEach((c) => {
                expect(c.link.length).toBeGreaterThan(0);
            });
        });
    });
});
