/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import { WORD_GROUP_FETCH_CONFIG } from '../../../config/WordGroupConfig';
import { countAllLocales, diffPools } from '../../../scripts/words/levelCounts';
import { LEVELS, LOCALES } from '../../../scripts/words/wordAudit';

// Pool identity for the v2 data layer (JUE-0009 Phase 2): every level-counts pool rebuilt from the
// v2 chunks through matchesQuery and the games' own query objects must have the same count and
// hash as the baseline frozen from the legacy lists and filters before the change. JUE-0012 changed
// the lists on purpose (blocklisted words out, proper nouns back with isProperNoun) and refreshed it
// with `yarn words:level-counts --out tests/fixtures/pools/phase2-baseline.json`.
const BASELINE = path.join(__dirname, '../../fixtures/pools/phase2-baseline.json');

type Snapshot = Record<string, { count: number; min: number | null; hash?: string }>;

let baseline: Snapshot;
let current: Snapshot;

beforeAll(async () => {
    baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf-8'));
    current = await countAllLocales();
}, 300000);

test('the baseline snapshots every prefetch group and the wordChain seed per locale and level', () => {
    const expected = LOCALES.flatMap((locale) =>
        LEVELS.flatMap((level) => [
            ...WORD_GROUP_FETCH_CONFIG.map((group) => `${locale}/${level}/prefetch/${group.key}`),
            `${locale}/${level}/wordChain/seed`,
        ]),
    );

    expect(expected.filter((key) => !(key in baseline))).toEqual([]);
});

test('every game pool built from the v2 chunks is identical to the pre-change baseline', () => {
    expect(Object.values(baseline).every((entry) => typeof entry.hash === 'string')).toBe(true);
    expect(diffPools(baseline, current)).toEqual([]);
});
