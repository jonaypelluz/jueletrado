/**
 * @jest-environment node
 */
import path from 'path';
import { EN_TYPES, ES_TYPES, auditLocale, loadLocaleInput } from '../../../scripts/words/wordAudit';

const repoRoot = path.resolve(__dirname, '../../..');

describe.each([
    ['es', ES_TYPES],
    ['en', EN_TYPES],
] as const)('words:audit on the real %s data', (locale, closedTypes) => {
    let result: ReturnType<typeof auditLocale>;

    beforeAll(async () => {
        result = auditLocale(await loadLocaleInput(repoRoot, locale));
    }, 120_000);

    test('has no FIX or DELETE finding', () => {
        const pending = result.findings.filter((finding) => finding.action !== 'FLAG');

        expect(pending.slice(0, 20)).toEqual([]);
    });

    test('has every sense type in the closed list', () => {
        const types = new Set(
            Object.values(result.definitions).flatMap((file) =>
                Object.values(file).flatMap((entry) => entry.definitions.map((sense) => sense.type)),
            ),
        );

        expect([...types].filter((type) => !closedTypes.includes(type))).toEqual([]);
    });
});
