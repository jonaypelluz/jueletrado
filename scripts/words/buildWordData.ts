/**
 * Builds the served word data (v2 chunks) from the curated sources:
 *   ops/scripts/words/<locale>/<level>_words.txt   (pool membership of unranked words)
 *   ops/scripts/frequency/wordfreq_<locale>.txt     (rank = 1-based line index, first occurrence wins)
 *   public/definitions/<locale>/<letter>_definitions.json (pos, sense count, source)
 *
 * Writes public/words/<locale>/<level>_<n>.json ({ version: 2, locale, level, fields, rows },
 * ≤ 100k rows each, collator order; a word in several levels has the same row in each level file),
 * deletes every other .json in that folder and updates config/LevelConfig.ts (totalChunks +
 * minimumPopulatedCount). Deterministic: a rerun on unchanged inputs changes no byte.
 *
 * Usage:
 *   yarn words:build [--locale es|en] [--root <dir>]
 *
 * Exit code: 0 ok, 1 missing or invalid input file, 2 bad args.
 */

import { existsSync } from 'fs';
import { createHash } from 'crypto';
import { mkdir, readFile, readdir, unlink, writeFile } from 'fs/promises';
import * as path from 'path';
import { Level, WordChunk, WordRecord } from '../../models/types';
import { syllabify } from '../../utils/SyllableSplitter';
import { WORD_CHUNK_FIELDS, WORD_CHUNK_ROWS, WORD_CHUNK_VERSION, WORD_FLAGS, deriveWordRecord, encodeRow } from '../../utils/WordRecord';
import { LEVELS, LOCALES, Locale, MissingDataFileError, Sense, loadLocaleInput } from './wordAudit';

const CHUNK_SIZE = WORD_CHUNK_ROWS;
const USAGE = 'Usage: yarn words:build [--locale es|en] [--root <dir>]';

const COLLATORS: Record<Locale, Intl.Collator> = {
    es: new Intl.Collator('es-ES', { sensitivity: 'base' }),
    en: new Intl.Collator('en-GB', { sensitivity: 'base' }),
};

export type BuildReport = {
    locale: string;
    perLevel: Record<string, { words: number; chunks: number }>;
    overrides: { word: string; lists: Level[]; level: Level }[];
    flagCounts: Record<string, number>;
    orphanDefinitions: string[];
    syllabifyFailures: string[];
};

const frequencyPath = (root: string, locale: Locale): string => path.join(root, 'ops/scripts/frequency', `wordfreq_${locale}.txt`);

/** word → 1-based rank (line index); the first occurrence of a word wins. */
const loadFrequencyRanks = async (root: string, locale: Locale): Promise<Map<string, number>> => {
    const filePath = frequencyPath(root, locale);
    if (!existsSync(filePath)) throw new MissingDataFileError(filePath);
    const ranks = new Map<string, number>();
    (await readFile(filePath, 'utf-8'))
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((word, i) => {
            if (!ranks.has(word)) ranks.set(word, i + 1);
        });
    return ranks;
};

/** True when syllabify loses characters or the word has no vowel nucleus. */
const syllabifyFails = (word: string): boolean => syllabify(word).join('') !== word || !/[aeiouáéíóúü]/.test(word);

/** Rewrites one level's totalChunks / minimumPopulatedCount for a locale in LevelConfig.ts. */
const updateLevelConfig = (config: string, locale: string, level: string, words: number, chunks: number): string =>
    config
        .replace(new RegExp(`(level: '${level}'[\\s\\S]*?totalChunks: \\{[^}]*?${locale}: )\\d+`), `$1${chunks}`)
        .replace(new RegExp(`(level: '${level}'[\\s\\S]*?minimumPopulatedCount: \\{[^}]*?${locale}: )\\d+`), `$1${words}`);

export const buildLocale = async (root: string, locale: Locale): Promise<BuildReport> => {
    const input = await loadLocaleInput(root, locale);
    const ranks = await loadFrequencyRanks(root, locale);
    const collator = COLLATORS[locale];

    const senses = new Map<string, Sense[]>();
    for (const file of Object.values(input.definitions)) {
        for (const [word, entry] of Object.entries(file)) senses.set(word, entry.definitions);
    }

    const listsOf = new Map<string, Level[]>();
    for (const level of LEVELS) {
        for (const word of input.lists[level]) {
            const lists = listsOf.get(word) ?? [];
            if (!lists.includes(level)) lists.push(level);
            listsOf.set(word, lists);
        }
    }
    const wordSet = new Set(listsOf.keys());

    const records = new Map<string, WordRecord>();
    const overrides: BuildReport['overrides'] = [];
    for (const [word, lists] of listsOf) {
        const record = deriveWordRecord({ word, locale, freqRank: ranks.get(word) ?? null, lists, senses: senses.get(word), wordSet });
        records.set(word, record);
        if (record.freqRank !== null && (lists.length !== 1 || lists[0] !== record.level)) overrides.push({ word, lists, level: record.level });
    }

    const dir = path.join(root, 'public/words', locale);
    await mkdir(dir, { recursive: true });
    const written = new Set<string>();
    const perLevel: BuildReport['perLevel'] = {};
    const configPath = path.join(root, 'config/LevelConfig.ts');
    let config = await readFile(configPath, 'utf-8');

    for (const level of LEVELS) {
        // Source-list order first, then words served here by rank only; the stable collator sort keeps
        // ties in that order, as the legacy transform did.
        const fromList = [...new Set(input.lists[level])].filter((word) => records.get(word)!.levels.includes(level));
        const listed = new Set(fromList);
        const byRank = [...records.values()].filter((r) => r.levels.includes(level) && !listed.has(r.word)).map((r) => r.word);
        const words = [...fromList, ...byRank].sort(collator.compare);

        const chunks = Math.ceil(words.length / CHUNK_SIZE);
        for (let n = 1; n <= chunks; n++) {
            const chunk: WordChunk = {
                version: WORD_CHUNK_VERSION,
                locale,
                level,
                fields: [...WORD_CHUNK_FIELDS],
                rows: words.slice((n - 1) * CHUNK_SIZE, n * CHUNK_SIZE).map((word) => encodeRow(records.get(word)!)),
            };
            const name = `${level}_${n}.json`;
            await writeFile(path.join(dir, name), JSON.stringify(chunk), 'utf-8');
            written.add(name);
        }
        perLevel[level] = { words: words.length, chunks };
        config = updateLevelConfig(config, locale, level, words.length, chunks);
    }

    for (const name of await readdir(dir)) {
        if (name.endsWith('.json') && !written.has(name)) await unlink(path.join(dir, name));
    }
    await writeFile(configPath, config, 'utf-8');

    const allRecords = [...records.values()];
    return {
        locale,
        perLevel,
        overrides,
        flagCounts: Object.fromEntries(WORD_FLAGS.map((name) => [name, allRecords.filter((r) => r[name] === 1).length])),
        orphanDefinitions: [...senses.keys()].filter((word) => !records.has(word)).sort(collator.compare),
        syllabifyFailures: locale === 'es' ? allRecords.filter((r) => syllabifyFails(r.word)).map((r) => r.word) : [],
    };
};

/**
 * Hash of every served chunk (public/words/<locale>/*.json, by path then content), the stamp the client
 * compares to decide whether its stored word data is stale. Deterministic: same files, same stamp.
 */
export const wordsDataVersion = async (root: string): Promise<string> => {
    const hash = createHash('sha256');
    const base = path.join(root, 'public/words');
    for (const locale of (await readdir(base)).sort()) {
        const dir = path.join(base, locale);
        let names: string[];
        try {
            names = (await readdir(dir)).filter((name) => name.endsWith('.json')).sort();
        } catch {
            continue; // not a locale folder
        }
        for (const name of names) hash.update(`${locale}/${name}\n`).update(await readFile(path.join(dir, name)));
    }
    return hash.digest('hex').slice(0, 16);
};

/** Writes config/WordsDataVersion.ts with the stamp of the chunks on disk. */
export const writeWordsDataVersion = async (root: string): Promise<string> => {
    const version = await wordsDataVersion(root);
    const body =
        '// Generated by `yarn words:build` (scripts/words/buildWordData.ts): the hash of the served word chunks.\n' +
        '// A browser whose stored word data has another stamp drops it and loads the levels again.\n' +
        `export const WORDS_DATA_VERSION = '${version}';\n`;
    await writeFile(path.join(root, 'config/WordsDataVersion.ts'), body, 'utf-8');
    return version;
};

const printReport = (report: BuildReport): void => {
    console.log(`\n${report.locale}:`);
    for (const [level, { words, chunks }] of Object.entries(report.perLevel)) console.log(`  ${level}: ${words} words in ${chunks} chunk(s)`);
    console.log(`  flags: ${Object.entries(report.flagCounts).map(([name, count]) => `${name} ${count}`).join(', ')}`);
    console.log(`  overrides (ranked word whose list disagrees with its band): ${report.overrides.length}`);
    for (const { word, lists, level } of report.overrides) console.log(`    ${word}: lists ${lists.join('+')} → ${level}`);
    console.log(`  definition keys in no list (not served): ${report.orphanDefinitions.length}${report.orphanDefinitions.length ? ` (${report.orphanDefinitions.join(', ')})` : ''}`);
    console.log(`  syllabify failures: ${report.syllabifyFailures.length}${report.syllabifyFailures.length ? ` (${report.syllabifyFailures.slice(0, 20).join(', ')})` : ''}`);
};

const parseArgs = (argv: string[]): { locales: readonly Locale[]; root: string } | null => {
    let locales: readonly Locale[] = LOCALES;
    let root = process.cwd();
    for (let i = 0; i < argv.length; i += 2) {
        const value = argv[i + 1];
        if (value === undefined) return null;
        if (argv[i] === '--locale' && (LOCALES as readonly string[]).includes(value)) locales = [value as Locale];
        else if (argv[i] === '--root') root = path.resolve(value);
        else return null;
    }
    return { locales, root };
};

const isFsError = (error: unknown): boolean => error instanceof Error && typeof (error as NodeJS.ErrnoException).code === 'string';

export async function runCli(argv: string[]): Promise<number> {
    const options = parseArgs(argv);
    if (!options) {
        console.error(USAGE);
        return 2;
    }
    try {
        for (const locale of options.locales) printReport(await buildLocale(options.root, locale));
        console.log(`\nword data version: ${await writeWordsDataVersion(options.root)}`);
        return 0;
    } catch (error) {
        if (error instanceof MissingDataFileError || error instanceof SyntaxError || isFsError(error)) {
            console.error((error as Error).message);
            return 1;
        }
        throw error;
    }
}

if (require.main === module) {
    runCli(process.argv.slice(2))
        .then((code) => process.exit(code))
        .catch((error) => {
            console.error(error instanceof Error ? error.message : error);
            process.exit(1);
        });
}
