/**
 * words:import-wiktionary: imports es lemmas from the es.wiktionary dump into public/definitions/es.
 *
 *   yarn words:import-wiktionary [--dump <path>] [--letter <l>] [--dry-run] [--root <dir>]
 *
 * Streams the dump (`.bz2` through `bzcat`, `.xml` read directly), keeps ns-0 single-word lowercase titles,
 * reads the lemma POS sections of the `{{lengua|es}}` section, cleans each sense into plain text and runs the
 * words:audit sense and word rules on it. RAE wins: a key without `source` is never touched. A new key is
 * written as `{ level: 'advanced', source: 'wiktionary', definitions }` (nobody reviewed it for the lower levels); a new
 * word in no level list is appended to the advanced list, listed words keep their lists.
 * Each letter is written split by isAdvancedOnly (advanced entries → `<letter>_definitions_advanced.json`).
 * `--dry-run` writes no data file. Run `yarn words:audit --locale es --fix` and `yarn words:build` afterwards
 * (see ops/docs/commands.md).
 *
 * Exit codes: 0 ok, 1 I/O / bzcat failure or a missing data file, 2 bad arguments or a missing dump.
 */

import { spawn } from 'child_process';
import { createReadStream, existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import { DEFINITION_LETTERS } from '../../config/DefinitionConfig';
import { Level } from '../../models/types';
import { computeLevel, definitionLetter } from '../../utils/WordRecord';
import { loadFrequencyRanks } from './buildWordData';
import {
    CategoryId,
    DefinitionFile,
    ES_TYPES,
    Entry,
    LEVELS,
    MissingDataFileError,
    Sense,
    classifySense,
    classifyWord,
    dedupeSenses,
    isAdvancedOnly,
    listPath,
    loadLocaleInput,
    normalizeType,
    splitDefinitionFile,
    writeLetterDefinitions,
} from './wordAudit';

export type WikiPage = { title: string; ns: string; text: string; timestamp?: string; redirect: boolean };
export type PosMapping = { type: string; typeExtra?: string };
export type DropReason = 'form-of' | 'offensive' | 'wiki' | 'unresolved-template' | 'too-short' | 'audit';
export type CleanResult = { text: string } | { drop: DropReason; template?: string };
export type PageSkip = 'not-lemma' | 'form-of-only' | 'no-usable-sense' | 'offensive-gloss';
/** Caller-owned accumulator for the report; parse functions stay pure apart from incrementing it. */
export type ParseTally = {
    pageSkips: Record<PageSkip, number>;
    senseDrops: Record<DropReason, number>;
    unresolvedTemplates: Map<string, number>;
    unmappedPos: Map<string, number>;
};

export const DEFAULT_DUMP = 'ops/crawl-output/wiktionary/eswiktionary-latest-pages-articles.xml.bz2';
export const REPORT_PATH = 'ops/crawl-output/wiktionary/es-import-report.md';
const DUMP_URL = 'https://dumps.wikimedia.org/eswiktionary/latest/eswiktionary-latest-pages-articles.xml.bz2';

/** Level of every imported entry and list addition. */
const IMPORT_LEVEL: Level = 'advanced';
const TITLE_RE = /^[a-záéíóúüñ]+$/;
const LETTER_COUNT_MIN = 3;
const SAMPLE_SIZE = 20;
const TOP_TEMPLATES = 30;

// ---------------------------------------------------------------------------
// XML entities
// ---------------------------------------------------------------------------

const XML_ENTITY_RE = /&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);/gi;
const XML_NAMED: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

/** Single pass (R11): &lt; &gt; &amp; &quot; &#39; &#039; &#N; &#xH; — `&amp;lt;` → `&lt;`. */
export const decodeEntities = (text: string): string =>
    text.replace(XML_ENTITY_RE, (match, name: string) => {
        const lower = name.toLowerCase();
        if (!lower.startsWith('#')) return XML_NAMED[lower];
        const codePoint = lower.startsWith('#x') ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
        return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
    });

// ---------------------------------------------------------------------------
// POS mapping
// ---------------------------------------------------------------------------

/** Heads a lemma POS header may start with; anything else (participio, sufijo, sigla…) is skipped. */
const POS_HEADS = new Set([
    'sustantivo', 'verbo', 'adjetivo', 'adverbio', 'pronombre', 'conjunción', 'locución', 'artículo',
    'interjección', 'onomatopeya', 'preposición', 'expresión',
]);
const ARTICLE_EXTRAS: Record<string, string> = { 'artículo determinado': 'determinado', 'artículo indeterminado': 'indeterminado' };

const mapExactPos = (header: string): PosMapping | null => {
    if (ARTICLE_EXTRAS[header]) return { type: 'artículo', typeExtra: ARTICLE_EXTRAS[header] };
    const head = header.split(' ')[0];
    if (!POS_HEADS.has(head)) return null;
    const candidate = header.replace(/^sustantivo\b/, 'nombre').replace(/^nombre masculino femenino$/, 'nombre masculino y femenino');
    const verdict = normalizeType(candidate, undefined, 'es');
    if (verdict.finding?.action === 'FLAG' || !ES_TYPES.includes(verdict.type)) return null;
    return verdict.typeExtra === undefined ? { type: verdict.type } : { type: verdict.type, typeExtra: verdict.typeExtra };
};

const NON_LEMMA_QUALIFIERS = new Set(['propio', 'enclítico']);

/**
 * Header text or template name (`sustantivo femenino`, `adverbio de modo`) → closed ES_TYPES type + extra; null = skip.
 * A header with extra template args (`verbo transitivo intransitivo`, `sustantivo femenino epiceno`) falls back to its first two words.
 */
export const mapPos = (header: string): PosMapping | null => {
    const normalized = header.replace(/\s+/g, ' ').trim().toLowerCase();
    if (normalized.startsWith('forma')) return null;
    const words = normalized.split(' ');
    // The fallback never drops a word that makes the header a non-lemma (`sustantivo masculino propio`).
    const canFallBack = words.length > 2 && !words.slice(2).some((word) => NON_LEMMA_QUALIFIERS.has(word));
    return mapExactPos(normalized) ?? (canFallBack ? mapExactPos(words.slice(0, 2).join(' ')) : null);
};

// ---------------------------------------------------------------------------
// Sense cleanup
// ---------------------------------------------------------------------------

const FORM_OF_EXACT = new Set([
    'f.s.p', 'plural', 'diminutivo', 'aumentativo', 'superlativo', 'comparativo', 'participio', 'apellido',
    'hipocorístico', 'sigla', 'abreviatura', 'símbolo',
]);
const FORM_OF_PREFIXES = ['forma', 'variante', 'grafía', 'antropónimo'];
const STRIPPED = new Set(['taxón', 'cita requerida', 'definición imprecisa', 'ampliable', 'referencia']);
const REFERENCE_PREFIX_RE = /^(drae|dle|dlc)/;

const isFormOf = (name: string): boolean => FORM_OF_EXACT.has(name) || FORM_OF_PREFIXES.some((prefix) => name.startsWith(prefix));

const upperFirst = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const SCRIPTABLE = '0123456789+-';
/** SCRIPTABLE char → the char at the same position of `chars`. */
const scriptMap = (chars: string): Record<string, string> => Object.fromEntries(Array.from(SCRIPTABLE, (char, i) => [char, chars[i]]));
const SUPERSCRIPT = scriptMap('⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻');
const SUBSCRIPT = scriptMap('₀₁₂₃₄₅₆₇₈₉₊₋');
const SCRIPT_TEMPLATES: Record<string, Record<string, string>> = {
    '-sup': SUPERSCRIPT, 'superíndice': SUPERSCRIPT, '-sub': SUBSCRIPT, 'subíndice': SUBSCRIPT,
};

/** Digits and +/- as Unicode super/subscripts (`10<sup>18</sup>` → `10¹⁸`); null for any other content. */
const toScript = (content: string, map: Record<string, string>): string | null => {
    const trimmed = content.trim().replace(/−/g, '-');
    return /^[0-9+-]*$/.test(trimmed) ? Array.from(trimmed, (char) => map[char]).join('') : null;
};

type Template = { name: string; args: string[]; named: Set<string> };

/** A named template arg (`key=v`, `núm=1`, `contracción=sí`); Unicode-aware so accented keys are dropped too. */
const NAMED_ARG_RE = /^\s*([\p{L}\d_-]+)\s*=\s*\S/u;
const NAMED_KEY_RE = /^\s*[\p{L}\d_-]+\s*=/u;

/** `name|a|b|key=v` → lowercase name, positional args and the keys of the non-empty named args. */
const parseTemplate = (body: string): Template => {
    const [name, ...rest] = body.split('|');
    const named = new Set(rest.flatMap((arg) => NAMED_ARG_RE.exec(arg)?.[1] ?? []));
    return { name: name.trim().toLowerCase(), args: rest.filter((arg) => !NAMED_KEY_RE.test(arg)).map((arg) => arg.trim()), named };
};

type Resolution = string | { drop: DropReason; template?: string };

/** `atSentenceStart`: nothing but space before the template, a sentence end or a colon (RAE: "Dicho de algo: Que…"). */
const resolveTemplate = ({ name, args, named }: Template, atSentenceStart: boolean): Resolution => {
    const [first = '', second = ''] = args;
    if (isFormOf(name)) return { drop: 'form-of' };
    if (STRIPPED.has(name) || REFERENCE_PREFIX_RE.test(name)) return '';
    if (SCRIPT_TEMPLATES[name]) return toScript(first, SCRIPT_TEMPLATES[name]) ?? { drop: 'unresolved-template', template: name };
    switch (name) {
        case 'plm':
        case 'ucf':
            // The template capitalises its argument, which reads wrong mid-sentence ("de Apuesto").
            return atSentenceStart ? upperFirst(second || first) : second || first;
        case 'l':
        case 'l+':
            return args[2] || second;
        case 'impropia':
            return first;
        case 'sustantivo de verbo':
            return `Acción o efecto de ${first}${second ? ` o ${second}` : ''}`;
        case 'sustantivo de adjetivo':
            return `Cualidad o condición de ${first}${second ? ` o ${second}` : ''}`;
        case 'adjetivo de sustantivo':
            return second === 'al' ? `Que pertenece o concierne al ${first}` : `Que pertenece o concierne a ${first}`;
        case 'adjetivo de verbo':
            return `Que ${second || first}`;
        case 'adverbio de adjetivo':
            return `De modo ${first}`;
        case 'gentilicio':
            // Plantilla:gentilicio writes `del` when `contracción` is set (`{{gentilicio|contracción=sí|Tíbet}}`).
            return `Originario, relativo a, o propio ${named.has('contracción') ? 'del' : 'de'} ${first}`;
        default:
            return { drop: 'unresolved-template', template: name };
    }
};

const LINK_RE = /\[\[([^[\]|]*)(?:\|([^[\]]*))?\]\]([\p{Ll}\p{Lu}]*)/gu;
const EXTERNAL_LINK_RE = /\[(?:https?:)?\/\/[^\s\]]+\s*([^\]]*)\]/g;
const FILE_LINK_RE = /^\s*(archivo|categoría|file|imagen|image)\s*:/i;
const TEMPLATE_RE = /\{\{([^{}]*)\}\}/;
/**
 * Markup that must never reach the output: templates, wiki/external links, tags, comments, entities, and a leaked named
 * template arg (`núm=`: a lowercase word of 3+ letters right before `=`; formulas such as `n=3`, `H2C=O` stay).
 */
const MARKUP_RE = /\{\{|\}\}|\[\[|\]\]|\[https?:|<|>|&[#\w]+;|\||\p{Ll}{3,}=/u;
/** HTML entities left after the XML decode (`&amp;mdash;` in the wikitext). */
const HTML_ENTITIES: Record<string, string> = { nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', laquo: '«', raquo: '»', amp: '&', quot: '"' };

const resolveLinks = (text: string): string =>
    text
        .replace(LINK_RE, (_match, target: string, label: string | undefined, trail: string) => (FILE_LINK_RE.test(target) ? '' : `${label ?? target}${trail}`))
        .replace(EXTERNAL_LINK_RE, '$1');

/** Tags, refs and comments out; a ref or comment left open on the sense line cuts the text there. */
const stripTags = (text: string): string =>
    text
        .replace(/<ref[^>]*\/>/gi, '')
        .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/(<ref\b|<!--)[\s\S]*$/i, '')
        .replace(/<\/ref>|-->/gi, '')
        .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
        .replace(/&(\w+);/g, (match, name: string) => HTML_ENTITIES[name.toLowerCase()] ?? match);

/** A label value (`{{uso|…}}`, `{{ámbito|…}}`, `{{csem|…}}`) as plain text; null when markup would be left. */
const cleanLabel = (value: string): string | null => {
    const text = resolveLinks(stripTags(value)).replace(/'{2,}/g, '').replace(/\s+/g, ' ').trim();
    return text && !MARKUP_RE.test(text) && !/[[\]{}|]/.test(text) ? text : null;
};

/** Senses that only point to another form (`Contaminar (uso pronominal de...).`, `Forma pronominal de x.`). */
const POINTER_SENSE_RES = [/\(uso pronominal de\b[^)]*\)/i, /^(forma|uso) pronominal de \p{L}+\.?$/iu];

/** A word ending in a lowercase letter + a digit sub/superscript run (`pato₁`, `aforar₁₋₂`, `corte¹₄`). */
const SENSE_REF_RE = /(\p{L}*\p{Ll})([₀-₉⁰¹²³⁴-⁹][₀-₉₊₋⁰¹²³⁴-⁹⁺⁻]*)/gu;
/** Chemical symbols (`Fe³⁺`, `Na₂`) and units (`m²`, `cm³`, `s²`) keep their scripts. */
const KEEPS_SCRIPT_RE = /^(?:(?:[A-Z][a-z]?)+|[kcdmh]?m|s)$/;

/** Sense references to another page's numbered sense (`pelotudo₁`, `apuesto₃`, `atmósfera(1)`) out; formulas and units kept. */
const stripSenseRefs = (text: string): string =>
    text
        .replace(SENSE_REF_RE, (match, word: string) => (KEEPS_SCRIPT_RE.test(word) ? match : word))
        .replace(/(\p{Ll})\(\d{1,2}\)/gu, '$1');

/** A usage example written into the sense line ("De ojos azules. Por ejemplo: Después don Porfirio…"): cut from there. */
const EXAMPLE_TAIL_RE = /[,;:]?\s*\bPor ejemplo\b[\s\S]*$/u;

/** `..` at the end (not `...`) → `.`. */
const collapseFinalDots = (text: string): string => text.replace(/(?<!\.)\.\.$/, '.');

/** One sense body (wikitext after `;N…:`) → plain text ending in `.`, or why it is dropped. */
export const cleanSense = (wikitext: string): CleanResult => {
    // A formula (<math>TeX</math>) has no plain-text form.
    if (/<math\b/i.test(wikitext)) return { drop: 'unresolved-template', template: '(math)' };
    let unscriptable = false;
    const scripted = wikitext.replace(/<(sup|sub)>([^<]*)<\/\1>/gi, (match, tag: string, content: string) => {
        const converted = toScript(content, tag.toLowerCase() === 'sup' ? SUPERSCRIPT : SUBSCRIPT);
        if (converted === null) unscriptable = true;
        return converted ?? match;
    });
    if (unscriptable) return { drop: 'unresolved-template', template: '(sup/sub)' };
    let text = resolveLinks(stripTags(scripted).replace(/'{2,}/g, ''));
    for (let match = TEMPLATE_RE.exec(text); match; match = TEMPLATE_RE.exec(text)) {
        const resolved = resolveTemplate(parseTemplate(match[1]), /^\s*$|[.!?:]\s*$/.test(text.slice(0, match.index)));
        if (typeof resolved !== 'string') return resolved;
        text = text.slice(0, match.index) + resolved + text.slice(match.index + match[0].length);
    }
    // A link inside a template argument resolves only once the template is gone.
    text = resolveLinks(text);
    if (MARKUP_RE.test(text)) return { drop: 'unresolved-template', template: '(markup)' };

    text = upperFirst(stripSenseRefs(text).replace(EXAMPLE_TAIL_RE, '').replace(/\s+/g, ' ').replace(/\s+([.,;:])/g, '$1').trim());
    text = collapseFinalDots(text);
    if ((text.match(/\p{L}/gu)?.length ?? 0) < LETTER_COUNT_MIN) return { drop: 'too-short' };
    if (POINTER_SENSE_RES.some((re) => re.test(text))) return { drop: 'form-of' };
    return { text: /[.,;:!?]$/.test(text) ? text : `${text}.` };
};

// ---------------------------------------------------------------------------
// Page parsing
// ---------------------------------------------------------------------------

const OFFENSIVE_LABELS = ['vulgar', 'malsonante', 'obsceno', 'ofensivo', 'despectivo', 'peyorativo', 'insult'];
/** csem domains a family game leaves out, like the offensive usage labels. */
const OFFENSIVE_DOMAINS = new Set(['sexualidad', 'sexo']);
/** csem domain of wiki jargon (`bibliotecario` → "Administrador."), not general Spanish. */
const WIKI_DOMAIN = 'wiki';
/** csem domains written as acronyms rather than upperFirst. */
const CSEM_LABELS: Record<string, string> = { lgbt: 'LGBT' };
/**
 * `{{uso|…}}` codes and aliases (es.wiktionary Módulo:contexto/uso) in RAE-style wording. Disused labels become
 * `desusado` so audit D9 moves them last; `vulg`/`soez`/`grosero` map to labels the offensive guard drops.
 */
const USO_LABELS: Record<string, string> = {
    anticuado: 'desusado', desusado: 'desusado', obsoleto: 'desusado', desus: 'desusado', 'desus.': 'desusado', desuso: 'desusado',
    desusada: 'desusado', 'en desuso': 'desusado', antiguo: 'desusado', arcaico: 'desusado',
    eufemismo: 'eufemismo', eufemístico: 'eufemismo', eufemística: 'eufemismo',
    coloq: 'coloquial', 'coloq.': 'coloquial', rur: 'rural', raro: 'poco usado', rara: 'poco usado', slang: 'jergal', jerga: 'jergal',
    vulg: 'vulgar', soez: 'malsonante', grosero: 'malsonante', 'despect.': 'despectivo',
    utcs: 'Usado también como sustantivo', setc: 'Usado también como sustantivo', utcsmf: 'Usado también como sustantivo',
    utcsm: 'Usado también como sustantivo masculino', utcsf: 'Usado también como sustantivo femenino',
    utcsma: 'Usado también como sustantivo masculino o femenino', ucsp: 'Usado como sustantivo plural',
    utcp: 'Usado también como pronominal', utcprnl: 'Usado también como pronominal', utct: 'Usado también como transitivo',
    utci: 'Usado también como intransitivo', utca: 'Usado también como adjetivo', utcaf: 'Usado también como adjetivo femenino',
    utcam: 'Usado también como adjetivo masculino', utcadv: 'Usado también como adverbio', utcf: 'Usado también como femenino',
    utcm: 'Usado también como masculino', utcg: 'Usado también como gerundio', utcj: 'Usado también como interjección',
    utcinterj: 'Usado también como interjección', utcc: 'Usado también como conjunción', utcv: 'Usado también como vocativo',
    utctax: 'Usado también como taxón', utc3: 'Usado también como impersonal', utc36: 'Usado también como terciopersonal',
    sebtc: 'Usado antiguamente también como sustantivo', eutca: 'Usado antiguamente también como adjetivo',
    umcs: 'Usado más como sustantivo', umcp: 'Usado más como pronominal', umct: 'Usado más como transitivo',
    umci: 'Usado más como intransitivo', umcv: 'Usado más como vocativo', umc3: 'Usado más como impersonal',
    umc36: 'Usado más como terciopersonal', utmp: 'Usado más como verbo pronominal',
    umcf: 'Usado más en femenino', umef: 'Usado más en femenino', umcm: 'Usado más en masculino', umem: 'Usado más en masculino',
    umep: 'Usado más en plural', umpl: 'Usado más en plural', utep: 'Usado también en plural', utpl: 'Usado también en plural',
    sutp: 'Usado también en plural con el mismo significado', suts: 'Usado también en singular con el mismo significado',
    umsn: 'Usado más en sentido negativo', umen: 'Usado más en sentido negativo', umsf: 'Usado más en sentido figurado',
    utef: 'Usado también en sentido figurado', utsf: 'Usado también en sentido figurado', utsd: 'Usado también en sentido despectivo',
    umsd: 'Usado más en sentido despectivo', utea: 'Usado también en sentido afectuoso', umrep: 'Usado más repetido',
    utrep: 'Usado también repetido',
};
/** `{{ámbito|…}}` codes. */
const AMBITO_LABELS: Record<string, string> = { rpl: 'Río de la Plata', lunf: 'lunfardo' };
/** Short real-word labels kept as-is although they look like codes. */
const SHORT_USO_WORDS = new Set(['culto', 'rural', 'argot', 'cursi', 'vesre', 'coa', 'bajo']);
/** An unmapped usage code (`umsi`): 3–5 letters, or a usage-code prefix; dropped rather than shown raw. */
const USO_CODE_RE = /^(?:[a-z]{3,5}|(?:u[tmc]|s[eu]|eu)[a-z0-9]{2,8})$/;

/** A `{{uso|…}}` value in RAE-style wording; null for an unknown code. */
const usoLabel = (value: string): string | null => {
    const lower = value.toLowerCase();
    if (USO_LABELS[lower]) return USO_LABELS[lower];
    return USO_CODE_RE.test(lower) && !SHORT_USO_WORDS.has(lower) ? null : value;
};
const LEVEL2_RE = /^==(?!=)\s*(.*?)\s*==\s*$/;
const HEADER_RE = /^(={3,})\s*(.*?)\s*=+\s*$/;
const SENSE_RE = /^;\s*(\d+)\s*((?:\{\{[^{}]*\}\}\s*)*):\s*(.*)$/;
const LABEL_LINE_RE = /^\{\{(uso|ámbito)\|([^{}]*)\}\}/;
const HEADER_TEMPLATE_RE = /^\{\{([^{}|]+)((?:\|[^{}]*)?)\}\}$/;

type Labels = { csem: string[]; ambito: string[]; uso: string[] };
type RawSense = { pos: PosMapping; labels: Labels; body: string };

const addLabels = (labels: Labels, template: Template): void => {
    const values = template.args.flatMap((arg) => cleanLabel(arg) ?? []);
    if (template.name === 'csem') labels.csem.push(...values);
    else if (template.name === 'ámbito') labels.ambito.push(...values.map((value) => AMBITO_LABELS[value] ?? value));
    else if (template.name === 'uso') labels.uso.push(...values.flatMap((value) => usoLabel(value) ?? []));
};

/** Header line → the text mapPos reads (`{{sustantivo|es|propio|masculino}}` → `sustantivo propio masculino`), plus whether it was a template. */
const headerText = (content: string): { text: string; isTemplate: boolean } => {
    const match = HEADER_TEMPLATE_RE.exec(content);
    if (!match) return { text: content, isTemplate: false };
    const { args } = parseTemplate(`x${match[2]}`);
    return { text: [match[1], ...args.slice(1)].join(' '), isTemplate: true };
};

const typeExtraOf = ({ csem, ambito, uso }: Labels, posExtra: string | undefined): string | undefined => {
    const parts = [
        ...csem.map((value) => CSEM_LABELS[value.toLowerCase()] ?? upperFirst(value)),
        ...ambito,
        ...uso,
        ...(posExtra ? [posExtra] : []),
    ];
    return parts.length > 0 ? [...new Set(parts)].join(', ') : undefined;
};

/** The raw senses of the `{{lengua|es}}` section, in page order; `sawPos` = a lemma POS section was found. */
const collectSenses = (wikitext: string, tally?: ParseTally): { senses: RawSense[]; sawPos: boolean } => {
    const senses: RawSense[] = [];
    let inEs = false;
    let pos: PosMapping | null = null;
    let sawPos = false;
    let current: RawSense | null = null;

    for (const line of wikitext.split('\n')) {
        const level2 = LEVEL2_RE.exec(line);
        if (level2) {
            inEs = /^\{\{lengua\|es\}\}$/.test(level2[1].replace(/\s+/g, ''));
            pos = null;
            current = null;
            continue;
        }
        if (!inEs) continue;
        const header = HEADER_RE.exec(line.replace(/<!--[\s\S]*?-->/g, '').trim());
        if (header) {
            current = null;
            const { text, isTemplate } = headerText(header[2]);
            pos = mapPos(text);
            if (pos) sawPos = true;
            else if (isTemplate && tally && !text.toLowerCase().startsWith('forma')) {
                tally.unmappedPos.set(text, (tally.unmappedPos.get(text) ?? 0) + 1);
            }
            continue;
        }
        if (!pos) continue;
        const sense = SENSE_RE.exec(line);
        if (sense) {
            const labels: Labels = { csem: [], ambito: [], uso: [] };
            for (const match of sense[2].matchAll(/\{\{([^{}]*)\}\}/g)) addLabels(labels, parseTemplate(match[1]));
            current = { pos, labels, body: sense[3] };
            senses.push(current);
            continue;
        }
        const label = current && LABEL_LINE_RE.exec(line.trim());
        if (current && label) addLabels(current.labels, parseTemplate(`${label[1]}|${label[2]}`));
    }
    return { senses, sawPos };
};

const countDrop = (tally: ParseTally | undefined, reason: DropReason, template?: string): void => {
    if (!tally) return;
    tally.senseDrops[reason]++;
    if (template) tally.unresolvedTemplates.set(template, (tally.unresolvedTemplates.get(template) ?? 0) + 1);
};

/** A gloss compared case- and final-punctuation-insensitively (`Homosexual.` = `homosexual`). */
const glossKey = (text: string): string => text.toLowerCase().replace(/[.,;:!?\s]+$/, '');

type BuiltSense = { sense: Sense | null; formOf: boolean; offensiveGloss?: string };

/** One raw sense → a sense (number set later), or null when dropped; an offensive sense keeps its gloss for parsePage. */
const buildSense = ({ pos, labels, body }: RawSense, tally?: ParseTally): BuiltSense => {
    const dropped = (reason: DropReason, template?: string) => {
        countDrop(tally, reason, template);
        return { sense: null, formOf: reason === 'form-of' };
    };
    const isOffensive =
        labels.uso.some((value) => OFFENSIVE_LABELS.some((label) => value.toLowerCase().includes(label))) ||
        labels.csem.some((value) => OFFENSIVE_DOMAINS.has(value.toLowerCase()));
    if (isOffensive) {
        const cleaned = cleanSense(body);
        return { ...dropped('offensive'), ...('text' in cleaned && { offensiveGloss: glossKey(cleaned.text) }) };
    }
    if (labels.csem.some((value) => value.toLowerCase() === WIKI_DOMAIN)) return dropped('wiki');
    const cleaned = cleanSense(body);
    if ('drop' in cleaned) return dropped(cleaned.drop, cleaned.template);
    const verdict = classifySense({ type: pos.type, definition: cleaned.text }, 'es');
    if (verdict.delete) return dropped('audit');
    const typeExtra = typeExtraOf(labels, pos.typeExtra);
    // The D5 repair can turn a trailing `.:` into `..`.
    const definition = collapseFinalDots(verdict.text ?? cleaned.text);
    const sense: Sense = { number: '', type: pos.type, ...(typeExtra !== undefined && { type_extra: typeExtra }), definition };
    return { sense, formOf: false };
};

/** Title rule + `{{lengua|es}}` section + POS sections + senses + labels + Phase 1 sense checks, numbered "1".."n"; null = nothing usable. */
export const parsePage = (title: string, wikitext: string, tally?: ParseTally): Entry | null => {
    if (!TITLE_RE.test(title)) return null;
    const { senses: raw, sawPos } = collectSenses(wikitext, tally);
    const built = raw.map((sense) => buildSense(sense, tally));
    const kept = dedupeSenses(built.flatMap(({ sense }) => (sense ? [sense] : [])));

    // A gloss labelled offensive in one sense is offensive in its unlabelled repeat too (2 despectivo "Homosexual.",
    // 3 "Homosexual."): the whole entry goes.
    const offensiveGlosses = new Set(built.flatMap(({ offensiveGloss }) => (offensiveGloss ? [offensiveGloss] : [])));
    if (kept.some((sense) => offensiveGlosses.has(glossKey(sense.definition)))) {
        if (tally) tally.pageSkips['offensive-gloss']++;
        return null;
    }

    if (kept.length === 0) {
        const skip: PageSkip = !sawPos ? 'not-lemma' : built.length > 0 && built.every(({ formOf }) => formOf) ? 'form-of-only' : 'no-usable-sense';
        if (tally) tally.pageSkips[skip]++;
        return null;
    }

    const definitions = kept.map((sense, index): Sense => {
        const verdict = normalizeType(sense.type, sense.type_extra, 'es');
        const typed = verdict.finding?.action === 'FIX' ? { type: verdict.type, typeExtra: verdict.typeExtra } : { type: sense.type, typeExtra: sense.type_extra };
        return {
            number: String(index + 1),
            type: typed.type,
            ...(typed.typeExtra !== undefined && { type_extra: typed.typeExtra }),
            definition: sense.definition,
        };
    });
    return { definitions };
};

// ---------------------------------------------------------------------------
// Dump reading
// ---------------------------------------------------------------------------

export class BzcatError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BzcatError';
    }
}

const tagValue = (line: string, tag: string): string | null => {
    const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(line);
    return match ? decodeEntities(match[1]) : null;
};

/** Line state machine over the XML: title, ns, timestamp, <redirect/>, <text …>…</text> | <text … />; entities decoded. */
export async function* readPages(input: NodeJS.ReadableStream): AsyncGenerator<WikiPage> {
    const lines = readline.createInterface({ input, crlfDelay: Infinity });
    let page: WikiPage | null = null;
    let textLines: string[] | null = null;

    for await (const line of lines) {
        if (textLines && page) {
            const end = line.indexOf('</text>');
            if (end === -1) {
                textLines.push(line);
                continue;
            }
            textLines.push(line.slice(0, end));
            page.text = decodeEntities(textLines.join('\n'));
            textLines = null;
            continue;
        }
        const trimmed = line.trim();
        if (trimmed === '<page>') {
            page = { title: '', ns: '', text: '', redirect: false };
            continue;
        }
        if (!page) continue;
        if (trimmed === '</page>') {
            yield page;
            page = null;
            continue;
        }
        if (trimmed.startsWith('<title>')) page.title = tagValue(trimmed, 'title') ?? '';
        else if (trimmed.startsWith('<ns>')) page.ns = tagValue(trimmed, 'ns') ?? '';
        else if (trimmed.startsWith('<timestamp>')) page.timestamp ??= tagValue(trimmed, 'timestamp') ?? undefined;
        else if (trimmed.startsWith('<redirect')) page.redirect = true;
        else if (trimmed.startsWith('<text')) {
            if (/^<text[^>]*\/>/.test(trimmed)) continue;
            const body = line.slice(line.indexOf('>', line.indexOf('<text')) + 1);
            const end = body.indexOf('</text>');
            if (end === -1) textLines = [body];
            else page.text = decodeEntities(body.slice(0, end));
        }
    }
}

/** `.bz2` → spawn('bzcat', [path]) stdout; else createReadStream. `done` rejects with BzcatError on ENOENT / non-zero exit. */
export const openDump = (dumpPath: string): { stream: NodeJS.ReadableStream; done: Promise<void> } => {
    if (!dumpPath.endsWith('.bz2')) {
        const stream = createReadStream(dumpPath);
        const done = new Promise<void>((resolve, reject) => {
            stream.on('close', resolve);
            stream.on('error', reject);
        });
        done.catch(() => undefined);
        return { stream, done };
    }
    const child = spawn('bzcat', [dumpPath], { stdio: ['ignore', 'pipe', 'inherit'] });
    const done = new Promise<void>((resolve, reject) => {
        child.on('error', (error: NodeJS.ErrnoException) =>
            reject(new BzcatError(error.code === 'ENOENT' ? 'bzcat not found; install bzip2 or pass an uncompressed .xml' : `bzcat failed: ${error.message}`)),
        );
        child.on('close', (code) => (code === 0 ? resolve() : reject(new BzcatError(`bzcat exited with ${code}`))));
    });
    // Awaited after the stream is read; this only keeps an early rejection from being reported as unhandled.
    done.catch(() => undefined);
    return { stream: child.stdout, done };
};

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

const isWiktionary = (entry: Entry): boolean => entry.source === 'wiktionary';

const sortWords = (words: Iterable<string>, collator: Intl.Collator): string[] =>
    [...words].sort((a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0));

/** One file of a letter: interleave its new keys (collator merge), replace its imported wiktionary keys in place, drop the others; RAE keys untouched. */
const mergePart = (existing: DefinitionFile, imported: ReadonlyMap<string, Entry>, collator: Intl.Collator): DefinitionFile => {
    const added = sortWords([...imported.keys()].filter((word) => !Object.hasOwn(existing, word)), collator);
    const file: DefinitionFile = {};
    let next = 0;
    for (const [word, entry] of Object.entries(existing)) {
        while (next < added.length && collator.compare(added[next], word) < 0) {
            file[added[next]] = imported.get(added[next])!;
            next++;
        }
        if (!isWiktionary(entry)) file[word] = entry;
        else if (imported.has(word)) file[word] = imported.get(word)!;
    }
    for (; next < added.length; next++) file[added[next]] = imported.get(added[next])!;
    return file;
};

/**
 * Merges one letter per file (main / advanced, isAdvancedOnly), so new keys keep collator order within each file;
 * a wiktionary key whose level changes file moves. Stale wiktionary keys in scope are dropped; RAE keys untouched.
 */
export const mergeLetter = (
    existing: DefinitionFile,
    imported: ReadonlyMap<string, Entry>,
    collator: Intl.Collator,
): { file: DefinitionFile; added: string[]; refreshed: number; removed: number } => {
    const { main, advanced } = splitDefinitionFile(existing);
    const routed = (advancedOnly: boolean) => new Map([...imported].filter(([, entry]) => isAdvancedOnly(entry) === advancedOnly));
    const file = { ...mergePart(main, routed(false), collator), ...mergePart(advanced, routed(true), collator) };
    const wiktionaryKeys = Object.keys(existing).filter((word) => isWiktionary(existing[word]));
    const refreshed = wiktionaryKeys.filter((word) => imported.has(word)).length;
    return {
        file,
        added: sortWords([...imported.keys()].filter((word) => !Object.hasOwn(existing, word)), collator),
        refreshed,
        removed: wiktionaryKeys.length - refreshed,
    };
};

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export type ImportOptions = { root: string; dump: string; letter?: string; dryRun: boolean };

type LetterReport = { before: number; after: number; added: string[]; refreshed: number; removed: number; sample: string[] };

export type ImportReport = {
    dump: string;
    dumpDate: string | null;
    dryRun: boolean;
    pagesRead: number;
    letters: Record<string, LetterReport>;
    skips: Record<string, number>;
    wordRules: Partial<Record<CategoryId, number>>;
    listAdditions: Record<Level, number>;
    /** New words ranked in a lower band: imported (advanced) but put in no list. */
    unlisted: string[];
    tally: ParseTally;
    seconds: number;
};

const newTally = (): ParseTally => ({
    pageSkips: { 'not-lemma': 0, 'form-of-only': 0, 'no-usable-sense': 0, 'offensive-gloss': 0 },
    senseDrops: { 'form-of': 0, offensive: 0, wiki: 0, 'unresolved-template': 0, 'too-short': 0, audit: 0 },
    unresolvedTemplates: new Map(),
    unmappedPos: new Map(),
});

/** Evenly spaced sample over the sorted words: `word (type): sense 1`. */
const sampleOf = (words: string[], file: DefinitionFile): string[] => {
    const count = Math.min(SAMPLE_SIZE, words.length);
    return Array.from({ length: count }, (_, i) => {
        const word = words[Math.floor((i * words.length) / count)];
        const sense = file[word].definitions[0];
        return `${word} (${sense.type}): ${sense.definition}`;
    });
};

export const runImport = async ({ root, dump, letter, dryRun }: ImportOptions): Promise<ImportReport> => {
    const started = Date.now();
    const input = await loadLocaleInput(root, 'es');
    const ranks = await loadFrequencyRanks(root, 'es');
    const collator = new Intl.Collator('es-ES', { sensitivity: 'base' });
    const ctx = { locale: 'es' as const, wordSets: input.wordSets };

    const raeKeys = new Set<string>();
    for (const file of Object.values(input.definitions)) {
        for (const [word, entry] of Object.entries(file)) if (!isWiktionary(entry)) raeKeys.add(word);
    }
    const listed = new Set(LEVELS.flatMap((level) => input.lists[level]));

    const tally = newTally();
    const skips: Record<string, number> = { 'already RAE': 0 };
    const wordRules: ImportReport['wordRules'] = {};
    const imported = new Map<string, Entry>();
    let dumpDate: string | null = null;
    let pagesRead = 0;

    const { stream, done } = openDump(dump);
    for await (const page of readPages(stream)) {
        pagesRead++;
        if (page.timestamp && (!dumpDate || page.timestamp > dumpDate)) dumpDate = page.timestamp;
        if (page.ns !== '0' || page.redirect || !page.text || !TITLE_RE.test(page.title)) continue;
        if (letter && definitionLetter(page.title) !== letter) continue;
        if (raeKeys.has(page.title)) {
            skips['already RAE']++;
            continue;
        }
        const entry = parsePage(page.title, page.text, tally);
        if (!entry) continue;
        const verdict = classifyWord(page.title, entry, ctx);
        if (verdict) {
            wordRules[verdict.category] = (wordRules[verdict.category] ?? 0) + 1;
            continue;
        }
        imported.set(page.title, entry);
    }
    await done;

    // A new word in no list goes to the advanced list only (keeps audit W14): nobody reviewed it for the lower levels.
    // words:build serves a ranked word at its frequency band whatever its list, so a new word ranked in a lower band
    // (`facebook`, `lol`) goes to no list (audit W14 flags it) until someone reviews it.
    const lists = Object.fromEntries(LEVELS.map((level) => [level, [...input.lists[level]]])) as Record<Level, string[]>;
    const listAdditions = Object.fromEntries(LEVELS.map((level) => [level, 0])) as Record<Level, number>;
    const unlisted: string[] = [];
    for (const word of sortWords([...imported.keys()].filter((w) => !listed.has(w)), collator)) {
        if (computeLevel(ranks.get(word) ?? null, [], 'es') !== IMPORT_LEVEL) {
            unlisted.push(word);
            continue;
        }
        lists[IMPORT_LEVEL].push(word);
        listAdditions[IMPORT_LEVEL]++;
    }

    // Every imported entry is advanced, whatever its frequency: a rare homograph of a common form (`partes`, `odia`)
    // must not reach the lower-level definition games unreviewed. It also picks the file split.
    const byLetter = new Map<string, Map<string, Entry>>();
    for (const [word, entry] of imported) {
        const key = definitionLetter(word);
        if (!byLetter.has(key)) byLetter.set(key, new Map());
        byLetter.get(key)!.set(word, { level: IMPORT_LEVEL, source: 'wiktionary', definitions: entry.definitions });
    }

    // Lists first: a run that fails midway then leaves listed words without
    // definitions (harmless, audit flags them) rather than definitions in no list.
    if (!dryRun) {
        for (const level of LEVELS) {
            if (listAdditions[level] > 0) await writeFile(listPath(root, 'es', level), lists[level].join('\n') + '\n', 'utf-8');
        }
    }

    const letters: Record<string, LetterReport> = {};
    for (const key of letter ? [letter] : DEFINITION_LETTERS) {
        const existing = input.definitions[key];
        const { file, added, refreshed, removed } = mergeLetter(existing, byLetter.get(key) ?? new Map(), collator);
        letters[key] = { before: Object.keys(existing).length, after: Object.keys(file).length, added, refreshed, removed, sample: sampleOf(added, file) };
        if (!dryRun) await writeLetterDefinitions(root, 'es', key, file);
    }

    return { dump, dumpDate, dryRun, pagesRead, letters, skips, wordRules, listAdditions, unlisted, tally, seconds: Math.round((Date.now() - started) / 1000) };
};

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const topEntries = (counts: Map<string, number>, limit: number): [string, number][] =>
    [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, limit);

const summaryLines = (report: ImportReport): string[] => {
    const letters = Object.entries(report.letters);
    const total = (pick: (l: LetterReport) => number) => letters.reduce((sum, [, l]) => sum + pick(l), 0);
    const { pageSkips, senseDrops } = report.tally;
    return [
        `Dump: ${report.dump} (latest revision ${report.dumpDate ?? 'unknown'})${report.dryRun ? ' — DRY RUN, no data written' : ''}`,
        `Pages read: ${report.pagesRead}  Runtime: ${report.seconds}s`,
        `Keys: ${total((l) => l.before)} → ${total((l) => l.after)}  added ${total((l) => l.added.length)}, refreshed ${total((l) => l.refreshed)}, removed ${total((l) => l.removed)}`,
        `Skips: already RAE ${report.skips['already RAE']}, not lemma / unmapped POS ${pageSkips['not-lemma']}, form-of only ${pageSkips['form-of-only']}, ` +
            `no usable sense ${pageSkips['no-usable-sense']}, offensive gloss repeated unlabelled ${pageSkips['offensive-gloss']}, word rule ${Object.entries(report.wordRules).map(([id, n]) => `${id} ${n}`).join(' ') || '0'}`,
        `Sense drops: ${Object.entries(senseDrops).map(([reason, n]) => `${reason} ${n}`).join(', ')}`,
        `List additions: ${LEVELS.map((level) => `${level} ${report.listAdditions[level]}`).join(', ')}`,
        `Not listed (new, ranked in a lower band): ${report.unlisted.length}${report.unlisted.length > 0 ? ` (${report.unlisted.join(', ')})` : ''}`,
    ];
};

const renderImportReport = (report: ImportReport): string => {
    const lines = ['# es.wiktionary import report', '', ...summaryLines(report).map((line) => `- ${line}`), '', '## Per letter', ''];
    lines.push('| letter | before | after | added | refreshed | removed |', '|---|---|---|---|---|---|');
    for (const [key, l] of Object.entries(report.letters)) lines.push(`| ${key} | ${l.before} | ${l.after} | ${l.added.length} | ${l.refreshed} | ${l.removed} |`);
    lines.push('', '## Top unresolved templates', '');
    for (const [name, count] of topEntries(report.tally.unresolvedTemplates, TOP_TEMPLATES)) lines.push(`- \`${name}\` ${count}`);
    lines.push('', '## Top unmapped POS headers', '');
    for (const [name, count] of topEntries(report.tally.unmappedPos, TOP_TEMPLATES)) lines.push(`- \`${name}\` ${count}`);
    lines.push('', '## Samples', '');
    for (const [key, l] of Object.entries(report.letters)) {
        if (l.sample.length === 0) continue;
        lines.push(`### ${key}`, '', ...l.sample.map((line) => `- ${line}`), '');
    }
    return lines.join('\n') + '\n';
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = 'Usage: yarn words:import-wiktionary [--dump <path>] [--letter <l>] [--dry-run] [--root <dir>]';

type CliOptions = { dump?: string; letter?: string; root?: string; dryRun: boolean };

const parseArgs = (argv: string[]): CliOptions | null => {
    const options: CliOptions = { dryRun: false };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--dry-run') {
            options.dryRun = true;
            continue;
        }
        const key = ({ '--dump': 'dump', '--letter': 'letter', '--root': 'root' } as const)[argv[i]];
        const value = argv[i + 1];
        if (!key || value === undefined || value.startsWith('--')) return null;
        options[key] = value;
        i++;
    }
    return options;
};

const isFsError = (error: unknown): boolean => error instanceof Error && typeof (error as NodeJS.ErrnoException).code === 'string';

/** 0 ok, 1 I/O / bzcat / MissingDataFileError, 2 bad args or missing dump (prints the curl command). */
export const runCli = async (argv: string[], cwd: string): Promise<0 | 1 | 2> => {
    const options = parseArgs(argv);
    if (!options || (options.letter !== undefined && !DEFINITION_LETTERS.includes(options.letter))) {
        console.error(USAGE);
        return 2;
    }
    const root = path.resolve(cwd, options.root ?? '.');
    const dump = path.resolve(cwd, options.dump ?? path.join(root, DEFAULT_DUMP));
    if (!existsSync(dump)) {
        console.error(`Missing dump: ${dump}\nDownload it with:\n  curl -L -o ${DEFAULT_DUMP} \\\n    ${DUMP_URL}`);
        return 2;
    }

    try {
        const report = await runImport({ root, dump, letter: options.letter, dryRun: options.dryRun });
        const reportPath = path.join(root, REPORT_PATH);
        await mkdir(path.dirname(reportPath), { recursive: true });
        await writeFile(reportPath, renderImportReport(report), 'utf-8');
        summaryLines(report).forEach((line) => console.log(line));
        console.log(`Report: ${reportPath}`);
        if (!options.dryRun) console.log('Next: yarn words:audit --locale es --fix, then yarn words:build.');
        return 0;
    } catch (error) {
        if (error instanceof BzcatError || error instanceof MissingDataFileError || error instanceof SyntaxError || isFsError(error)) {
            console.error((error as Error).message);
            return 1;
        }
        throw error;
    }
};

if (require.main === module) {
    runCli(process.argv.slice(2), process.cwd())
        .then((code) => process.exit(code))
        .catch((error) => {
            console.error(error instanceof Error ? error.message : error);
            process.exit(1);
        });
}
