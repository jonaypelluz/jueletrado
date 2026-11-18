/**
 * Merges JSONL crawl output files into public/definitions/{locale}/{letter}_definitions.json.
 *
 * Reads JSONL files in the order given (oldest-first = newer entries win on conflict).
 * For each word, merges definitions by their `number` field: updates existing entries,
 * appends new ones. Sets `level` on the word entry if not already present.
 *
 * Usage:
 *   tsx scripts/crawlers/mergeDefinitions.ts <file.jsonl> [file2.jsonl ...] [options]
 *
 * Options:
 *   --dry-run             Print what would change, write nothing
 *   --locale <es|en>      Only process entries for this locale
 *   --letter <l>          Only process entries for words starting with this letter
 *   --replace             Replace an existing word's senses wholesale (keeps its level) instead of merging by number
 *
 * Examples:
 *   tsx scripts/crawlers/mergeDefinitions.ts ops/crawl-output/es/1234.jsonl
 *   tsx scripts/crawlers/mergeDefinitions.ts ops/crawl-output/es/*.jsonl --dry-run
 *   tsx scripts/crawlers/mergeDefinitions.ts ops/crawl-output/en/1234.jsonl --locale en --letter j
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface DefinitionExtra {
    type: string;
    content: string;
}

interface Definition {
    number: number | string;
    type: string;
    definition: string;
    level?: string;
    type_extra?: string;
    definition_extra?: DefinitionExtra[];
}

interface WordEntry {
    level?: string;
    definitions: Definition[];
}

type DefinitionsFile = Record<string, WordEntry>;

interface CrawlEntry {
    word: string;
    locale: string;
    level?: string;
    source: string;
    crawledAt: string;
    definitions: Definition[];
}

export async function readJSONL(filePath: string): Promise<CrawlEntry[]> {
    const entries: CrawlEntry[] = [];
    const rl = readline.createInterface({
        input: createReadStream(filePath),
        crlfDelay: Infinity,
    });
    for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
            entries.push(JSON.parse(trimmed) as CrawlEntry);
        } catch {
            console.warn(`  Skipping malformed line in ${filePath}: ${trimmed.slice(0, 80)}`);
        }
    }
    return entries;
}

function getDefinitionsDir(root: string, locale: string): string {
    return path.join(root, 'public/definitions', locale);
}

function getLetterFilePath(root: string, locale: string, letter: string): string {
    return path.join(getDefinitionsDir(root, locale), `${letter}_definitions.json`);
}

function firstLetter(word: string, locale: string): string {
    const ch = word[0]?.toLowerCase() ?? 'a';
    if (locale === 'es') {
        const accentMap: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' };
        return accentMap[ch] ?? ch;
    }
    return ch;
}

async function loadFile(filePath: string): Promise<DefinitionsFile> {
    if (!existsSync(filePath)) return {};
    return JSON.parse(await readFile(filePath, 'utf-8')) as DefinitionsFile;
}

export function mergeEntry(
    existing: WordEntry | undefined,
    incoming: CrawlEntry,
    { replace = false }: { replace?: boolean } = {},
): { entry: WordEntry; changed: boolean } {
    if (!existing) {
        return {
            entry: {
                ...(incoming.level ? { level: incoming.level } : {}),
                definitions: incoming.definitions,
            },
            changed: true,
        };
    }

    if (replace) {
        const entry: WordEntry = { ...existing, definitions: incoming.definitions };
        return { entry, changed: JSON.stringify(entry) !== JSON.stringify(existing) };
    }

    let changed = false;
    const entry: WordEntry = { ...existing, definitions: [...existing.definitions] };

    // Set level on word entry if not already present
    if (incoming.level && !entry.level) {
        entry.level = incoming.level;
        changed = true;
    }

    for (const def of incoming.definitions) {
        const idx = entry.definitions.findIndex(d => String(d.number) === String(def.number));
        if (idx === -1) {
            entry.definitions.push(def);
            changed = true;
        } else {
            const merged = { ...entry.definitions[idx], ...def };
            if (JSON.stringify(merged) !== JSON.stringify(entry.definitions[idx])) {
                entry.definitions[idx] = merged;
                changed = true;
            }
        }
    }

    return { entry, changed };
}

export interface MergeTotals {
    totalWords: number;
    totalNew: number;
    totalUpdated: number;
}

/** Merges crawl entries into public/definitions under root, writing each changed letter file (unless dryRun). */
export async function mergeIntoFiles(
    root: string,
    entries: CrawlEntry[],
    { replace = false, dryRun = false }: { replace?: boolean; dryRun?: boolean } = {},
): Promise<MergeTotals> {
    // Group by locale → letter → word
    const grouped = new Map<string, Map<string, CrawlEntry[]>>();
    for (const entry of entries) {
        const letter = firstLetter(entry.word, entry.locale);
        if (!grouped.has(entry.locale)) grouped.set(entry.locale, new Map());
        const byLetter = grouped.get(entry.locale)!;
        if (!byLetter.has(letter)) byLetter.set(letter, []);
        byLetter.get(letter)!.push(entry);
    }

    const totals: MergeTotals = { totalWords: 0, totalNew: 0, totalUpdated: 0 };

    for (const [locale, byLetter] of grouped) {
        for (const [letter, letterEntries] of byLetter) {
            const filePath = getLetterFilePath(root, locale, letter);
            const data = await loadFile(filePath);
            let fileChanged = false;

            for (const crawlEntry of letterEntries) {
                const { entry, changed } = mergeEntry(data[crawlEntry.word], crawlEntry, { replace });
                if (changed) {
                    const isNew = !data[crawlEntry.word];
                    data[crawlEntry.word] = entry;
                    fileChanged = true;
                    totals.totalWords++;
                    if (isNew) {
                        totals.totalNew++;
                        console.log(`  [new]     ${locale}/${letter}: ${crawlEntry.word} (${entry.definitions.length} defs)`);
                    } else {
                        totals.totalUpdated++;
                        console.log(`  [updated] ${locale}/${letter}: ${crawlEntry.word}`);
                    }
                } else {
                    console.log(`  [no-op]   ${locale}/${letter}: ${crawlEntry.word}`);
                }
            }

            if (fileChanged && !dryRun) {
                await mkdir(getDefinitionsDir(root, locale), { recursive: true });
                await writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
                console.log(`Wrote ${filePath}`);
            }
        }
    }

    return totals;
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    const flagIndices = new Set<number>();
    const dryRun = args.includes('--dry-run');
    const replace = args.includes('--replace');
    const localeIdx = args.indexOf('--locale');
    const localeFilter = localeIdx !== -1 ? args[localeIdx + 1] : null;
    const letterIdx = args.indexOf('--letter');
    const letterFilter = letterIdx !== -1 ? args[letterIdx + 1]?.toLowerCase() : null;

    // Collect flag indices to exclude from file list
    if (dryRun) flagIndices.add(args.indexOf('--dry-run'));
    if (localeIdx !== -1) { flagIndices.add(localeIdx); flagIndices.add(localeIdx + 1); }
    if (letterIdx !== -1) { flagIndices.add(letterIdx); flagIndices.add(letterIdx + 1); }

    const inputFiles = args.filter((a, i) => !flagIndices.has(i) && !a.startsWith('--'));

    if (inputFiles.length === 0) {
        console.error('Usage: tsx scripts/crawlers/mergeDefinitions.ts <file.jsonl> [file2.jsonl ...] [options]');
        process.exit(1);
    }

    if (dryRun) console.log('[dry-run] No files will be written.\n');

    // Collect all entries from all JSONL files
    const allEntries: CrawlEntry[] = [];
    for (const file of inputFiles) {
        if (!existsSync(file)) {
            console.warn(`File not found: ${file}`);
            continue;
        }
        const entries = await readJSONL(file);
        console.log(`Read ${entries.length} entries from ${file}`);
        allEntries.push(...entries);
    }

    if (allEntries.length === 0) {
        console.log('No entries to process.');
        return;
    }

    const selected = allEntries.filter((entry) =>
        (!localeFilter || entry.locale === localeFilter) &&
        (!letterFilter || firstLetter(entry.word, entry.locale) === letterFilter));

    const { totalNew, totalUpdated, totalWords } = await mergeIntoFiles(process.cwd(), selected, { replace, dryRun });

    console.log(`\nDone. New: ${totalNew}  Updated: ${totalUpdated}  Total changed: ${totalWords}${dryRun ? ' (dry-run, nothing written)' : ''}`);
}

if (require.main === module) {
    main().catch((err) => { console.error(err); process.exit(1); });
}
