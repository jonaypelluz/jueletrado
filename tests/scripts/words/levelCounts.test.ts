/**
 * @jest-environment node
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { compareCounts, diffPools, poolHash, runCli } from '../../../scripts/words/levelCounts';

type Counts = Record<string, { count: number; min: number | null; hash?: string }>;

let dir: string;
let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'level-counts-'));
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    logSpy.mockRestore();
    errorSpy.mockRestore();
});

const output = (spy: jest.SpyInstance): string => spy.mock.calls.map((args) => args.join(' ')).join('\n');

describe('compareCounts', () => {
    test('flags a pool that met its minimum in the baseline and now falls below', () => {
        const baseline: Counts = { 'es/beginner/wordsRain': { count: 50, min: 40 } };
        const current: Counts = { 'es/beginner/wordsRain': { count: 30, min: 40 } };

        expect(compareCounts(baseline, current)).toBe(true);
        expect(output(errorSpy)).toContain('es/beginner/wordsRain: 50 → 30 (min 40)');
    });

    test('a pool already below its minimum in the baseline is pre-existing, not a regression', () => {
        const baseline: Counts = { 'es/advanced/spellingBee/k': { count: 0, min: 1 } };
        const current: Counts = { 'es/advanced/spellingBee/k': { count: 0, min: 1 } };

        expect(compareCounts(baseline, current)).toBe(false);
        expect(output(logSpy)).toContain('Already below minimum in the baseline');
        expect(output(logSpy)).toContain('es/advanced/spellingBee/k (0 < 1)');
        expect(output(errorSpy)).not.toContain('Regressions');
    });

    test('a key missing from the current counts is listed as removed, not a regression', () => {
        const baseline: Counts = {
            'en/beginner/wordFinder': { count: 100, min: 10 },
            'en/beginner/wordsRain': { count: 100, min: 10 },
        };
        const current: Counts = { 'en/beginner/wordsRain': { count: 100, min: 10 } };

        expect(compareCounts(baseline, current)).toBe(false);
        expect(output(logSpy)).toContain('no longer counted (removed)');
        expect(output(logSpy)).toContain('en/beginner/wordFinder');
        expect(output(errorSpy)).not.toContain('Regressions');
    });

    test('no regression when every pool still meets its minimum or has none', () => {
        const baseline: Counts = {
            'es/beginner/wordBuilder': { count: 10, min: null },
            'es/beginner/wordsRain': { count: 50, min: 40 },
        };
        const current: Counts = {
            'es/beginner/wordBuilder': { count: 2, min: null },
            'es/beginner/wordsRain': { count: 40, min: 40 },
        };

        expect(compareCounts(baseline, current)).toBe(false);
    });
});

describe('runCli', () => {
    const current: Counts = { 'es/beginner/wordsRain': { count: 30, min: 40 } };
    const countAll = async (): Promise<Counts> => current;
    const writeBaseline = (counts: Counts): string => {
        const file = path.join(dir, 'baseline.json');
        fs.writeFileSync(file, JSON.stringify(counts));
        return file;
    };

    test('exits 1 on a regression against the baseline', async () => {
        const baseline = writeBaseline({ 'es/beginner/wordsRain': { count: 50, min: 40 } });
        const out = path.join(dir, 'out.json');

        await expect(runCli(['--out', out, '--baseline', baseline], countAll)).resolves.toBe(1);
        expect(JSON.parse(fs.readFileSync(out, 'utf-8'))).toEqual(current);
    });

    test('exits 0 when nothing regressed', async () => {
        const baseline = writeBaseline({ 'es/beginner/wordsRain': { count: 30, min: 40 } });

        await expect(runCli(['--out', path.join(dir, 'out.json'), '--baseline', baseline], countAll)).resolves.toBe(0);
    });

    test('exits 2 on an unknown flag without counting', async () => {
        const count = jest.fn(countAll);

        await expect(runCli(['--bogus', 'x'], count)).resolves.toBe(2);
        expect(count).not.toHaveBeenCalled();
    });

    test('exits 2 when the baseline file is missing', async () => {
        await expect(runCli(['--out', path.join(dir, 'out.json'), '--baseline', path.join(dir, 'nope.json')], countAll)).resolves.toBe(2);
    });
});

describe('poolHash', () => {
    test('is 16 hex characters and does not depend on word order', () => {
        const hash = poolHash(['casa', 'árbol', 'perro']);

        expect(hash).toMatch(/^[0-9a-f]{16}$/);
        expect(poolHash(['perro', 'casa', 'árbol'])).toBe(hash);
    });

    test('changes when one word of the pool changes', () => {
        expect(poolHash(['casa', 'perro'])).not.toBe(poolHash(['casa', 'perra']));
    });
});

describe('diffPools', () => {
    test('reports a key whose count matches but whose hash differs', () => {
        const baseline: Counts = { 'es/beginner/wordsRain': { count: 2, min: 150, hash: 'aaaaaaaaaaaaaaaa' } };
        const current: Counts = { 'es/beginner/wordsRain': { count: 2, min: 150, hash: 'bbbbbbbbbbbbbbbb' } };

        expect(diffPools(baseline, current)).toEqual([expect.stringContaining('es/beginner/wordsRain')]);
    });

    test('reports added and removed keys, sorted by key', () => {
        const baseline: Counts = { 'es/beginner/wordBuilder': { count: 1, min: null, hash: 'aaaaaaaaaaaaaaaa' } };
        const current: Counts = { 'es/advanced/wordBuilder': { count: 1, min: null, hash: 'aaaaaaaaaaaaaaaa' } };

        const diff = diffPools(baseline, current);

        expect(diff).toHaveLength(2);
        expect(diff[0]).toContain('es/advanced/wordBuilder');
        expect(diff[1]).toContain('es/beginner/wordBuilder');
    });

    test('returns no differences for identical snapshots', () => {
        const snapshot: Counts = { 'en/beginner/wordsRain': { count: 3, min: 150, hash: 'cccccccccccccccc' } };

        expect(diffPools(snapshot, { ...snapshot })).toEqual([]);
    });
});

describe('runCli --strict', () => {
    const current: Counts = { 'es/beginner/wordsRain': { count: 2, min: 150, hash: 'bbbbbbbbbbbbbbbb' } };
    const countAll = async (): Promise<Counts> => current;
    const writeBaseline = (counts: Counts): string => {
        const file = path.join(dir, 'baseline.json');
        fs.writeFileSync(file, JSON.stringify(counts));
        return file;
    };

    test('exits 1 and prints the key when a pool hash changed with the same count', async () => {
        const baseline = writeBaseline({ 'es/beginner/wordsRain': { count: 2, min: 150, hash: 'aaaaaaaaaaaaaaaa' } });

        await expect(runCli(['--out', path.join(dir, 'out.json'), '--baseline', baseline, '--strict'], countAll)).resolves.toBe(1);
        expect(`${output(logSpy)}\n${output(errorSpy)}`).toContain('es/beginner/wordsRain');
    });

    test('exits 0 when every pool is identical to the baseline', async () => {
        const baseline = writeBaseline(current);

        await expect(runCli(['--out', path.join(dir, 'out.json'), '--baseline', baseline, '--strict'], countAll)).resolves.toBe(0);
    });

    test('exits 2 without counting when --strict has no --baseline, and the usage names --strict', async () => {
        const count = jest.fn(countAll);

        await expect(runCli(['--out', path.join(dir, 'out.json'), '--strict'], count)).resolves.toBe(2);
        expect(count).not.toHaveBeenCalled();
        expect(output(errorSpy)).toContain('[--strict]');
    });
});
