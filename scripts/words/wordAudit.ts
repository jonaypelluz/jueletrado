/**
 * words:audit library: finds and removes junk in the word lists
 * (ops/scripts/words/<locale>/<level>_words.txt) and the definitions
 * (public/definitions/<locale>/<letter>_definitions.json).
 *
 * Every finding is FIX, DELETE or FLAG. Check mode only reports; --fix applies
 * FIX/DELETE (FLAG is report-only). The CLI entry is scripts/words/auditWords.ts.
 * Unlike the other scripts in this folder, this module runs nothing on import,
 * so the jest tests drive it through runCli.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { DEFINITION_LETTERS, UNVERIFIED_TYPE_MARKER } from '../../config/DefinitionConfig';
import { printSummary, renderReport } from './auditReport';

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

export type Action = 'FIX' | 'DELETE' | 'FLAG';
export type CategoryId =
    | 'W1' | 'W2' | 'W3' | 'W4' | 'W5' | 'W6' | 'W7' | 'W8' | 'W9' | 'W10'
    | 'W11' | 'W12' | 'W13' | 'W14' | 'W15'
    | 'D1' | 'D2' | 'D3' | 'D3b' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8'
    | 'T1' | 'T2' | 'T3';

export type Finding = {
    category: CategoryId;
    action: Action;
    word: string;
    sense?: string | number;
    detail?: string;
    from?: string;
    to?: string;
};

export type Sense = {
    number: string | number;
    type: string;
    definition: string;
    type_extra?: string;
    definition_extra?: unknown;
};

export type Entry = { definitions: Sense[]; level?: string };

export type DefinitionFile = Record<string, Entry>;

export type WordSets = {
    allow: Set<string>;
    offensive: Set<string>;
    properNouns: Set<string>;
    foreign: Set<string>;
    abbreviations: Set<string>;
    htmlXml: Set<string>;
};

export type LocaleInput = {
    locale: Locale;
    lists: Record<Level, string[]>;
    definitions: Record<string, DefinitionFile>;
    wordSets: WordSets;
};

export type AuditResult = {
    findings: Finding[];
    lists: Record<Level, string[]>;
    definitions: Record<string, DefinitionFile>;
};

type WordContext = { locale: Locale; wordSets: WordSets };
type WordVerdict = { category: CategoryId; action: Action; fixed?: string };

export const ES_TYPES: readonly string[] = [
    'nombre masculino', 'nombre femenino', 'nombre masculino y femenino', 'nombre ambiguo', 'nombre',
    'nombre masculino o femenino',
    'verbo transitivo', 'verbo intransitivo', 'verbo pronominal', 'verbo copulativo', 'verbo auxiliar',
    'verbo impersonal', 'verbo', 'participio', 'adjetivo', 'adverbio', 'pronombre', 'artículo',
    'preposición', 'conjunción', 'interjección', 'onomatopeya', 'locución', 'expresión',
];

export const EN_TYPES: readonly string[] = [
    'noun', 'verb', 'adjective', 'adverb', 'preposition', 'pronoun', 'conjunction', 'interjection', 'numeral',
];

/** English labels crawlRAE.ts wrote into es senses, mapped to the generic Spanish head (R3). */
const ES_ENGLISH_TYPE_MAP: Record<string, string> = {
    noun: 'nombre',
    verb: 'verbo',
    adjective: 'adjetivo',
    adverb: 'adverbio',
    preposition: 'preposición',
    pronoun: 'pronombre',
    conjunction: 'conjunción',
    interjection: 'interjección',
    article: 'artículo',
};

const REGISTER_QUALIFIERS = ['desusado', 'poco usado', 'coloquial'];
const ES_HEADS = ['adjetivo', 'adverbio', 'pronombre', 'conjunción', 'locución', 'locuciones'];
const ES_RENAMES: Record<string, { type: string; extra?: string }> = {
    'nombre femenino plural': { type: 'nombre femenino', extra: 'en plural' },
    'verbo intransitivo impersonal': { type: 'verbo impersonal' },
    'participio irregular': { type: 'participio' },
};

const MOJIBAKE_RE = /Ã|Â|â€|�/;
const CHARSET_RE: Record<Locale, RegExp> = { es: /^[a-záéíóúüñ]+$/, en: /^[a-z]+$/ };
const VOWEL_RE: Record<Locale, RegExp> = { es: /[aeiouáéíóúü]/, en: /[aeiouy]/ };
/** Single letters that are real words; exempt from every word rule (P11). */
const SINGLE_LETTER_WORDS: Record<Locale, ReadonlySet<string>> = {
    es: new Set(['a', 'e', 'o', 'u', 'y']),
    en: new Set(['a', 'i']),
};
const ROMAN_RE = /^(?=[mdclxvi]{2,}$)m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/;
const ELONGATION_RE = /(\p{L})\1\1/u;
const EN_ABBREVIATION_SENSE_RE = /^(Abbreviation|Initialism|Acronym) of\b/i;
// (?<!de) skips the Spanish prefix des+h (deshacer, deshielo).
const FOREIGN_PATTERN_RE = /k|w|(?<!de)sh|th|ck|ing$|tion$/;

const LATEX_OR_WIKI_RE = /\\[a-zA-Z]+|\{\{|\}\}|\[\[|\]\]/;
const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
const HTML_ENTITY_RE = /&(amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+);/gi;
const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const MIN_TEXT_LETTERS = 3;
const ES_CROSS_REF_RE = /^(v\.|ver) \S+( \d+)?\.$/i;
/** A bare single word, with an optional RAE homograph number (`ser1.`). */
const ES_SINGLE_WORD_RE = /^\p{L}+\d*\.$/u;
const EN_CROSS_REF_RE = /^(See also|See|Cf\.) (?!you\b)([^;]*\.)$/;
const EN_CROSS_REF_MAX_TOKENS = 3;
const EN_FORM_OF_RE = new RegExp(
    '^(plural of|alternative (spelling|form|letter-case form) of|(obsolete|archaic) (spelling|form) of|' +
        'past (tense|participle) of|present participle of|third-person singular|misspelling of|contraction of|' +
        'eye dialect of|nonstandard spelling of|(comparative|superlative) form of)\\b',
    'i',
);
const ES_FORM_OF_RE = /^((plural|femenino|participio|gerundio)|forma (plural|femenina|masculina)) de \p{L}+\.$/iu;
const TRUNCATED_RE = /[,;:]\.?$/;
/** A list lead-in left dangling once the truncated list is cut (`…, particularly.`); dropped so the sense reads as a sentence. */
const DANGLING_LEAD_IN_RE =
    /[,;]?\s*\(?\b(particularly|especially|specifically|including|notably|namely|in particular|such as|as|thus|for example|for instance|equivalent to)\)?\.$/i;

/** Abbreviations whose `. ` does not end a sentence, so R15 does not cut there. */
const ABBREVIATION_STOP_RE = /\b(etc|e\.g|i\.e|cf|vs|viz|approx|esp|ca)$/i;

const ACCENT_STRIP: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' };
const MAX_FIX_PASSES = 3;

export class MissingDataFileError extends Error {
    constructor(filePath: string) {
        super(`Missing data file: ${filePath}`);
        this.name = 'MissingDataFileError';
    }
}

// ---------------------------------------------------------------------------
// Word rules
// ---------------------------------------------------------------------------

/** NFC plus a latin1→utf8 round-trip for mojibake; null when the result is still not a valid word. */
export const repairEncoding = (word: string, locale: Locale): string | null => {
    let repaired = word.normalize('NFC');
    if (MOJIBAKE_RE.test(repaired)) repaired = Buffer.from(repaired, 'latin1').toString('utf8').normalize('NFC');
    return !MOJIBAKE_RE.test(repaired) && CHARSET_RE[locale].test(repaired.toLowerCase()) ? repaired : null;
};

const isAllAbbreviations = (entry: Entry | undefined): boolean =>
    !!entry && entry.definitions.length > 0 &&
    entry.definitions.every((sense) => EN_ABBREVIATION_SENSE_RE.test(sense.definition.trim()));

/** Runs W1→W11 in order; the first match wins. null keeps the word. */
export const classifyWord = (word: string, entry: Entry | undefined, { locale, wordSets }: WordContext): WordVerdict | null => {
    if (word !== word.normalize('NFC') || MOJIBAKE_RE.test(word)) {
        const fixed = repairEncoding(word, locale);
        return fixed ? { category: 'W1', action: 'FIX', fixed } : { category: 'W1', action: 'DELETE' };
    }
    if (word !== word.toLowerCase()) return { category: 'W2', action: 'FIX', fixed: word.toLowerCase() };
    if (!CHARSET_RE[locale].test(word)) return { category: 'W3', action: 'DELETE' };
    if (SINGLE_LETTER_WORDS[locale].has(word) || wordSets.allow.has(word)) return null;
    if (Array.from(word).length === 1) return { category: 'W4', action: 'DELETE' };

    const deleteAs = (category: CategoryId): WordVerdict => ({ category, action: 'DELETE' });
    if (!VOWEL_RE[locale].test(word) || wordSets.abbreviations.has(word)) return deleteAs('W5');
    if (locale === 'en' && isAllAbbreviations(entry)) return deleteAs('W5');
    if (ROMAN_RE.test(word)) return deleteAs('W6');
    if (ELONGATION_RE.test(word)) return deleteAs('W7');
    if (wordSets.properNouns.has(word)) return deleteAs('W8');
    if (locale === 'es' && wordSets.foreign.has(word)) return deleteAs('W9');
    if (wordSets.offensive.has(word)) return deleteAs('W10');
    if (wordSets.htmlXml.has(word)) return deleteAs('W11');
    return null;
};

// ---------------------------------------------------------------------------
// Sense rules
// ---------------------------------------------------------------------------

export type SenseVerdict = { delete?: CategoryId; text?: string; fix?: 'D2' | 'D5' | 'D8'; flags: CategoryId[] };

const MAX_CODE_POINT = 0x10ffff;

/** Code point of a numeric entity name (`#n` / `#xh`); null for a named entity. */
const entityCodePoint = (name: string): number | null => {
    const lower = name.toLowerCase();
    if (lower.startsWith('#x')) return parseInt(lower.slice(2), 16);
    if (lower.startsWith('#')) return parseInt(lower.slice(1), 10);
    return null;
};

const hasInvalidEntity = (text: string): boolean =>
    [...text.matchAll(HTML_ENTITY_RE)].some((match) => (entityCodePoint(match[1]) ?? 0) > MAX_CODE_POINT);

const decodeEntity = (_match: string, name: string): string => {
    const codePoint = entityCodePoint(name);
    return codePoint === null ? NAMED_ENTITIES[name.toLowerCase()] : String.fromCodePoint(codePoint);
};

/** Index of the last `. ` that ends a sentence (not one after `etc.`, `e.g.`…); -1 when there is none. */
const lastSentenceStop = (text: string): number => {
    let stop = text.lastIndexOf('. ');
    while (stop !== -1 && ABBREVIATION_STOP_RE.test(text.slice(0, stop))) stop = text.lastIndexOf('. ', stop - 1);
    return stop;
};

/** Drops dangling lead-ins until none is left (`…, particularly including.` → `….`). */
const dropLeadIns = (text: string): string => {
    let previous: string;
    do {
        previous = text;
        text = text.replace(DANGLING_LEAD_IN_RE, '.');
    } while (text !== previous);
    return text;
};

/** R15: cut the fragment after the last sentence `. ` when there is one, else end the text with `.` (en: dropping dangling lead-ins). */
const repairTruncated = (text: string, locale: Locale): string => {
    const lastStop = lastSentenceStop(text);
    if (lastStop !== -1) return text.slice(0, lastStop + 1);
    const ended = text.replace(TRUNCATED_RE, '.');
    return locale === 'en' ? dropLeadIns(ended) : ended;
};

const normalizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

const countLetters = (text: string): number => text.match(/\p{L}/gu)?.length ?? 0;

const isEnCrossRef = (text: string): boolean => {
    const match = text.match(EN_CROSS_REF_RE);
    return !!match && match[2].split(/\s+/).length <= EN_CROSS_REF_MAX_TOKENS;
};

const hasHtml = (text: string): boolean => text.search(HTML_TAG_RE) !== -1 || text.search(HTML_ENTITY_RE) !== -1;

const hasUnbalancedParens = (text: string): boolean =>
    (text.match(/\(/g)?.length ?? 0) !== (text.match(/\)/g)?.length ?? 0);

/** D1 → D7 → D2 → D8 → D3 → D4 → D5 on one sense. */
export const classifySense = (sense: Pick<Sense, 'type' | 'definition'>, locale: Locale): SenseVerdict => {
    const deleteAs = (category: CategoryId): SenseVerdict => ({ delete: category, flags: [] });
    let text = sense.definition ?? '';
    let fix: SenseVerdict['fix'];

    if (!text.trim()) return deleteAs('D1');
    if (locale === 'en' && (sense.type === 'proper noun' || /^\(proper noun\)/i.test(text.trim()))) return deleteAs('D7');
    if (LATEX_OR_WIKI_RE.test(text)) return deleteAs('D2');
    if (hasHtml(text)) {
        // An out-of-range numeric entity cannot be decoded: the sense is unreadable.
        if (hasInvalidEntity(text)) return deleteAs('D2');
        text = text.replace(HTML_TAG_RE, '').replace(HTML_ENTITY_RE, decodeEntity);
        if (countLetters(text) < MIN_TEXT_LETTERS) return deleteAs('D2');
        fix = 'D2';
    }
    const collapsed = normalizeText(text);
    if (collapsed !== text) {
        text = collapsed;
        fix = fix ?? 'D8';
    }

    const flags: CategoryId[] = [];
    const isCrossRef = (candidate: string): boolean =>
        locale === 'es' ? ES_CROSS_REF_RE.test(candidate) : isEnCrossRef(candidate);
    if (isCrossRef(text)) return deleteAs('D3');
    if (locale === 'es') {
        if (ES_SINGLE_WORD_RE.test(text)) flags.push('D3b');
        if (ES_FORM_OF_RE.test(text)) return deleteAs('D4');
    } else if (EN_FORM_OF_RE.test(text)) {
        return deleteAs('D4');
    }
    if (TRUNCATED_RE.test(text)) {
        text = repairTruncated(text, locale);
        if (countLetters(text) < MIN_TEXT_LETTERS) return deleteAs('D5');
        // The repair can leave a bare cross-reference or single word (`marrón2. a color,.` → `marrón2.`).
        if (isCrossRef(text)) return deleteAs('D3');
        if (locale === 'es' && ES_SINGLE_WORD_RE.test(text)) flags.push('D3b');
        fix = fix ?? 'D5';
    }
    if (hasUnbalancedParens(text)) flags.push('D5');

    return fix ? { fix, text, flags } : { flags };
};

/** D6: keeps the first of senses with the same normalized text. */
export const dedupeSenses = <T extends Pick<Sense, 'definition'>>(senses: T[]): T[] => {
    const seen = new Set<string>();
    return senses.filter((sense) => {
        const key = normalizeText(sense.definition);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

// ---------------------------------------------------------------------------
// Type rule
// ---------------------------------------------------------------------------

export type TypeVerdict = {
    type: string;
    typeExtra?: string;
    finding?: { category: 'T1' | 'T2' | 'T3'; action: Action };
};

const appendExtra = (typeExtra: string | undefined, extras: string[]): string | undefined =>
    extras.length === 0 ? typeExtra : [typeExtra, ...extras].filter(Boolean).join(', ');

const normalizeEsType = (normalized: string): { type: string; extras: string[] } => {
    let type = normalized;
    const extras: string[] = [];
    const qualifier = REGISTER_QUALIFIERS.find((q) => type.endsWith(` ${q}`));
    if (qualifier) type = type.slice(0, -qualifier.length - 1).trim();

    const rename = ES_RENAMES[type];
    if (rename) {
        type = rename.type;
        if (rename.extra) extras.push(rename.extra);
    }
    if (!ES_TYPES.includes(type)) {
        const head = ES_HEADS.find((h) => type === h || type.startsWith(`${h} `));
        if (head) {
            const rest = type.slice(head.length).trim();
            type = head === 'locuciones' ? 'locución' : head;
            if (rest) extras.push(rest);
        }
    }
    if (qualifier) extras.push(qualifier);
    if (ES_ENGLISH_TYPE_MAP[type]) {
        type = ES_ENGLISH_TYPE_MAP[type];
        extras.push(UNVERIFIED_TYPE_MARKER);
    }
    return { type, extras };
};

/** T1 maps the type onto the locale's closed list (FIX) or FLAGs it; T2 flags the unverified marker; T3 an empty type. */
export const normalizeType = (type: string, typeExtra: string | undefined, locale: Locale): TypeVerdict => {
    const unchanged = (finding?: TypeVerdict['finding']): TypeVerdict => ({ type, typeExtra, ...(finding && { finding }) });
    const normalized = normalizeText((type ?? '').toLowerCase());
    if (!normalized) return unchanged({ category: 'T3', action: 'FLAG' });

    const closed = locale === 'es' ? ES_TYPES : EN_TYPES;
    const { type: mapped, extras } = locale === 'es' ? normalizeEsType(normalized) : { type: normalized, extras: [] };
    if (!closed.includes(mapped)) return unchanged({ category: 'T1', action: 'FLAG' });

    if (mapped !== type || extras.length > 0) {
        return { type: mapped, typeExtra: appendExtra(typeExtra, extras), finding: { category: 'T1', action: 'FIX' } };
    }
    if (locale === 'es' && typeExtra?.includes(UNVERIFIED_TYPE_MARKER)) return unchanged({ category: 'T2', action: 'FLAG' });
    return unchanged();
};

// ---------------------------------------------------------------------------
// Locale audit (pure)
// ---------------------------------------------------------------------------

const stripAccents = (word: string): string => Array.from(word).map((c) => ACCENT_STRIP[c] ?? c).join('');

/** Copy of the sense with type/type_extra set; a new type_extra key goes right after type. */
const withType = (sense: Sense, type: string, typeExtra: string | undefined): Sense => {
    if (typeExtra === undefined || 'type_extra' in sense) {
        return { ...sense, type, ...(typeExtra !== undefined && { type_extra: typeExtra }) };
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(sense)) {
        result[key] = key === 'type' ? type : value;
        if (key === 'type') result.type_extra = typeExtra;
    }
    if (!('type' in sense)) Object.assign(result, { type, type_extra: typeExtra });
    return result as Sense;
};

/** Sense and type rules on one entry; returns the kept senses (renumbered) and pushes findings. */
const auditSenses = (word: string, senses: Sense[], locale: Locale, findings: Finding[]): Sense[] => {
    const kept: Sense[] = [];
    for (const original of senses) {
        const verdict = classifySense(original, locale);
        const at = { word, sense: original.number };
        if (verdict.delete) {
            findings.push({ ...at, category: verdict.delete, action: 'DELETE', detail: original.definition });
            continue;
        }
        verdict.flags.forEach((category) => findings.push({ ...at, category, action: 'FLAG', detail: original.definition }));
        if (verdict.fix && verdict.text !== undefined) {
            findings.push({ ...at, category: verdict.fix, action: 'FIX', from: original.definition, to: verdict.text });
            kept.push({ ...original, definition: verdict.text });
        } else {
            kept.push({ ...original });
        }
    }

    const unique = dedupeSenses(kept);
    kept.filter((sense) => !unique.includes(sense)).forEach((sense) =>
        findings.push({ word, sense: sense.number, category: 'D6', action: 'DELETE', detail: sense.definition }),
    );

    return unique.map((sense, index) => {
        const verdict = normalizeType(sense.type, sense.type_extra, locale);
        let result = sense;
        if (verdict.finding) {
            findings.push({ word, sense: sense.number, ...verdict.finding, from: sense.type, to: verdict.type });
            if (verdict.finding.action === 'FIX') result = withType(sense, verdict.type, verdict.typeExtra);
        }
        const number = typeof sense.number === 'string' ? String(index + 1) : index + 1;
        return result.number === number ? result : { ...result, number };
    });
};

/** Audits one locale and returns the findings plus the data with every FIX/DELETE applied. Never mutates input. */
export const auditLocale = (input: LocaleInput): AuditResult => {
    const { locale, wordSets } = input;
    const ctx = { locale, wordSets };
    const findings: Finding[] = [];

    const entries = new Map<string, Entry>();
    for (const file of Object.values(input.definitions)) {
        for (const [word, entry] of Object.entries(file)) if (!entries.has(word)) entries.set(word, entry);
    }
    const allWords = new Set<string>([...LEVELS.flatMap((level) => input.lists[level] ?? []), ...entries.keys()]);

    const deleted = new Set<string>();
    const renamed = new Map<string, WordVerdict & { fixed: string }>();
    for (const word of allWords) {
        const verdict = classifyWord(word, entries.get(word), ctx);
        if (!verdict) continue;
        findings.push({ word, category: verdict.category, action: verdict.action, ...(verdict.fixed && { from: word, to: verdict.fixed }) });
        if (verdict.fixed) renamed.set(word, { ...verdict, fixed: verdict.fixed });
        else if (verdict.action === 'DELETE') deleted.add(word);
    }

    const lists = {} as Record<Level, string[]>;
    for (const level of LEVELS) {
        const kept = new Set<string>();
        const seenOriginal = new Set<string>();
        lists[level] = [];
        for (const line of input.lists[level] ?? []) {
            const duplicateLine = seenOriginal.has(line);
            seenOriginal.add(line);
            if (deleted.has(line)) continue;
            const word = renamed.get(line)?.fixed ?? line;
            if (kept.has(word)) {
                const rename = renamed.get(line);
                if (duplicateLine) findings.push({ word, category: 'W15', action: 'FIX', detail: level });
                else if (rename) findings.push({ word, category: rename.category, action: 'FLAG', detail: `merged ${line} into ${word} (${level})` });
                continue;
            }
            kept.add(word);
            lists[level].push(word);
        }
    }

    const definitions: Record<string, DefinitionFile> = {};
    for (const [letter, file] of Object.entries(input.definitions)) {
        const out: DefinitionFile = {};
        for (const [key, entry] of Object.entries(file)) {
            if (deleted.has(key)) continue;
            const rename = renamed.get(key);
            const word = rename?.fixed ?? key;
            if (rename && (word in file || word in out)) {
                // The existing (or first repaired) form wins; the merge is logged under the rule that renamed the key.
                findings.push({ word, category: rename.category, action: 'FLAG', detail: `merged ${key} into existing ${word}; existing senses kept` });
                continue;
            }
            const senses = auditSenses(word, entry.definitions ?? [], locale, findings);
            if (senses.length > 0) out[word] = { ...entry, definitions: senses };
        }
        definitions[letter] = out;
    }

    findings.push(...crossListFlags(locale, lists, definitions));
    return { findings, lists, definitions };
};

/** W9 pattern, W12, W13 and W14 FLAGs on the cleaned data. */
const crossListFlags = (locale: Locale, lists: Record<Level, string[]>, definitions: Record<string, DefinitionFile>): Finding[] => {
    const flags: Finding[] = [];
    const levelsByWord = new Map<string, Level[]>();
    for (const level of LEVELS) {
        for (const word of lists[level]) levelsByWord.set(word, [...(levelsByWord.get(word) ?? []), level]);
    }
    for (const [word, levels] of levelsByWord) {
        if (locale === 'es' && FOREIGN_PATTERN_RE.test(word)) flags.push({ word, category: 'W9', action: 'FLAG', detail: levels.join(', ') });
        if (levels.length > 1) flags.push({ word, category: 'W13', action: 'FLAG', detail: levels.join(', ') });
    }

    const keys = Object.values(definitions).flatMap((file) => Object.keys(file));
    const groups = new Map<string, string[]>();
    for (const key of keys) {
        if (!levelsByWord.has(key)) flags.push({ word: key, category: 'W14', action: 'FLAG' });
        const base = stripAccents(key);
        groups.set(base, [...(groups.get(base) ?? []), key]);
    }
    for (const [base, group] of groups) {
        if (group.length > 1 && group.includes(base)) flags.push({ word: base, category: 'W12', action: 'FLAG', detail: group.join(', ') });
    }
    return flags;
};

export const hasFixOrDelete = (findings: Finding[]): boolean => findings.some((finding) => finding.action !== 'FLAG');

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

const wordsDir = (root: string): string => path.join(root, 'ops/scripts/words');
const listPath = (root: string, locale: Locale, level: Level): string => path.join(wordsDir(root), locale, `${level}_words.txt`);
const definitionPath = (root: string, locale: Locale, letter: string): string =>
    path.join(root, 'public/definitions', locale, `${letter}_definitions.json`);

const readRequired = async (filePath: string): Promise<string> => {
    if (!existsSync(filePath)) throw new MissingDataFileError(filePath);
    return readFile(filePath, 'utf-8');
};

/** One word per line, `#` comments; a missing file is an empty list. */
const loadWordList = async (filePath: string): Promise<string[]> => {
    if (!existsSync(filePath)) return [];
    const content = await readFile(filePath, 'utf-8');
    return content.split('\n').map((w) => w.trim().toLowerCase()).filter((w) => w.length > 0 && !w.startsWith('#'));
};

const loadWordSets = async (root: string, locale: Locale): Promise<WordSets> => {
    const load = (name: string) => loadWordList(path.join(wordsDir(root), name));
    const [allow, offensive, properNouns, foreign, abbreviations, htmlShared, htmlLocale] = await Promise.all([
        load(`allowlist_${locale}.txt`),
        load(`offensive_${locale}.txt`),
        load(`proper_nouns_${locale}.txt`),
        locale === 'es' ? load('foreign_es.txt') : Promise.resolve([]),
        load(`abbreviations_${locale}.txt`),
        load('html_xml_blocklist.txt'),
        load(`html_xml_blocklist_${locale}.txt`),
    ]);
    return {
        allow: new Set(allow),
        offensive: new Set(offensive),
        properNouns: new Set(properNouns),
        foreign: new Set(foreign),
        abbreviations: new Set(abbreviations),
        htmlXml: new Set([...htmlShared, ...htmlLocale]),
    };
};

/** Loads the 3 lists, the 26 definition files and the block/allow lists. A missing list or letter file throws. */
export const loadLocaleInput = async (root: string, locale: Locale): Promise<LocaleInput> => {
    const lists = {} as Record<Level, string[]>;
    for (const level of LEVELS) {
        const content = await readRequired(listPath(root, locale, level));
        lists[level] = content.split('\n').map((w) => w.trim()).filter(Boolean);
    }
    const definitions: Record<string, DefinitionFile> = {};
    for (const letter of DEFINITION_LETTERS) {
        definitions[letter] = JSON.parse(await readRequired(definitionPath(root, locale, letter)));
    }
    return { locale, lists, definitions, wordSets: await loadWordSets(root, locale) };
};

/** Writes only the list and definition files whose content changed. */
const writeLocaleOutput = async (root: string, original: LocaleInput, result: AuditResult): Promise<void> => {
    for (const level of LEVELS) {
        if (result.lists[level].join('\n') !== original.lists[level].join('\n')) {
            await writeFile(listPath(root, original.locale, level), result.lists[level].join('\n') + '\n', 'utf-8');
        }
    }
    for (const letter of Object.keys(result.definitions)) {
        const content = JSON.stringify(result.definitions[letter], null, 4);
        if (content !== JSON.stringify(original.definitions[letter], null, 4)) {
            await writeFile(definitionPath(root, original.locale, letter), content, 'utf-8');
        }
    }
};

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export type AuditOptions = { root: string; locales: readonly Locale[]; fix: boolean; reportPath?: string };

const defaultReportPath = (root: string, locale: Locale): string =>
    path.join(root, 'ops/crawl-output/audit', `${locale}-report.md`);

/** Audits (and with fix, cleans) each locale and writes its report. 1 when FIX/DELETE remain. */
export const runAudit = async ({ root, locales, fix, reportPath }: AuditOptions): Promise<0 | 1> => {
    let exitCode: 0 | 1 = 0;
    for (const locale of locales) {
        const input = await loadLocaleInput(root, locale);
        const before = auditLocale(input);
        // "before" in the report: pass 1 plus the FIX/DELETE of every later pass that --fix applies.
        const beforeFindings = [...before.findings];
        let after: AuditResult | undefined;

        if (fix) {
            // A FIX can expose a later rule (XIV → xiv → roman numeral), so apply until stable.
            let data = input;
            after = before;
            for (let pass = 0; pass < MAX_FIX_PASSES && hasFixOrDelete(after.findings); pass++) {
                if (pass > 0) beforeFindings.push(...after.findings.filter((finding) => finding.action !== 'FLAG'));
                data = { ...data, lists: after.lists, definitions: after.definitions };
                after = auditLocale(data);
            }
            await writeLocaleOutput(root, input, after);
        }

        if (hasFixOrDelete((after ?? before).findings)) exitCode = 1;

        const target = reportPath ?? defaultReportPath(root, locale);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, renderReport(locale, beforeFindings, after?.findings), 'utf-8');
        printSummary(locale, beforeFindings, after?.findings);
        console.log(`Report: ${target}`);
    }
    if (fix) console.log('Run `yarn words:transform` to regenerate public/words and config/LevelConfig.ts.');
    return exitCode;
};

const USAGE = 'Usage: yarn words:audit [--locale es|en] [--fix] [--report <path>] [--root <dir>]';

type CliOptions = { locale?: string; fix: boolean; report?: string; root?: string };

const parseArgs = (argv: string[]): CliOptions | null => {
    const options: CliOptions = { fix: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--fix') {
            options.fix = true;
            continue;
        }
        const key = ({ '--locale': 'locale', '--report': 'report', '--root': 'root' } as const)[arg];
        const value = argv[i + 1];
        if (!key || value === undefined || value.startsWith('--')) return null;
        options[key] = value;
        i++;
    }
    return options;
};

const isFsError = (error: unknown): boolean =>
    error instanceof Error && typeof (error as NodeJS.ErrnoException).code === 'string';

/** CLI entry: 0 clean / fixed, 1 check found FIX/DELETE, 2 bad args or a missing data file. */
export const runCli = async (argv: string[], cwd: string): Promise<0 | 1 | 2> => {
    const options = parseArgs(argv);
    const fail = (message: string): 2 => {
        console.error(message);
        return 2;
    };
    if (!options) return fail(USAGE);
    if (options.locale !== undefined && !(LOCALES as readonly string[]).includes(options.locale)) {
        return fail(`Unknown locale "${options.locale}". ${USAGE}`);
    }
    if (options.report !== undefined && options.locale === undefined) return fail(`--report needs --locale. ${USAGE}`);

    try {
        return await runAudit({
            root: path.resolve(cwd, options.root ?? '.'),
            locales: options.locale ? [options.locale as Locale] : LOCALES,
            fix: options.fix,
            reportPath: options.report && path.resolve(cwd, options.report),
        });
    } catch (error) {
        // Missing data file, invalid JSON or any fs error (EACCES, EISDIR, ...): exit 2.
        if (error instanceof MissingDataFileError || error instanceof SyntaxError || isFsError(error)) return fail((error as Error).message);
        throw error;
    }
};
