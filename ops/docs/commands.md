# Ops commands

Reference for the word-list and definitions pipeline. All commands run from the
repo root via `yarn <script>` or `tsx scripts/...`.

## Pipeline overview

```
ops/scripts/words/{locale}/{level}_words.txt   ──► crawler ──► ops/crawl-output/{locale}/{letter}.jsonl ──► merge ──► public/definitions/{locale}/{letter}_definitions.json
                                                                                                                              │
ops/scripts/words/{locale}/{level}_words.txt  ┐
ops/scripts/frequency/wordfreq_{locale}.txt   ├──► words:build ──► public/words/{locale}/{level}_{n}.json + config/LevelConfig.ts
public/definitions/{locale}/*.json            ┘
```

- Crawlers never write directly to `public/definitions/` — they append to JSONL
  staging files, which are then merged.
- Word lists (`*_words.txt`) are the source of truth for which words get crawled;
  the frequency file sets the level of every ranked word, the lists that of the
  unranked ones.
- After `crawl:merge`, `words:from-book` or any edit to the word lists, run
  `yarn words:audit --fix`, then `yarn words:build`.
- `ops/scripts/extractFromText.sh` is kept: a standalone column extractor
  (`awk -v col=N '{print $col}'`) with no yarn equivalent, not part of the
  pipeline.

## Definitions crawlers

### `yarn crawl:all`

Runs the full pipeline: ES (`crawlRAE.ts`) then EN (`crawlDictionary.ts`), each
through `beginner` → `intermediate` → `advanced`, merging after every level. EN
then gets a second pass with `crawlMerriamWebster.ts` over
`ops/crawl-output/en/not-found.txt`, followed by another merge.
Resumable — re-running skips words already crawled or already in
`public/definitions/`. No flags; edit `LOCALES`/`LEVELS` in
`scripts/crawlers/crawlAll.ts` to narrow scope.

If the RAE API daily quota is exhausted mid-run (`crawlRAE.ts` exits with code
`2`), ES stops for the day and the script moves on to EN. A crawler that fails
for any other reason is logged and the run continues.

### `tsx scripts/crawlers/crawlRAE.ts <wordsFile> [options]`

Fetches ES definitions from [rae-api.com](https://rae-api.com) (unofficial RAE
API). Requires `RAE_API_KEY` in `.env.local`. Free tier: 10 req/min, 100 req/day.

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
Same options as `crawlRAE.ts`, with these defaults: output dir
`ops/crawl-output/en`, `--delay` `3000-10000`, `--not-found-file`
`ops/crawl-output/en/not-found.txt`.

### `tsx scripts/crawlers/crawlMerriamWebster.ts [wordsFile] [options]`

EN second pass: fetches definitions from the Merriam-Webster Collegiate API for
words that dictionaryapi.dev did not resolve. Requires `MW_API_KEY` in
`.env.local`. `wordsFile` defaults to `ops/crawl-output/en/not-found.txt`. Same
options as `crawlDictionary.ts`; `--delay` defaults to `500-1500`. `yarn crawl:all`
runs it automatically.

### `yarn crawl:merge [files...] [options]`

Merges JSONL crawl output into `public/definitions/{locale}/{letter}_definitions.json`.
Files are read in the order given — pass them oldest-first, because later entries win on conflict. Merges definitions
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
are written to the output file (resumable). `--output` defaults to
`ops/scripts/dictionaryApiCrawler/output.txt`.

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

### `yarn words:build [--locale es|en] [--root <dir>]`

Builds the served word data (`scripts/words/buildWordData.ts`). Inputs:
`ops/scripts/words/{locale}/{level}_words.txt`, `ops/scripts/frequency/wordfreq_{locale}.txt`
(rank = 1-based line, first occurrence wins) and `public/definitions/{locale}/*_definitions.json`.

- Writes `public/words/{locale}/{level}_{n}.json` (n from 1, ≤ 100k rows each, collator order):
  `{ version: 2, locale, level, fields, rows }` — the format is documented in
  [game-conventions.md](game-conventions.md) ("Served data and IndexedDB"). A word in several
  levels gets the same row in each level file.
- Deletes every other `.json` in `public/words/{locale}/` (legacy `*_words_from_*` files, stale chunks).
- Updates `totalChunks` and `minimumPopulatedCount` (rows served per level) in `config/LevelConfig.ts`.
- Prints a report per locale: words and chunks per level, flag counts, overrides (ranked word whose list
  disagrees with its frequency band; served only in its band), definition keys in no list (not served),
  syllabify failures. Overrides and failures are reported, never fatal.
- Deterministic: a rerun on unchanged inputs changes no byte.

Exit codes: `0` ok; `1` a missing or invalid input file; `2` bad arguments. Run it after any change to
the `*_words.txt`, frequency or definition files.

### `yarn words:audit [--locale es|en] [--fix] [--report <path>] [--root <dir>]`

Audits the word lists (`ops/scripts/words/{locale}/{level}_words.txt`) and the
definitions (`public/definitions/{locale}/*_definitions.json`) of one or both
locales. Each finding is **FIX**, **DELETE** or **FLAG**:

- Check mode (no `--fix`) prints a summary per category and writes a markdown
  report. Nothing is changed.
- `--fix` applies every FIX/DELETE (a deleted word goes from the lists **and**
  its definition key), re-audits and re-applies until stable (at most
  `MAX_FIX_PASSES` = 3 fix passes), and rewrites only the changed
  files: definitions as `JSON.stringify(data, null, 4)` without a trailing
  newline, lists one word per line in their original order. FLAGs are never
  applied; they are the backlog in the report.

| Flag | Default | Meaning |
|---|---|---|
| `--locale es\|en` | both | Audit one locale only. |
| `--fix` | off | Apply FIX/DELETE findings. |
| `--report <path>` | `ops/crawl-output/audit/{locale}-report.md` (gitignored) | Report path; needs `--locale`. |
| `--root <dir>` | cwd | Repo root to read and write (tests use a fixture copy). |

Exit codes: `0` clean, or `--fix` left no FIX/DELETE; `1` check mode found
FIX/DELETE findings, or `--fix` still has FIX/DELETE after 3 passes (the files
are written anyway; run `--fix` again); `2` bad arguments or I/O error (e.g. a missing list or letter file).

The report has the before/after table per category, a deterministic 20-item
sample per category, the full list of deleted offensive words and the FLAG
backlog.

**Word categories** (run once over the union of list words and definition keys;
the first match wins):

| Id | Category | Action |
|---|---|---|
| W1 | Encoding (not NFC, mojibake) | FIX, DELETE if not repairable |
| W2 | Uppercase | FIX to lowercase (merged into an existing form) |
| W3 | Charset (es `[a-záéíóúüñ]`, en `[a-z]`) | DELETE |
| W4 | Single letter (except es `a e o u y`, en `a i`) | DELETE |
| W5 | Abbreviation: no vowel, en entry whose senses are all abbreviations, or `abbreviations_{locale}.txt` | DELETE |
| W6 | Roman numeral | DELETE |
| W7 | Three identical letters in a row | DELETE |
| W8 | Proper noun (`proper_nouns_{locale}.txt`) | DELETE |
| W9 | Foreign (es, `foreign_es.txt`); foreign-looking pattern | DELETE; FLAG |
| W10 | Offensive (`offensive_{locale}.txt`) | DELETE |
| W11 | HTML/XML artifact (`html_xml_blocklist.txt` + `html_xml_blocklist_{locale}.txt`) | DELETE |
| W12 | Accent-only duplicate definition keys | FLAG |
| W13 | Same word in several levels | FLAG |
| W14 | Definition key in no list | FLAG |
| W15 | Duplicate line inside one list | FIX |

**Sense and type categories** (definitions only; a word left with no sense loses
its definition key, senses are renumbered 1..n):

| Id | Category | Action |
|---|---|---|
| D1 | Empty sense | DELETE |
| D2 | Markup: HTML stripped and decoded; LaTeX/wiki markup | FIX; DELETE |
| D3 | Cross-reference only (es `V. x.` / `Ver x.`, en `See x.`) | DELETE |
| D3b | es single-word sense | FLAG |
| D4 | Form-of without meaning (`Plural of x.`, `Alternative spelling of x.`…) | DELETE |
| D5 | Truncated (ends in `,` `;` `:`): cut or end with `.`; unbalanced parens | FIX (DELETE if no text left); FLAG |
| D6 | Duplicate sense text in one word | DELETE the later one |
| D7 | en `proper noun` sense | DELETE |
| D8 | Extra whitespace | FIX |
| T1 | Type outside the closed list: mapped (es register qualifiers and subclasses go to `type_extra`) | FIX; FLAG if unmapped |
| T2 | es English label mapped to a generic type (`type_extra` gets `sin verificar`) | FLAG |
| T3 | Missing type | FLAG |

**List files** in `ops/scripts/words/` (one word per line, `#` comments; a
missing file counts as empty):

| File | Use |
|---|---|
| `allowlist_{locale}.txt` | Real words exempt from W4–W7 and from every list rule (e.g. `version`, `hmm`, `mi`). |
| `offensive_{locale}.txt` | Slurs and words whose main meaning is vulgar (W10). |
| `proper_nouns_{locale}.txt` | Names of people, places, brands (W8). Never a word with a definition key. |
| `foreign_es.txt` | Clear non-Spanish words (W9). DLE loanwords stay. |
| `abbreviations_{locale}.txt` | Abbreviations that contain a vowel (W5). |
| `html_xml_blocklist.txt`, `html_xml_blocklist_{locale}.txt` | Markup and web artifacts (W11); also used by `words:from-book`. |

**When to run:** after `crawl:merge`, `words:from-book` or any edit to the word
lists or the files above: `yarn words:audit --fix`, then `yarn words:build`.
`tests/scripts/words/auditRealData.test.ts` fails while the real data has
pending FIX/DELETE findings.

### `yarn words:level-counts [--out <json>] [--baseline <json>] [--strict]`

Counts, per locale, level and game, the words each game can draw from the served
data (the v2 chunks in `public/words` and `public/definitions`), building every
pool through `matchesQuery` with the games' own exported queries and filters
(length windows, prefetch groups, the wordChain seed, `LETTERS_WITHOUT_DEFINITIONS`,
clue rules). Writes a flat JSON map
`"<locale>/<level>/<game>[/<part>]": { count, min, hash }` (default
`ops/crawl-output/audit/level-counts.json`); `hash` is the first 16 hex characters
of the sha256 of the sorted pool.

With `--baseline <json>` it prints a before/after table and exits `1` when a pool
that met its minimum in the baseline is now below it. Pools already below the
minimum in the baseline are listed, not failed. With `--strict` (needs
`--baseline`, else exit `2`) it also lists every pool added, removed or whose
count or hash changed, and exits `1` if there is any. The spellingBee count is an
upper bound (the game picks one random eligible sense per word).

`tests/fixtures/pools/phase2-baseline.json` is the snapshot frozen from the legacy
data before the v2 data layer; `tests/scripts/words/poolSnapshot.test.ts` asserts
the current pools still match it.

Use it around a data clean-up: save a baseline first, clean, build, then
compare. If a definitions letter ends with 0 usable words, add it to
`LETTERS_WITHOUT_DEFINITIONS` in `config/DefinitionConfig.ts`.

### `yarn words:from-book <es|en> [bookFile]`

Learns new words from book files. Runs, in order:

1. **`extractFromBook.ts`** — tokenizes the book(s), filters out anything already
   in `public/definitions/`, `not-found.txt`, any `*_words.txt`, the blocklists
   (`ops/scripts/words/html_xml_blocklist.txt` + `html_xml_blocklist_{locale}.txt`),
   the audit block lists (`offensive_{locale}.txt`, `proper_nouns_{locale}.txt`,
   `foreign_es.txt` for es),
   or a previous `discovered_words.txt` run. New words are appended to
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

Run `yarn words:audit --fix` and then `yarn words:build` afterwards to clean the
lists and regenerate `public/words/` chunks, then `yarn crawl:all` to fetch
definitions for the newly added words.
