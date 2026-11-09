/**
 * words:audit rendering: console summary and the per-locale markdown report
 * (category table, seeded samples, deleted offensive words, FLAG backlog).
 */

import type { Action, CategoryId, Finding, Locale } from './wordAudit';

const SAMPLE_SIZE = 20;

const CATEGORY_LABELS: Record<CategoryId, string> = {
    W1: 'encoding', W2: 'case', W3: 'charset', W4: 'single letter', W5: 'abbreviation',
    W6: 'roman numeral', W7: 'elongation', W8: 'proper noun', W9: 'foreign', W10: 'blocklisted word',
    W11: 'HTML/XML artifact', W12: 'accent-only duplicate', W13: 'in several levels', W14: 'definition in no list',
    W15: 'list duplicate', D1: 'empty sense', D2: 'markup', D3: 'cross-reference', D3b: 'single-word sense',
    D4: 'form-of', D5: 'truncated / unbalanced parens', D6: 'duplicate sense', D7: 'proper-noun sense',
    D8: 'whitespace', T1: 'type normalisation', T2: 'unverified type', T3: 'empty type',
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as CategoryId[];
const ACTION_ORDER: Action[] = ['FIX', 'DELETE', 'FLAG'];

type Group = { category: CategoryId; action: Action; findings: Finding[] };

/** Findings grouped by category and action, in category order. */
export const summarize = (findings: Finding[]): Group[] => {
    const groups = new Map<string, Group>();
    for (const finding of findings) {
        const id = `${finding.category}|${finding.action}`;
        if (!groups.has(id)) groups.set(id, { category: finding.category, action: finding.action, findings: [] });
        groups.get(id)!.findings.push(finding);
    }
    const rank = (group: Group) => CATEGORY_ORDER.indexOf(group.category) * ACTION_ORDER.length + ACTION_ORDER.indexOf(group.action);
    return [...groups.values()].sort((a, b) => rank(a) - rank(b));
};

const countOf = (groups: Group[], category: CategoryId, action: Action): number =>
    groups.find((g) => g.category === category && g.action === action)?.findings.length ?? 0;

const hashString = (text: string): number => {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return hash >>> 0;
};

const mulberry32 = (seed: number) => () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Deterministic SAMPLE_SIZE items: seeded Fisher-Yates over the sorted items, re-sorted. */
const seededSample = (items: string[], seed: string): string[] => {
    const shuffled = [...items].sort();
    const random = mulberry32(hashString(seed));
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, SAMPLE_SIZE).sort();
};

const describe = (finding: Finding): string => {
    if (finding.sense !== undefined) {
        const change = finding.from !== undefined ? `${finding.from} → ${finding.to}` : finding.detail ?? '';
        return `${finding.word} (${finding.sense}): ${change}`;
    }
    if (finding.to !== undefined) return `${finding.from} → ${finding.to}`;
    return finding.detail ? `${finding.word} (${finding.detail})` : finding.word;
};

const typeTable = (findings: Finding[]): string[] => {
    const counts = new Map<string, number>();
    for (const finding of findings) {
        const pair = `${finding.from || '(empty)'} → ${finding.to || '(empty)'}`;
        counts.set(pair, (counts.get(pair) ?? 0) + 1);
    }
    const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, SAMPLE_SIZE);
    return ['| from → to | count |', '|---|---|', ...rows.map(([pair, count]) => `| ${pair} | ${count} |`)];
};

const sampleSection = (locale: Locale, group: Group): string[] => {
    const lines = [`### ${group.category} ${CATEGORY_LABELS[group.category]} — ${group.action} (${group.findings.length})`, ''];
    if (group.category.startsWith('T')) return [...lines, ...typeTable(group.findings), ''];
    const sample = seededSample(group.findings.map(describe), `${locale}${group.category}${group.action}`);
    return [...lines, ...sample.map((item) => `- ${item}`), ''];
};

/** Markdown report: before → after per category in fix mode, before only in check mode. */
export const renderReport = (locale: Locale, before: Finding[], after?: Finding[]): string => {
    const beforeGroups = summarize(before);
    const afterGroups = after && summarize(after);
    const rows = [...beforeGroups, ...(afterGroups ?? []).filter((g) => countOf(beforeGroups, g.category, g.action) === 0)];

    const table = rows.map(({ category, action }) => {
        const found = countOf(beforeGroups, category, action);
        if (!afterGroups) return `| ${category} | ${action} | ${found} | - | - | - |`;
        const left = countOf(afterGroups, category, action);
        const applied = action === 'FLAG' ? 0 : Math.max(found - left, 0);
        return `| ${category} | ${action} | ${found} | ${left} | ${action === 'FIX' ? applied : 0} | ${action === 'DELETE' ? applied : 0} |`;
    });

    const offensive = before.filter((f) => f.category === 'W10' && f.action === 'DELETE').map((f) => f.word).sort();
    const backlog = (afterGroups ?? beforeGroups).filter((g) => g.action === 'FLAG');

    return [
        `# words:audit report — ${locale} (${after ? 'fix' : 'check'})`,
        '',
        '## Summary',
        '',
        '| category | action | before | after | fixed | deleted |',
        '|---|---|---|---|---|---|',
        ...table,
        '',
        `## Deleted offensive words (${offensive.length})`,
        '',
        ...(offensive.length ? offensive.map((word) => `- ${word}`) : ['none']),
        '',
        '## FLAG backlog',
        '',
        ...(backlog.length
            ? backlog.map((g) => `- ${g.category} ${CATEGORY_LABELS[g.category]}: ${g.findings.length}`)
            : ['none']),
        '',
        '## Samples',
        '',
        ...beforeGroups.flatMap((group) => sampleSection(locale, group)),
    ].join('\n');
};

/** One console line per category: found, fixed, deleted, flagged. */
export const printSummary = (locale: Locale, before: Finding[], after?: Finding[]): void => {
    const afterGroups = after && summarize(after);
    console.log(`\n[${locale}] category  found  fixed  deleted  flagged`);
    for (const group of summarize(before)) {
        const found = group.findings.length;
        const applied = afterGroups ? found - countOf(afterGroups, group.category, group.action) : 0;
        const fixed = group.action === 'FIX' ? applied : 0;
        const deleted = group.action === 'DELETE' ? applied : 0;
        const flagged = group.action === 'FLAG' ? found : 0;
        console.log(`[${locale}] ${group.category.padEnd(4)} ${group.action.padEnd(6)} ${found}  ${fixed}  ${deleted}  ${flagged}`);
    }
};
