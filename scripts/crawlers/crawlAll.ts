/**
 * Orchestrates a full crawl of all locales and levels.
 * Runs crawlRAE.ts (ES) and crawlDictionary.ts (EN) sequentially.
 * Skips words already in public/definitions/. Merges after each level.
 *
 * Output: ops/crawl-output/{locale}/{letter}.jsonl — fixed paths, no timestamp.
 * Appends to existing JSONL files so runs are resumable.
 *
 * Usage:
 *   yarn crawl:all
 *
 * No flags required. Edit LOCALES or LEVELS constants below to narrow scope.
 */

import { spawnSync } from 'child_process';
import { mkdirSync, readdirSync } from 'fs';
import * as path from 'path';

const ROOT = process.cwd();

const CRAWLERS: Record<string, string> = {
    es: path.join(ROOT, 'scripts/crawlers/crawlRAE.ts'),
    en: path.join(ROOT, 'scripts/crawlers/crawlDictionary.ts'),
};

const WORD_FILES: Record<string, Record<string, string>> = {
    es: {
        beginner:     path.join(ROOT, 'ops/scripts/words/es/beginner_words.txt'),
        intermediate: path.join(ROOT, 'ops/scripts/words/es/intermediate_words.txt'),
        advanced:     path.join(ROOT, 'ops/scripts/words/es/advanced_words.txt'),
    },
    en: {
        beginner:     path.join(ROOT, 'ops/scripts/words/en/beginner_words.txt'),
        intermediate: path.join(ROOT, 'ops/scripts/words/en/intermediate_words.txt'),
        advanced:     path.join(ROOT, 'ops/scripts/words/en/advanced_words.txt'),
    },
};

const MERGE_SCRIPT = path.join(ROOT, 'scripts/crawlers/mergeDefinitions.ts');

const LOCALES = ['es', 'en'] as const;
const LEVELS  = ['beginner', 'intermediate', 'advanced'] as const;

// Exit code 2 from crawlRAE.ts means daily limit reached — stop ES crawling
const EXIT_DAILY_LIMIT = 2;

function outputDir(locale: string): string {
    return path.join(ROOT, 'ops/crawl-output', locale);
}

function run(args: string[]): { ok: boolean; dailyLimit: boolean } {
    const result = spawnSync('tsx', args, { stdio: 'inherit', cwd: ROOT });
    return {
        ok: result.status === 0,
        dailyLimit: result.status === EXIT_DAILY_LIMIT,
    };
}

function mergeLocale(locale: string): void {
    const dir = outputDir(locale);
    const files = readdirSync(dir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => path.join(dir, f));

    if (files.length === 0) {
        console.log(`[${locale}] No JSONL files to merge.`);
        return;
    }

    banner(`Merging ${locale.toUpperCase()} (${files.length} file(s))`);
    const { ok } = run([MERGE_SCRIPT, '--locale', locale, ...files]);
    if (!ok) console.error(`[error] merge failed for ${locale}`);
}

function banner(msg: string): void {
    const line = '─'.repeat(msg.length + 4);
    console.log(`\n┌${line}┐`);
    console.log(`│  ${msg}  │`);
    console.log(`└${line}┘`);
}

async function main(): Promise<void> {
    console.log('\ncrawlAll — output: ops/crawl-output/{locale}/{letter}.jsonl');
    console.log('Skipping words already in public/definitions/.\n');

    for (const locale of LOCALES) {
        mkdirSync(outputDir(locale), { recursive: true });

        let dailyLimitReached = false;

        for (const level of LEVELS) {
            if (dailyLimitReached) break;

            const wordsFile = WORD_FILES[locale][level];
            const dir = outputDir(locale);
            const notFoundFile = path.join(dir, 'not-found.txt');

            const { existsSync } = await import('fs');
            if (!existsSync(wordsFile)) {
                console.warn(`  [skip] word file not found: ${wordsFile}`);
                continue;
            }

            banner(`${locale.toUpperCase()} / ${level}`);
            console.log(`  words      : ${wordsFile}`);
            console.log(`  output dir : ${dir}`);

            const crawlerArgs = [
                CRAWLERS[locale],
                wordsFile,
                '--level', level,
                '--skip-existing',
                '--quiet-skip',
                '--output-dir', dir,
                '--not-found-file', notFoundFile,
            ];

            const { ok, dailyLimit } = run(crawlerArgs);

            if (dailyLimit) {
                console.warn(`\n[${locale}] Daily API limit reached — stopping ES crawl. Merge what we have.\n`);
                dailyLimitReached = true;
            } else if (!ok) {
                console.error(`  [error] crawler exited non-zero for ${locale}/${level} — continuing`);
            }

            // Merge after each level so next level's --skip-existing sees updated public/
            mergeLocale(locale);
        }
    }

    console.log('\ncrawlAll complete.');
}

main().catch((err) => { console.error(err); process.exit(1); });
