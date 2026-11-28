/**
 * Re-crawls the es words whose definitions are poor and replaces their senses wholesale.
 *
 * Candidates (es definitions):
 *   C1  every sense is a bare single word or a form-of reference
 *   C2  a sense has an empty type or a type_extra with `sin verificar`
 *   C3  more than 6 senses (reported only, never queued)
 * Queue = C1 ∪ C2 minus words already done (ops/crawl-progress/es-recrawl.json) or already answered
 * (in the re-crawl JSONL or not-found file), by frequency rank, unranked last in Spanish collation.
 *
 * A run writes the batch to ops/crawl-output/es-recrawl/queue.txt, runs crawlRAE.ts on it, merges
 * every not-done JSONL entry of a word already in public/definitions/es in replace mode (level kept)
 * and records `replaced` / `not-found` in the progress file. Then run `yarn words:audit --fix` and
 * `yarn words:build`.
 *
 * Usage:
 *   yarn crawl:recrawl-es [--check] [--limit <1-100>] [--root <dir>]
 *
 * Exit: 0 done (or nothing pending), 1 invalid progress file / I/O failure / crawler failure,
 *       2 bad args or RAE daily quota reached (after merging and saving progress).
 */

import { existsSync } from 'fs';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { spawnSync } from 'child_process';
import * as path from 'path';
import { UNVERIFIED_TYPE_MARKER } from '../../config/DefinitionConfig';
import { DefinitionFile, Sense, classifySense, loadFrequencyRanks, loadLocaleInput } from '../words/wordAudit';
import { mergeIntoFiles, readJSONL } from './mergeDefinitions';

const OUTPUT_DIR = 'ops/crawl-output/es-recrawl';
const PROGRESS_FILE = 'ops/crawl-progress/es-recrawl.json';
const PROGRESS_VERSION = 1;
const MAX_LIMIT = 100;
const MAX_SENSES = 6;
const PREVIEW_SIZE = 20;
const CRAWLER = path.join(__dirname, 'crawlRAE.ts');
const USAGE = 'Usage: yarn crawl:recrawl-es [--check] [--limit <1-100>] [--root <dir>]';

const collator = new Intl.Collator('es-ES', { sensitivity: 'base' });

type Status = 'replaced' | 'not-found';
type Progress = { version: number; done: Record<string, { status: Status; at: string }> };
export type Crawl = (args: string[]) => number;

/** C1 sense: a form-of reference (D4) or a bare single word (D3b). */
const isPoorSense = (sense: Sense): boolean => {
    const verdict = classifySense(sense, 'es');
    return verdict.delete === 'D4' || verdict.flags.includes('D3b');
};

export const findCandidates = (definitions: Record<string, DefinitionFile>) => {
    const c1 = new Set<string>();
    const c2 = new Set<string>();
    const c3 = new Set<string>();
    for (const file of Object.values(definitions)) {
        for (const [word, { definitions: senses }] of Object.entries(file)) {
            if (senses.length > 0 && senses.every(isPoorSense)) c1.add(word);
            if (senses.some((sense) => !sense.type?.trim() || sense.type_extra?.includes(UNVERIFIED_TYPE_MARKER))) c2.add(word);
            if (senses.length > MAX_SENSES) c3.add(word);
        }
    }
    return { c1, c2, c3 };
};

const spawnCrawler = (root: string): Crawl => (args) =>
    spawnSync('tsx', [CRAWLER, ...args], { stdio: 'inherit', cwd: root }).status ?? 1;

type CliOptions = { check: boolean; limit: number; root?: string };

const parseArgs = (argv: string[]): CliOptions | null => {
    const options: CliOptions = { check: false, limit: MAX_LIMIT };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--check') {
            options.check = true;
            continue;
        }
        const value = argv[++i];
        if (value === undefined) return null;
        if (arg === '--root') options.root = value;
        else if (arg === '--limit' && /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= MAX_LIMIT) options.limit = Number(value);
        else return null;
    }
    return options;
};

/** Missing file = empty progress; null when the file is not valid JSON or not version 1. */
const loadProgress = async (filePath: string): Promise<Progress | null> => {
    if (!existsSync(filePath)) return { version: PROGRESS_VERSION, done: {} };
    try {
        const progress = JSON.parse(await readFile(filePath, 'utf-8')) as Progress;
        return progress?.version === PROGRESS_VERSION && typeof progress.done === 'object' && progress.done ? progress : null;
    } catch {
        return null;
    }
};

const saveProgress = async (filePath: string, progress: Progress): Promise<void> => {
    const done = Object.fromEntries(Object.entries(progress.done).sort(([a], [b]) => collator.compare(a, b)));
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify({ version: PROGRESS_VERSION, done }, null, 4), 'utf-8');
};

const readCrawlEntries = async (outputDir: string) => {
    if (!existsSync(outputDir)) return [];
    const files = (await readdir(outputDir)).filter((name) => name.endsWith('.jsonl')).sort();
    return (await Promise.all(files.map((name) => readJSONL(path.join(outputDir, name))))).flat();
};

const readNotFound = async (filePath: string): Promise<Set<string>> =>
    existsSync(filePath)
        ? new Set((await readFile(filePath, 'utf-8')).split('\n').map((word) => word.trim()).filter(Boolean))
        : new Set();

/** Merges not-done crawl entries of known words (replace mode) and records them, plus known not-found words, as done. */
const reconcile = async (root: string, known: Set<string>, progress: Progress, notFoundFile: string) => {
    const isOpen = (word: string) => known.has(word) && !progress.done[word];
    const entries = (await readCrawlEntries(path.join(root, OUTPUT_DIR))).filter((entry) => isOpen(entry.word));
    await mergeIntoFiles(root, entries, { replace: true });

    const at = new Date().toISOString().slice(0, 10);
    const replaced = new Set(entries.map((entry) => entry.word));
    const notFound = [...(await readNotFound(notFoundFile))].filter((word) => isOpen(word) && !replaced.has(word));
    replaced.forEach((word) => { progress.done[word] = { status: 'replaced', at }; });
    notFound.forEach((word) => { progress.done[word] = { status: 'not-found', at }; });
    await saveProgress(path.join(root, PROGRESS_FILE), progress);
    return { replaced, notFound: new Set(notFound) };
};

/** CLI entry: see the header for flags and exit codes. `crawl` runs crawlRAE.ts (injected by tests). */
export const runCli = async (argv: string[], cwd: string, crawl?: Crawl): Promise<0 | 1 | 2> => {
    const options = parseArgs(argv);
    if (!options) {
        console.error(USAGE);
        return 2;
    }
    const root = path.resolve(cwd, options.root ?? '.');
    const outputDir = path.join(root, OUTPUT_DIR);
    const queueFile = path.join(outputDir, 'queue.txt');
    const notFoundFile = path.join(outputDir, 'not-found.txt');

    const progressFile = path.join(root, PROGRESS_FILE);
    const progress = await loadProgress(progressFile);
    if (!progress) {
        console.error(`Invalid progress file: ${progressFile} (expected {"version": ${PROGRESS_VERSION}, "done": {...}})`);
        return 1;
    }

    const { definitions } = await loadLocaleInput(root, 'es');
    const ranks = await loadFrequencyRanks(root, 'es');
    const known = new Set(Object.values(definitions).flatMap((file) => Object.keys(file)));
    const { c1, c2, c3 } = findCandidates(definitions);
    const union = new Set([...c1, ...c2]);

    const answered = new Set([...(await readCrawlEntries(outputDir)).map((entry) => entry.word), ...(await readNotFound(notFoundFile))]);
    const rankOf = (word: string) => ranks.get(word) ?? Infinity;
    const pending = [...union]
        .filter((word) => !progress.done[word] && !answered.has(word))
        .sort((a, b) => rankOf(a) - rankOf(b) || collator.compare(a, b));

    if (options.check) {
        const byStatus = (status: Status) => Object.values(progress.done).filter((entry) => entry.status === status).length;
        console.log(`C1 single-word/form-of only: ${c1.size}`);
        console.log(`C2 empty or unverified type: ${c2.size}`);
        console.log(`C3 more than ${MAX_SENSES} senses (not queued): ${c3.size}`);
        console.log(`Queue (C1 ∪ C2) union: ${union.size}`);
        console.log(`Done: replaced ${byStatus('replaced')}, not-found ${byStatus('not-found')}`);
        console.log(`Pending: ${pending.length}`);
        if (pending.length) console.log(`Next: ${pending.slice(0, PREVIEW_SIZE).join(', ')}`);
        return 0;
    }

    const batch = pending.slice(0, options.limit);
    let exitCode: 0 | 2 = 0;
    if (batch.length === 0) {
        console.log('Nothing to re-crawl.');
    } else {
        await mkdir(outputDir, { recursive: true });
        await writeFile(queueFile, batch.join('\n') + '\n', 'utf-8');
        const status = (crawl ?? spawnCrawler(root))([queueFile, '--output-dir', outputDir, '--not-found-file', notFoundFile, '--quiet-skip']);
        if (status !== 0 && status !== 2) {
            console.error(`crawlRAE.ts exited with ${status}; nothing merged.`);
            return 1;
        }
        exitCode = status === 2 ? 2 : 0;
    }

    const { replaced, notFound } = await reconcile(root, known, progress, notFoundFile);
    const inBatch = (words: Set<string>) => batch.filter((word) => words.has(word)).length;
    const selectedReplaced = inBatch(replaced);
    const selectedNotFound = inBatch(notFound);
    console.log(`Selected: ${batch.length}  Replaced: ${selectedReplaced}  Not found: ${selectedNotFound}  ` +
        `Errors: ${batch.length - selectedReplaced - selectedNotFound}  Pending left: ${pending.length - selectedReplaced - selectedNotFound}`);
    if (replaced.size > selectedReplaced) console.log(`Also merged ${replaced.size - selectedReplaced} leftover word(s) from earlier runs.`);
    if (exitCode === 2) console.error('RAE daily quota reached: merged what was fetched; run again tomorrow.');
    return exitCode;
};

if (require.main === module) {
    runCli(process.argv.slice(2), process.cwd())
        .then((code) => process.exit(code))
        .catch((error) => {
            console.error(error instanceof Error ? error.message : error);
            process.exit(1);
        });
}
