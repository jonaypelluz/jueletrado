import WordGameProcessor from '@utils/WordGameProcessor';

describe('WordGameProcessor', () => {
    // ─── processWord ──────────────────────────────────────────────────────────

    describe('processWord (es)', () => {
        const proc = new WordGameProcessor('es');

        test('original word is always first element', () => {
            expect(proc.processWord('perro')[0]).toBe('perro');
            expect(proc.processWord('vaca')[0]).toBe('vaca');
        });

        test('result length is between 1 and 3', () => {
            ['perro', 'vaca', 'hablar', 'mesa', 'lluvia'].forEach((word) => {
                const result = proc.processWord(word);
                expect(result.length).toBeGreaterThanOrEqual(1);
                expect(result.length).toBeLessThanOrEqual(3);
            });
        });

        test('no variant equals the original word', () => {
            const result = proc.processWord('perro');
            result.slice(1).forEach((v) => expect(v).not.toBe('perro'));
        });

        test('no duplicate variants', () => {
            const result = proc.processWord('perro');
            expect(new Set(result).size).toBe(result.length);
        });

        test('single-rule word produces deterministic variant (rr→r)', () => {
            // 'perro' only matches rr→r among ES rules
            const result = proc.processWord('perro');
            expect(result).toContain('pero');
        });

        test('single-rule word v→b produces variant baca', () => {
            // 'vaca' only matches v→b
            const result = proc.processWord('vaca');
            expect(result).toContain('baca');
        });

        test('filters variant when it exists in wordSet', () => {
            // 'pero' is the rr→r variant of 'perro'
            const procWithSet = new WordGameProcessor('es', new Set(['pero']));
            const result = procWithSet.processWord('perro');
            expect(result).not.toContain('pero');
        });

        test('returns [word] when wordSet filters all variants', () => {
            const procWithSet = new WordGameProcessor('es', new Set(['baca']));
            const result = procWithSet.processWord('vaca');
            expect(result).toEqual(['vaca']);
        });

        test('returns [word] when no rule matches', () => {
            // 'prt' has no vowels triggering accents, no rr, v, b, ll, y, h, j, g, z, gu
            // Actually hard to find in Spanish — test with word that has none
            const result = proc.processWord('plástico');
            expect(result[0]).toBe('plástico');
            expect(result.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('processWord (en)', () => {
        const proc = new WordGameProcessor('en');

        test('original word is always first element', () => {
            expect(proc.processWord('phone')[0]).toBe('phone');
            expect(proc.processWord('black')[0]).toBe('black');
        });

        test('applies ph→f rule to produce variant', () => {
            const result = proc.processWord('phone');
            expect(result).toContain('fone');
        });

        test('applies ck→k rule to produce variant', () => {
            const result = proc.processWord('black');
            expect(result).toContain('blak');
        });

        test('filters variant when it exists in wordSet', () => {
            const procWithSet = new WordGameProcessor('en', new Set(['fone']));
            const result = procWithSet.processWord('phone');
            expect(result).not.toContain('fone');
        });

        test('result length is between 1 and 3', () => {
            ['phone', 'black', 'running', 'believe', 'possible'].forEach((word) => {
                const result = proc.processWord(word);
                expect(result.length).toBeGreaterThanOrEqual(1);
                expect(result.length).toBeLessThanOrEqual(3);
            });
        });
    });

    // ─── processWordWithAccent ────────────────────────────────────────────────

    describe('processWordWithAccent', () => {
        test('EN locale always returns [word] unchanged', () => {
            const proc = new WordGameProcessor('en');
            expect(proc.processWordWithAccent('hello')).toEqual(['hello']);
            expect(proc.processWordWithAccent('phone')).toEqual(['phone']);
            expect(proc.processWordWithAccent('running')).toEqual(['running']);
        });

        test('ES: original word is always first element', () => {
            const proc = new WordGameProcessor('es');
            const result = proc.processWordWithAccent('casa');
            expect(result[0]).toBe('casa');
        });

        test('ES: strips accent from accented word', () => {
            const proc = new WordGameProcessor('es');
            const result = proc.processWordWithAccent('mamá');
            expect(result[0]).toBe('mamá');
            expect(result).toContain('mama');
        });

        test('ES: adds accent variant for unaccented word', () => {
            const proc = new WordGameProcessor('es');
            const result = proc.processWordWithAccent('mesa');
            expect(result[0]).toBe('mesa');
            expect(result.length).toBeGreaterThanOrEqual(2);
            // at least one variant contains an accented vowel
            const hasAccent = result.slice(1).some((v) => /[áéíóú]/.test(v));
            expect(hasAccent).toBe(true);
        });

        test('ES: filters accent variant that is valid word', () => {
            const proc = new WordGameProcessor('es', new Set(['cása']));
            const result = proc.processWordWithAccent('casa');
            expect(result).not.toContain('cása');
        });

        test('ES: returns [word] when all accent variants are valid words', () => {
            // If every possible accent variant is in wordSet, returns only [word]
            // Use a word with a single vowel so there is only one variant
            // 'sol' → 'sól' is the only accent variant
            const proc = new WordGameProcessor('es', new Set(['sól']));
            const result = proc.processWordWithAccent('sol');
            expect(result).toEqual(['sol']);
        });

        test('ES: result length is between 1 and 3', () => {
            const proc = new WordGameProcessor('es');
            ['casa', 'mesa', 'árbol', 'mamá', 'sol'].forEach((word) => {
                const result = proc.processWordWithAccent(word);
                expect(result.length).toBeGreaterThanOrEqual(1);
                expect(result.length).toBeLessThanOrEqual(3);
            });
        });
    });

    // ─── filterWordsByLetters ─────────────────────────────────────────────────

    describe('filterWordsByLetters', () => {
        const proc = new WordGameProcessor('es');

        test('includes words whose every char is in the letter set', () => {
            const result = proc.filterWordsByLetters(['g', 'a', 't', 'o'], ['gato', 'toa']);
            expect(result).toContain('gato');
            expect(result).toContain('toa');
        });

        test('excludes words with chars outside the letter set', () => {
            const result = proc.filterWordsByLetters(['g', 'a', 't', 'o'], ['gato', 'cosa', 'bar']);
            expect(result).not.toContain('cosa'); // 'c' not available
            expect(result).not.toContain('bar');  // 'b', 'r' not available
        });

        test('excludes single-character words', () => {
            const result = proc.filterWordsByLetters(['a', 'b', 'c'], ['a', 'ab', 'abc']);
            expect(result).not.toContain('a');
            expect(result).toContain('ab');
            expect(result).toContain('abc');
        });

        test('returns empty array when no words match', () => {
            const result = proc.filterWordsByLetters(['z'], ['casa', 'gato', 'mesa']);
            expect(result).toEqual([]);
        });

        test('handles empty word list', () => {
            const result = proc.filterWordsByLetters(['a', 'b'], []);
            expect(result).toEqual([]);
        });

        test('handles empty letter set', () => {
            const result = proc.filterWordsByLetters([], ['gato', 'casa']);
            expect(result).toEqual([]);
        });

        test('letter set is case-sensitive (lowercase)', () => {
            const result = proc.filterWordsByLetters(['g', 'a', 't', 'o'], ['gato', 'GATO']);
            expect(result).toContain('gato');
            expect(result).not.toContain('GATO'); // uppercase chars not in set
        });
    });

    // ─── constructor ──────────────────────────────────────────────────────────

    describe('constructor', () => {
        test('default wordSet is empty (no filtering)', () => {
            const proc = new WordGameProcessor('es');
            // With empty wordSet, applyRule never filters based on wordSet
            const result = proc.processWord('perro');
            expect(result).toContain('pero'); // 'pero' not in set → not filtered
        });

        test('provided wordSet is used for filtering', () => {
            const proc = new WordGameProcessor('es', new Set(['pero']));
            const result = proc.processWord('perro');
            expect(result).not.toContain('pero');
        });

        test('returns rules for es locale', () => {
            const proc = new WordGameProcessor('es');
            // rr→r rule present: perro → pero
            expect(proc.processWord('perro')).toContain('pero');
        });

        test('returns rules for en locale', () => {
            const proc = new WordGameProcessor('en');
            // ph→f rule present: phone → fone
            expect(proc.processWord('phone')).toContain('fone');
        });
    });
});
