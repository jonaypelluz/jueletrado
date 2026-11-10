/**
 * Counts, per locale × level × game, how many words each game can draw from
 * the served data (public/words v2 chunks + public/definitions), next to the
 * game's minimum. Run before and after a words:audit --fix or words:build to
 * prove no pool that met its minimum falls below it, and with --strict that no
 * pool changed at all.
 *
 * Each pool is built from the hydrated WordRecords through matchesQuery with the
 * games' own exported query objects and filters (no copies). The spellingBee
 * count is an upper bound: the game picks one random eligible sense per word,
 * and only words whose eligible senses include a usable clue are counted.
 *
 * Usage:
 *   yarn words:level-counts [--out <json>] [--baseline <json>] [--strict]
 *
 * Output: flat JSON map "<locale>/<level>/<game>[/<part>]": { count, min | null, hash }
 * (default ops/crawl-output/audit/level-counts.json); hash is the first 16 hex of the
 * sha256 of the sorted pool. With --baseline, prints before → after and exits 1 when a
 * pool that met its minimum now falls below. With --strict (needs --baseline), exits 1
 * when any pool was added, removed or changed its count or hash.
 */

import { createHash } from 'crypto';
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { AccentedVowels } from '../../config/AccentRules';
import createChangeRules from '../../config/ChangeRules';
import { DEFINITION_LETTERS, LETTERS_WITHOUT_DEFINITIONS } from '../../config/DefinitionConfig';
import { WORD_GROUP_FETCH_CONFIG, fetchConfig } from '../../config/WordGroupConfig';
import { GamesTranslations } from '../../config/translations/Games';
import { CHALLENGE_COUNT as ACCENT_CHALLENGE_COUNT, LEVEL_FETCH_OPTIONS as ACCENT_OPTIONS } from '../../games/accentFixer/config';
import { GRID_SIZE, WORDS_PER_LEVEL } from '../../games/crossWordPuzzle/config';
import { MIN_DEFINITIONS_BY_LEVEL, TOTAL_QUIZ_DEFINITIONS } from '../../games/definitionMaster/config';
import { CHALLENGE_COUNT as MATCHER_CHALLENGE_COUNT, LEVEL_FETCH_OPTIONS as MATCHER_OPTIONS } from '../../games/letterMatcher/config';
import { MIN_WORD_LENGTH as SPELLING_MIN_LENGTH, TOTAL_ROUNDS } from '../../games/spellingBee/config';
import {
    CHALLENGE_COUNT as SYLLABLE_CHALLENGE_COUNT,
    SYLLABLE_QUERY,
    SYLLABLE_WINDOW,
    isPlayable,
} from '../../games/syllableSplitter/config';
import { SEED_POOL_SIZE, SEED_QUERY } from '../../games/wordChain/config';
import { WORD_LENGTH_BY_LEVEL } from '../../games/wordFinder/config';
import { WordChunk, WordEntry, WordFilter, WordRecord } from '../../models/types';
import StorageService from '../../store/StorageService';
import { buildChallenge } from '../../utils/AccentGameProcessor';
import { MIN_WORD_LENGTH as CROSSWORD_MIN_LENGTH } from '../../utils/CrosswordGenerator';
import { eligibleDefinitionsForLevel, formatDefinition } from '../../utils/DefinitionPicker';
import { buildLetterChallenge } from '../../utils/LetterMatchProcessor';
import { isUsableClue } from '../../utils/SpellingComparer';
import { filterDefinitions, matchesQuery } from '../../utils/WordQuery';
import { hydrateChunk } from '../../utils/WordRecord';
import { LEVELS, LOCALES } from './wordAudit';

const ROOT = process.cwd();
const DEFAULT_OUT = 'ops/crawl-output/audit/level-counts.json';
const CHUNK_FILE = /^(beginner|intermediate|advanced)_\d+\.json$/;

type Count = { count: number; min: number | null; hash?: string };
type Counts = Record<string, Count>;
type Definitions = Record<string, Record<string, WordEntry>>;

const isAvailable = (gameId: string, locale: string): boolean => {
    const game = GamesTranslations.find((g) => g.id === gameId);
    return !!game && (!game.availableLocales || game.availableLocales.includes(locale));
};

/** Every served record of the locale, hydrated from its v2 chunks; a word in several level files once. */
const loadRecords = async (root: string, locale: string): Promise<WordRecord[]> => {
    const dir = path.join(root, 'public/words', locale);
    const records = new Map<string, WordRecord>();
    for (const name of (await readdir(dir)).filter((file) => CHUNK_FILE.test(file)).sort()) {
        const chunk: WordChunk = JSON.parse(await readFile(path.join(dir, name), 'utf-8'));
        for (const record of hydrateChunk(chunk)) records.set(record.word, record);
    }
    return [...records.values()];
};

const loadDefinitions = async (root: string, locale: string): Promise<Definitions> => {
    const definitions: Definitions = {};
    for (const letter of DEFINITION_LETTERS) {
        definitions[letter] = JSON.parse(await readFile(path.join(root, 'public/definitions', locale, `${letter}_definitions.json`), 'utf-8'));
    }
    return definitions;
};

const stripAccents = (word: string): string => Array.from(word).map((c) => AccentedVowels[c] ?? c).join('');

const hasUsableClue = (word: string, entry: WordEntry, level: string, locale: string): boolean =>
    eligibleDefinitionsForLevel(entry.definitions, level).some((d) =>
        isUsableClue({ word, definition: formatDefinition(d.definition), type: d.type, typeExtra: d.type_extra }, locale),
    );

/** First 16 hex characters of the sha256 of the sorted pool (duplicates kept), independent of word order. */
export const poolHash = (words: readonly string[]): string =>
    createHash('sha256').update([...words].sort().join('\n')).digest('hex').slice(0, 16);

const countLocale = async (locale: string, root: string = ROOT): Promise<Counts> => {
    const counts: Counts = {};
    const put = (key: string, words: readonly string[], min: number | null) => {
        counts[`${locale}/${key}`] = { count: words.length, min, hash: poolHash(words) };
    };

    const records = await loadRecords(root, locale);
    const pool = (filter: WordFilter): string[] => records.filter((record) => matchesQuery(record, filter)).map((record) => record.word);
    const fullWordSet = new Set(records.map((record) => record.word));
    const definitions = await loadDefinitions(root, locale);
    const definitionLetters = DEFINITION_LETTERS.filter((letter) => !LETTERS_WITHOUT_DEFINITIONS[locale]?.has(letter));
    const rules = createChangeRules(locale);

    const finder = fetchConfig(StorageService.WORDS_FINDER);
    const tower = fetchConfig(StorageService.WORDS_TOWER);
    const rain = fetchConfig(StorageService.WORDS_RAIN);
    const daily = fetchConfig(StorageService.WORDS_DAILY);
    const accent = fetchConfig(StorageService.WORDS_ACCENT);
    const matcher = fetchConfig(StorageService.WORDS_MATCHER);
    const syllable = fetchConfig(StorageService.WORDS_SYLLABLE);

    for (const level of LEVELS) {
        put(`${level}/wordBuilder`, pool({ level }), null);
        if (isAvailable('wordFinder', locale)) put(`${level}/wordFinder`, pool({ level, ...WORD_LENGTH_BY_LEVEL[level] }), finder.count);
        if (isAvailable('spellTower', locale)) put(`${level}/spellTower`, pool({ level, ...tower.query }), tower.count);
        if (isAvailable('wordsRain', locale)) put(`${level}/wordsRain`, pool({ level, ...rain.query }), rain.count);
        if (level === 'beginner') put(`${level}/dailyWord`, pool({ level, ...daily.query }), daily.count);
        for (const group of WORD_GROUP_FETCH_CONFIG) put(`${level}/prefetch/${group.key}`, pool({ level, ...group.query }), group.count);
        put(`${level}/wordChain/seed`, pool({ level, ...SEED_QUERY }), SEED_POOL_SIZE);

        if (isAvailable('accentFixer', locale)) {
            const window = pool({ level, ...ACCENT_OPTIONS[level] });
            put(`${level}/accentFixer/window`, window, accent.count);
            put(`${level}/accentFixer/eligible`, window.filter((w) => buildChallenge(w, fullWordSet)), ACCENT_CHALLENGE_COUNT);
        }
        if (isAvailable('letterMatcher', locale)) {
            const window = pool({ level, ...MATCHER_OPTIONS[level] });
            put(`${level}/letterMatcher/window`, window, matcher.count);
            put(`${level}/letterMatcher/eligible`, window.filter((w) => buildLetterChallenge(w, rules, fullWordSet)), MATCHER_CHALLENGE_COUNT);
        }
        if (isAvailable('syllableSplitter', locale)) {
            put(`${level}/syllableSplitter/window`, pool({ level, ...SYLLABLE_WINDOW[level] }), syllable.count);
            put(`${level}/syllableSplitter/eligible`, pool({ level, ...SYLLABLE_QUERY[level] }).filter(isPlayable), SYLLABLE_CHALLENGE_COUNT);
        }

        if (isAvailable('definitionMaster', locale)) {
            for (const letter of definitionLetters) {
                const offered = Object.keys(filterDefinitions(definitions[letter], { minSenses: MIN_DEFINITIONS_BY_LEVEL[level] }));
                put(`${level}/definitionMaster/${letter}`, offered, TOTAL_QUIZ_DEFINITIONS);
            }
        }
        if (isAvailable('spellingBee', locale)) {
            const lettersWithRounds: string[] = [];
            for (const letter of definitionLetters) {
                const usable = Object.entries(filterDefinitions(definitions[letter], { minLen: SPELLING_MIN_LENGTH }))
                    .filter(([word, entry]) => hasUsableClue(word, entry, level, locale))
                    .map(([word]) => word);
                put(`${level}/spellingBee/${letter}`, usable, 1);
                if (usable.length > 0) lettersWithRounds.push(letter);
            }
            put(`${level}/spellingBee/total-letters`, lettersWithRounds, TOTAL_ROUNDS);
        }
        if (isAvailable('crossWordPuzzle', locale)) {
            const keys = Object.values(definitions).flatMap((file) => Object.keys(file).map(stripAccents));
            put(`${level}/crossWordPuzzle`, keys.filter((k) => k.length >= CROSSWORD_MIN_LENGTH && k.length <= GRID_SIZE), WORDS_PER_LEVEL[level]);
        }
    }
    return counts;
};

type Options = { out: string; baseline?: string; strict: boolean };

const parseArgs = (argv: string[]): Options | null => {
    const options: Options = { out: DEFAULT_OUT, strict: false };
    for (let i = 0; i < argv.length; i++) {
        const flag = argv[i];
        if (flag === '--strict') {
            options.strict = true;
            continue;
        }
        const value = argv[++i];
        if (value === undefined) return null;
        if (flag === '--out') options.out = value;
        else if (flag === '--baseline') options.baseline = value;
        else return null;
    }
    return options.strict && !options.baseline ? null : options;
};

/** Sorted list of keys added, removed, or whose count or hash differ between the two snapshots. */
export const diffPools = (baseline: Counts, current: Counts): string[] => {
    const keys = [...new Set([...Object.keys(baseline), ...Object.keys(current)])].sort();
    return keys.flatMap((key) => {
        const before = baseline[key];
        const after = current[key];
        if (!before) return [`${key}: added (${after.count})`];
        if (!after) return [`${key}: removed (${before.count})`];
        if (before.count !== after.count || before.hash !== after.hash) {
            return [`${key}: ${before.count} ${before.hash ?? '-'} → ${after.count} ${after.hash ?? '-'}`];
        }
        return [];
    });
};

const meets = ({ count, min }: Count): boolean => min === null || count >= min;

/** Prints before → after; returns true when a pool that met its minimum now falls below it. */
export const compareCounts = (baseline: Counts, current: Counts): boolean => {
    const keys = [...new Set([...Object.keys(baseline), ...Object.keys(current)])].sort();
    const regressions: string[] = [];
    const belowBefore: string[] = [];
    const removed: string[] = [];
    console.log('key | min | before | after');
    for (const key of keys) {
        const before = baseline[key];
        const after = current[key];
        if (!after) {
            removed.push(key);
            continue;
        }
        if (before?.count !== after.count) console.log(`${key} | ${after.min ?? '-'} | ${before?.count ?? '-'} | ${after.count}`);
        if (before && !meets(before)) belowBefore.push(`${key} (${before.count} < ${before.min})`);
        else if (before && !meets(after)) regressions.push(`${key}: ${before.count} → ${after.count} (min ${after.min})`);
    }
    if (removed.length) console.log(`\nIn the baseline but no longer counted (removed):\n  ${removed.join('\n  ')}`);
    if (belowBefore.length) console.log(`\nAlready below minimum in the baseline:\n  ${belowBefore.join('\n  ')}`);
    if (regressions.length) console.error(`\nRegressions:\n  ${regressions.join('\n  ')}`);
    return regressions.length > 0;
};

export const countAllLocales = async (root: string = ROOT): Promise<Counts> => {
    const counts: Counts = {};
    for (const locale of LOCALES) Object.assign(counts, await countLocale(locale, root));
    return counts;
};

/** Exit code: 0 ok, 1 a pool regressed below its minimum (or, with --strict, changed), 2 bad args or a missing baseline. */
export async function runCli(argv: string[], countAll: () => Promise<Counts> = countAllLocales): Promise<number> {
    const options = parseArgs(argv);
    if (!options) {
        console.error('Usage: yarn words:level-counts [--out <json>] [--baseline <json>] [--strict]');
        return 2;
    }

    const counts = await countAll();

    const outPath = path.resolve(ROOT, options.out);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, JSON.stringify(counts, null, 4) + '\n', 'utf-8');
    console.log(`Level counts written to ${outPath}`);

    const emptyLetters = Object.entries(counts).filter(([key, c]) => key.includes('/spellingBee/') && !key.endsWith('total-letters') && c.count === 0);
    if (emptyLetters.length) console.log(`\nLetters with 0 usable words (consider LETTERS_WITHOUT_DEFINITIONS):\n  ${emptyLetters.map(([key]) => key).join('\n  ')}`);

    if (options.baseline) {
        const baselinePath = path.resolve(ROOT, options.baseline);
        if (!existsSync(baselinePath)) {
            console.error(`Baseline not found: ${baselinePath}`);
            return 2;
        }
        const baseline: Counts = JSON.parse(await readFile(baselinePath, 'utf-8'));
        const regressed = compareCounts(baseline, counts);
        if (options.strict) {
            const diff = diffPools(baseline, counts);
            if (diff.length) console.error(`\nPools that differ from the baseline:\n  ${diff.join('\n  ')}`);
            else console.log('\nEvery pool is identical to the baseline.');
            if (diff.length) return 1;
        }
        if (regressed) return 1;
    }
    return 0;
}

if (require.main === module) {
    runCli(process.argv.slice(2))
        .then((code) => process.exit(code))
        .catch((error) => {
            console.error(error instanceof Error ? error.message : error);
            process.exit(2);
        });
}
