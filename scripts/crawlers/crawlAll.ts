/**
 * Orchestrates a full crawl of all locales, levels, and word files.
 * Runs crawlRAE.ts (ES) and crawlDictionary.ts (EN) sequentially.
 * Skips words already in public/definitions/. Merges output at the end.
 *
 * Usage:
 *   tsx scripts/crawlers/crawlAll.ts
 *
 * No flags required. Edit LOCALES or LEVELS constants below to narrow scope.
 *
 * Output structure:
 *   ops/crawl-output/
 *     {locale}/
 *       {session}/           ← one folder per crawlAll run
 *         {level}.jsonl      ← one JSONL per level
 *
 * After crawling, each locale's session files are merged into public/definitions/.
 */

import { spawnSync } from 'child_process';
import { mkdirSync, readdirSync, existsSync } from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const SESSION = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

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

function run(args: string[]): boolean {
    const result = spawnSync('tsx', args, { stdio: 'inherit', cwd: ROOT });
    return result.status === 0;
}

function sessionDir(locale: string): string {
    return path.join(ROOT, 'ops/crawl-output', locale, SESSION);
}

function outputFile(locale: string, level: string): string {
    return path.join(sessionDir(locale), `${level}.jsonl`);
}

function banner(msg: string): void {
    const line = '─'.repeat(msg.length + 4);
    console.log(`\n┌${line}┐`);
    console.log(`│  ${msg}  │`);
    console.log(`└${line}┘`);
}

async function main(): Promise<void> {
    console.log(`\ncrawlAll  session: ${SESSION}`);
    console.log('Skipping words already in public/definitions/.\n');

    for (const locale of LOCALES) {
        mkdirSync(sessionDir(locale), { recursive: true });

        for (const level of LEVELS) {
            const wordsFile = WORD_FILES[locale][level];
            const out = outputFile(locale, level);

            if (!existsSync(wordsFile)) {
                console.warn(`  [skip] word file not found: ${wordsFile}`);
                continue;
            }

            banner(`${locale.toUpperCase()} / ${level}`);
            console.log(`  words : ${wordsFile}`);
            console.log(`  output: ${out}`);

            const ok = run([
                CRAWLERS[locale],
                wordsFile,
                '--level', level,
                '--skip-existing',
                '--quiet-skip',
                '--output', out,
            ]);

            if (!ok) {
                console.error(`  [error] crawler exited non-zero for ${locale}/${level} — continuing`);
            }
        }

        // Merge all JSONL files produced in this session for the locale
        const files = readdirSync(sessionDir(locale))
            .filter(f => f.endsWith('.jsonl'))
            .map(f => path.join(sessionDir(locale), f));

        if (files.length === 0) {
            console.log(`\n[${locale}] No JSONL files produced — nothing to merge.`);
            continue;
        }

        banner(`Merging ${locale.toUpperCase()} (${files.length} file(s))`);
        const ok = run([MERGE_SCRIPT, ...files]);
        if (!ok) {
            console.error(`[error] merge failed for ${locale}`);
        }
    }

    console.log(`\n✓ crawlAll complete. Session: ops/crawl-output/{locale}/${SESSION}/`);
}

main().catch((err) => { console.error(err); process.exit(1); });
