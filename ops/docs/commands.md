# Ops commands

Reference for the word-list and definitions pipeline. All commands run from the
repo root via `yarn <script>` or `tsx scripts/...`.

## Pipeline overview

```
ops/scripts/words/{locale}/{level}_words.txt   ──► crawler ──► ops/crawl-output/{locale}/{letter}.jsonl ──► merge ──► public/definitions/{locale}/{letter}_definitions.json
                                                                                                                              │
ops/scripts/words/{locale}/{level}_words.txt   ◄────────────────────────────────────────────────────────── words:transform ──► public/words/{locale}/
```

- Crawlers never write directly to `public/definitions/` — they append to JSONL
  staging files, which are then merged.
- Word lists (`*_words.txt`) are the source of truth for which words get crawled
  and which game level they belong to.

## Definitions crawlers

### `yarn crawl:all`

Runs the full pipeline: ES (`crawlRAE.ts`) then EN (`crawlDictionary.ts`), each
through `beginner` → `intermediate` → `advanced`, merging after every level.
Resumable — re-running skips words already crawled or already in
`public/definitions/`. No flags; edit `LOCALES`/`LEVELS` in
`scripts/crawlers/crawlAll.ts` to narrow scope.

If the RAE API daily quota is exhausted mid-run, ES stops for the day and the
script moves on to EN.

### `tsx scripts/crawlers/crawlRAE.ts <wordsFile> [options]`

Fetches ES definitions from [rae-api.com](https://rae-api.com) (unofficial RAE
API). Requires `RAE_API_KEY` in `.env.local`.

```bash
yarn tsx scripts/crawlers/crawlRAE.ts ops/scripts/words/es/beginner_words.txt \
  --level beginner --skip-existing --quiet-skip \
  --output-dir ops/crawl-output/es --not-found-file ops/crawl-output/es/not-found.txt
```

| Option | Description |
|---|---|
| `--output-dir <dir>` | JSONL output folder (default: `ops/crawl-output/es`) |
| `--start <word>` | Resume from this word |
| `--letter <l>` | Only process words starting with this letter |
| `--level <level>` | Tag entries with `beginner\|intermediate\|advanced` |
| `--skip-existing` | Skip words already in `public/definitions/es/` |
| `--force-update` | Fetch even if the word already has definitions |
| `--delay <min>-<max>` | Random delay in ms between requests (default `7000-15000`) |
| `--quiet-skip` | Suppress per-word skip messages, show a total at the end |
| `--not-found-file <f>` | Track words with no RAE entry (default: `ops/crawl-output/es/not-found.txt`) |

### `tsx scripts/crawlers/crawlDictionary.ts <wordsFile> [options]`

Fetches EN definitions from [api.dictionaryapi.dev](https://dictionaryapi.dev).
Same options as `crawlRAE.ts` (output dir defaults to `ops/crawl-output/en`).

### `yarn crawl:merge -- [files...] [options]`

Merges JSONL crawl output into `public/definitions/{locale}/{letter}_definitions.json`.
Files are read oldest-first (later entries win on conflict). Merges definitions
by their `number` field and sets `level` on the word entry if not already present.

```bash
yarn crawl:merge ops/crawl-output/es/*.jsonl --dry-run
yarn crawl:merge ops/crawl-output/en/j.jsonl --locale en --letter j
```

| Option | Description |
|---|---|
| `--dry-run` | Print what would change, write nothing |
| `--locale <es\|en>` | Only process entries for this locale |
| `--letter <l>` | Only process entries for words starting with this letter |

### `yarn crawl:check-en <inputFile> [--output <file>]`

Validates EN words against `api.dictionaryapi.dev`. Words that return HTTP 200
are written to the output file (resumable).

## Word list maintenance

### `yarn words:clean [locale] [level] [--dry-run]`

Removes invalid entries from `ops/scripts/words/{locale}/{level}_words.txt`
in-place. A valid word contains only letters (accented/ñ allowed for ES).
Also dedupes and lowercases. No args = all locales + levels.

### `yarn words:sort-by-frequency <locale> <frequencyFile> [options]`

Re-classifies words across all 3 levels using a frequency corpus
(`ops/scripts/frequency/wordfreq_{locale}.txt` — rank 1 = most common).

| Option | Description |
|---|---|
| `--beginner-limit <n>` | Rank cutoff for beginner (default `3000`) |
| `--intermediate-limit <n>` | Rank cutoff for intermediate (default `10000`) |
| `--move-unknown` | Move words not found in the corpus to `advanced` (default: leave at current level) |
| `--dry-run` | Print counts without writing files |

### `yarn words:merge <source.txt> <target.txt>`

Appends words from `source.txt` that aren't already in `target.txt`.

### `yarn words:check <locale> <targetLevel> [inputFile]`

Reads words from a file (or stdin). For each word already present in
`advanced_words.txt` but missing from `<targetLevel>_words.txt`, appends it to
the target level list.

### `yarn words:transform [locale] [level]`

Reads `ops/scripts/words/{locale}/{level}_words.txt`, sorts + dedupes, writes
100k-word chunked JSON arrays to `public/words/{locale}/`, and updates
`config/LevelConfig.ts`. Run this after any change to the `*_words.txt` files.

### `yarn words:from-book <es|en> [bookFile]`

Learns new words from book files. Runs, in order:

1. **`extractFromBook.ts`** — tokenizes the book(s), filters out anything already
   in `public/definitions/`, `not-found.txt`, any `*_words.txt`, or a previous
   `discovered_words.txt` run. New words are appended to
   `ops/crawl-output/{locale}/discovered_words.txt` (never touches the
   existing word lists or definitions).
2. **`mergeWords.ts`** — appends `discovered_words.txt` into `advanced_words.txt`.
3. **`sortByFrequency.ts`** — reclassifies all levels, so common new words land
   in `beginner`/`intermediate`.

**Single file:** pass the path as the second argument.

```
yarn words:from-book es path/to/book.txt
```

**Batch mode:** drop any number of `.txt`, `.pdf`, or `.epub` files into
`ops/books/{locale}/` and run without a second argument — all files are
processed in one pass.

```
# put your books in ops/books/es/ or ops/books/en/
yarn words:from-book es
yarn words:from-book en
```

The `ops/books/` directories are gitignored (copyrighted material stays local).

Run `yarn words:transform` afterwards to regenerate `public/words/` chunks, then
`yarn crawl:all` to fetch definitions for the newly added words.
