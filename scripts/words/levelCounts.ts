/**
 * Counts, per locale × level × game, how many words each game can draw from
 * the served data (public/words + public/definitions), next to the game's
 * minimum. Run before and after a words:audit --fix to prove no pool that met
 * its minimum falls below it.
 *
 * The game tables come from the games' own config modules (no copies). The
 * spellingBee count is an upper bound: the game picks one random eligible
 * sense per word, and only words whose eligible senses include a usable clue
 * are counted.
 *
 * Usage:
 *   yarn words:level-counts [--out <json>] [--baseline <json>]
 *
 * Output: flat JSON map "<locale>/<level>/<game>[/<part>]": { count, min | null }
 * (default ops/crawl-output/audit/level-counts.json). With --baseline, prints
 * before → after and exits 1 when a pool that met its minimum now falls below.
 */

import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { AccentedVowels } from '../../config/AccentRules';
import createChangeRules from '../../config/ChangeRules';
import { DEFINITION_LETTERS, LETTERS_WITHOUT_DEFINITIONS } from '../../config/DefinitionConfig';
import { WORD_GROUP_FETCH_CONFIG } from '../../config/WordGroupConfig';
import { GamesTranslations } from '../../config/translations/Games';
import { CHALLENGE_COUNT as ACCENT_CHALLENGE_COUNT, LEVEL_FETCH_OPTIONS as ACCENT_OPTIONS } from '../../games/accentFixer/config';
import { GRID_SIZE, WORDS_PER_LEVEL } from '../../games/crossWordPuzzle/config';
import { MIN_DEFINITIONS_BY_LEVEL, TOTAL_QUIZ_DEFINITIONS } from '../../games/definitionMaster/config';
import { CHALLENGE_COUNT as MATCHER_CHALLENGE_COUNT, LEVEL_FETCH_OPTIONS as MATCHER_OPTIONS } from '../../games/letterMatcher/config';
import { MIN_WORD_LENGTH as SPELLING_MIN_LENGTH, TOTAL_ROUNDS } from '../../games/spellingBee/config';
import {
    CHALLENGE_COUNT as SYLLABLE_CHALLENGE_COUNT,
    LEVEL_FETCH_OPTIONS as SYLLABLE_OPTIONS,
    isEligible,
} from '../../games/syllableSplitter/config';
import { WORD_LENGTH_BY_LEVEL } from '../../games/wordFinder/config';
import { WordEntry } from '../../models/types';
import StorageService, { StorageKey } from '../../store/StorageService';
import { buildChallenge } from '../../utils/AccentGameProcessor';
import { MIN_WORD_LENGTH as CROSSWORD_MIN_LENGTH } from '../../utils/CrosswordGenerator';
import { eligibleDefinitionsForLevel, formatDefinition } from '../../utils/DefinitionPicker';
import { buildLetterChallenge } from '../../utils/LetterMatchProcessor';
import { isUsableClue } from '../../utils/SpellingComparer';
import { LEVELS, LOCALES } from './wordAudit';

const ROOT = process.cwd();
const DEFAULT_OUT = 'ops/crawl-output/audit/level-counts.json';
// WordsService.getWordsImpl: a max-only window uses this minimum.
const DEFAULT_MIN_LENGTH = 3;

type Window = { minLength?: number; maxLength?: number };
type Count = { count: number; min: number | null };
type Counts = Record<string, Count>;
type Definitions = Record<string, Record<string, WordEntry>>;

const fetchConfig = (key: StorageKey) => {
    const config = WORD_GROUP_FETCH_CONFIG.find((group) => group.key === key);
    if (!config) throw new Error(`No WORD_GROUP_FETCH_CONFIG entry for ${key}`);
    return config;
};

const isAvailable = (gameId: string, locale: string): boolean => {
    const game = GamesTranslations.find((g) => g.id === gameId);
    return !!game && (!game.availableLocales || game.availableLocales.includes(locale));
};

/** Mirrors DBService.getRandomWordsWithMaxLength: length >= min and <= max. */
const inWindow = (words: string[], { minLength, maxLength }: Window): string[] =>
    words.filter((w) => w.length >= (minLength ?? DEFAULT_MIN_LENGTH) && (maxLength === undefined || w.length <= maxLength));

const loadLevelWords = async (locale: string, level: string): Promise<string[]> => {
    const dir = path.join(ROOT, 'public/words', locale);
    const files = (await readdir(dir)).filter((name) => name.startsWith(`${level}_words_from_`) && name.endsWith('.json'));
    const chunks = await Promise.all(files.map(async (name) => JSON.parse(await readFile(path.join(dir, name), 'utf-8')) as string[]));
    return chunks.flat();
};

const loadDefinitions = async (locale: string): Promise<Definitions> => {
    const definitions: Definitions = {};
    for (const letter of DEFINITION_LETTERS) {
        definitions[letter] = JSON.parse(await readFile(path.join(ROOT, 'public/definitions', locale, `${letter}_definitions.json`), 'utf-8'));
    }
    return definitions;
};

const stripAccents = (word: string): string => Array.from(word).map((c) => AccentedVowels[c] ?? c).join('');

const hasUsableClue = (word: string, entry: WordEntry, level: string, locale: string): boolean =>
    eligibleDefinitionsForLevel(entry.definitions, level).some((d) =>
        isUsableClue({ word, definition: formatDefinition(d.definition), type: d.type, typeExtra: d.type_extra }, locale),
    );

const countLocale = async (locale: string): Promise<Counts> => {
    const counts: Counts = {};
    const put = (key: string, count: number, min: number | null) => { counts[`${locale}/${key}`] = { count, min }; };

    const levelWords = Object.fromEntries(await Promise.all(LEVELS.map(async (level) => [level, await loadLevelWords(locale, level)] as const)));
    const fullWordSet = new Set(LEVELS.flatMap((level) => levelWords[level]));
    const definitions = await loadDefinitions(locale);
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
        const words = levelWords[level];
        put(`${level}/wordBuilder`, words.length, null);
        if (isAvailable('wordFinder', locale)) put(`${level}/wordFinder`, inWindow(words, WORD_LENGTH_BY_LEVEL[level]).length, finder.count);
        if (isAvailable('spellTower', locale)) put(`${level}/spellTower`, inWindow(words, tower).length, tower.count);
        if (isAvailable('wordsRain', locale)) put(`${level}/wordsRain`, inWindow(words, rain).length, rain.count);
        if (level === 'beginner') put(`${level}/dailyWord`, inWindow(words, daily).length, daily.count);

        if (isAvailable('accentFixer', locale)) {
            const pool = inWindow(words, ACCENT_OPTIONS[level]);
            put(`${level}/accentFixer/window`, pool.length, accent.count);
            put(`${level}/accentFixer/eligible`, pool.filter((w) => buildChallenge(w, fullWordSet)).length, ACCENT_CHALLENGE_COUNT);
        }
        if (isAvailable('letterMatcher', locale)) {
            const pool = inWindow(words, MATCHER_OPTIONS[level]);
            put(`${level}/letterMatcher/window`, pool.length, matcher.count);
            put(`${level}/letterMatcher/eligible`, pool.filter((w) => buildLetterChallenge(w, rules, fullWordSet)).length, MATCHER_CHALLENGE_COUNT);
        }
        if (isAvailable('syllableSplitter', locale)) {
            const pool = inWindow(words, SYLLABLE_OPTIONS[level]);
            put(`${level}/syllableSplitter/window`, pool.length, syllable.count);
            put(`${level}/syllableSplitter/eligible`, pool.filter((w) => isEligible(w, SYLLABLE_OPTIONS[level])).length, SYLLABLE_CHALLENGE_COUNT);
        }

        if (isAvailable('definitionMaster', locale)) {
            for (const letter of definitionLetters) {
                const entries = Object.values(definitions[letter]);
                put(`${level}/definitionMaster/${letter}`, entries.filter((e) => e.definitions.length >= MIN_DEFINITIONS_BY_LEVEL[level]).length, TOTAL_QUIZ_DEFINITIONS);
            }
        }
        if (isAvailable('spellingBee', locale)) {
            let lettersWithRounds = 0;
            for (const letter of definitionLetters) {
                const usable = Object.entries(definitions[letter]).filter(
                    ([word, entry]) => Array.from(word).length >= SPELLING_MIN_LENGTH && hasUsableClue(word, entry, level, locale),
                ).length;
                put(`${level}/spellingBee/${letter}`, usable, 1);
                if (usable > 0) lettersWithRounds++;
            }
            put(`${level}/spellingBee/total-letters`, lettersWithRounds, TOTAL_ROUNDS);
        }
        if (isAvailable('crossWordPuzzle', locale)) {
            const keys = Object.values(definitions).flatMap((file) => Object.keys(file).map(stripAccents));
            const fitting = keys.filter((k) => k.length >= CROSSWORD_MIN_LENGTH && k.length <= GRID_SIZE).length;
            put(`${level}/crossWordPuzzle`, fitting, WORDS_PER_LEVEL[level]);
        }
    }
    return counts;
};

const parseArgs = (argv: string[]): { out: string; baseline?: string } | null => {
    const options: { out: string; baseline?: string } = { out: DEFAULT_OUT };
    for (let i = 0; i < argv.length; i += 2) {
        const value = argv[i + 1];
        if (value === undefined) return null;
        if (argv[i] === '--out') options.out = value;
        else if (argv[i] === '--baseline') options.baseline = value;
        else return null;
    }
    return options;
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

const countAllLocales = async (): Promise<Counts> => {
    const counts: Counts = {};
    for (const locale of LOCALES) Object.assign(counts, await countLocale(locale));
    return counts;
};

/** Exit code: 0 ok, 1 a pool regressed below its minimum, 2 bad args or a missing baseline. */
export async function runCli(argv: string[], countAll: () => Promise<Counts> = countAllLocales): Promise<number> {
    const options = parseArgs(argv);
    if (!options) {
        console.error('Usage: yarn words:level-counts [--out <json>] [--baseline <json>]');
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
        if (compareCounts(baseline, counts)) return 1;
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
