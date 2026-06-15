import createChangeRules from '@config/ChangeRules';
import { ChangeRule } from '@models/types';
import { buildLetterChallenge, LetterChallenge } from '@utils/LetterMatchProcessor';

const esRules = createChangeRules('es');

describe('buildLetterChallenge', () => {
    test('reconstructs the word from prefix + gapAnswer + suffix', () => {
        const challenge = buildLetterChallenge('pollo', esRules, new Set());
        expect(challenge).not.toBeNull();
        const c = challenge as LetterChallenge;
        expect(c.prefix + c.gapAnswer + c.suffix).toBe('pollo');
    });

    test('wrong option differs from gapAnswer and its full word is not in the set', () => {
        const challenge = buildLetterChallenge('pollo', esRules, new Set(['pollo']));
        expect(challenge).not.toBeNull();
        const c = challenge as LetterChallenge;
        const wrong = c.options.find((o) => o !== c.gapAnswer)!;
        expect(wrong).not.toBe(c.gapAnswer);
        expect(new Set(['pollo']).has(c.prefix + wrong + c.suffix)).toBe(false);
    });

    test('ambiguity guard: a rule whose wrong fill is a real word is skipped', () => {
        // single rule ll→y; 'pollo' → 'poyo'. If 'poyo' is a valid word, the only
        // rule is ambiguous and there is nothing else to fall back to → null.
        const onlyRule: ChangeRule[] = [{ ll: 'y' }];
        expect(buildLetterChallenge('pollo', onlyRule, new Set(['poyo']))).toBeNull();
    });

    test('word matching no rule returns null', () => {
        // no es confusion rule matches a plain vowel-only fragment like 'ae'
        expect(buildLetterChallenge('ae', esRules, new Set())).toBeNull();
    });

    test('different-length segments: ll vs y on "calle"', () => {
        const challenge = buildLetterChallenge('calle', [{ ll: 'y' }], new Set());
        expect(challenge).not.toBeNull();
        const c = challenge as LetterChallenge;
        expect(c.gapAnswer).toBe('ll');
        expect(c.options).toContain('y');
        expect(c.prefix + c.gapAnswer + c.suffix).toBe('calle');
    });

    test('empty replacement (h-drop): options include the empty string', () => {
        const challenge = buildLetterChallenge('hotel', [{ h: '' }], new Set());
        expect(challenge).not.toBeNull();
        const c = challenge as LetterChallenge;
        expect(c.gapAnswer).toBe('h');
        expect(c.options).toContain('');
        expect(c.prefix + c.gapAnswer + c.suffix).toBe('hotel');
    });

    test('options always contain gapAnswer, length 2–3, no duplicates', () => {
        for (const word of ['pollo', 'gente', 'vaca', 'perro', 'zapato', 'hotel']) {
            const challenge = buildLetterChallenge(word, esRules, new Set());
            if (!challenge) continue;
            expect(challenge.options).toContain(challenge.gapAnswer);
            expect(challenge.options.length).toBeGreaterThanOrEqual(2);
            expect(challenge.options.length).toBeLessThanOrEqual(3);
            expect(new Set(challenge.options).size).toBe(challenge.options.length);
        }
    });

    test('challenges stay internally consistent across many randomized runs', () => {
        for (let i = 0; i < 200; i++) {
            const challenge = buildLetterChallenge('gente', esRules, new Set());
            if (!challenge) continue;
            expect(challenge.prefix + challenge.gapAnswer + challenge.suffix).toBe('gente');
            expect(challenge.options).toContain(challenge.gapAnswer);
        }
    });
});
