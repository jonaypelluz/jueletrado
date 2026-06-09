import { GeneralTranslations } from '@config/translations/General';
import { GamesRoutes } from '@config/translations/Games';
import { LegalContent } from '@config/translations/Legal';

const LOCALES = ['es', 'en'] as const;

describe('Translation key parity', () => {
    describe('GeneralTranslations', () => {
        test('es and en have the same keys', () => {
            const enKeys = Object.keys(GeneralTranslations.en).sort();
            const esKeys = Object.keys(GeneralTranslations.es).sort();
            expect(enKeys).toEqual(esKeys);
        });

        test.each(Object.keys(GeneralTranslations.en))(
            'key "%s" has non-empty value in both locales',
            (key) => {
                expect(GeneralTranslations.en[key]).toBeTruthy();
                expect(GeneralTranslations.es[key]).toBeTruthy();
            },
        );
    });

    describe('GamesRoutes', () => {
        test('es and en expose the same game IDs', () => {
            const enKeys = Object.keys(GamesRoutes.en).sort();
            const esKeys = Object.keys(GamesRoutes.es).sort();
            expect(enKeys).toEqual(esKeys);
        });

        test('all game route values are non-empty strings', () => {
            LOCALES.forEach((locale) => {
                Object.values(GamesRoutes[locale]).forEach((route) => {
                    expect(typeof route).toBe('string');
                    expect(route.length).toBeGreaterThan(0);
                });
            });
        });

        test('es routes do not contain /en/', () => {
            Object.values(GamesRoutes.es).forEach((route) => {
                expect(route).not.toMatch(/^\/en\//);
            });
        });

        test('en routes all start with /en/', () => {
            Object.values(GamesRoutes.en).forEach((route) => {
                expect(route).toMatch(/^\/en\//);
            });
        });
    });

    describe('LegalContent', () => {
        test('es and en have the same keys', () => {
            const enKeys = Object.keys(LegalContent.en).sort();
            const esKeys = Object.keys(LegalContent.es).sort();
            expect(enKeys).toEqual(esKeys);
        });
    });

    describe('All locales present', () => {
        test('GeneralTranslations has es and en', () => {
            expect(GeneralTranslations).toHaveProperty('es');
            expect(GeneralTranslations).toHaveProperty('en');
        });

        test('GamesRoutes has es and en', () => {
            expect(GamesRoutes).toHaveProperty('es');
            expect(GamesRoutes).toHaveProperty('en');
        });
    });
});
