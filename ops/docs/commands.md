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

es.wiktionary dump (.xml.bz2) ──► words:import-wiktionary ──► public/definitions/es/{letter}_definitions[_advanced].json + es/{level}_words.txt
                                   (then words:audit --locale es --fix ──► words:build ──► words:level-counts)
```

- Crawlers never write directly to `public/definitions/` — they append to JSONL
  staging files, which are then merged. The one exception is
  `words:import-wiktionary`, which merges es.wiktionary lemmas straight into
  `public/definitions/es/` (RAE keys are never touched).
- **Definition file split (es):** an entry with `source: "wiktionary"` and
  `level: "advanced"` lives in `public/definitions/es/{letter}_definitions_advanced.json`;
  every other entry stays in `{letter}_definitions.json` (same JSON format; a
  missing advanced file is empty). The rule is `isAdvancedOnly` in
  `scripts/words/wordAudit.ts`. Readers merge both files per letter with
  `loadLetterFiles` (a key in both keeps the main copy)
  (`loadLocaleInput` → audit / build / recrawl-es / import, `words:level-counts`,
  `crawl:merge`, the crawlers' `--skip-existing`); writers (`words:audit --fix`,
  `crawl:merge`, `words:import-wiktionary`) write each entry to its file, the
  advanced file only when it has entries or already exists, and before the main
  file. An RAE merge drops `source`, so the word moves to the main file.
- Word lists (`*_words.txt`) are the source of truth for which words get crawled;
  the frequency file sets the level of every ranked word, the lists that of the
  unranked ones.
- After `crawl:merge`, `words:from-book` or any edit to the word lists, run
  `yarn words:audit --fix`, then `yarn words:build`.
- `ops/scripts/extractFromText.sh` is kept: a standalone column extractor
  (`awk -v col=N '{print $col}'`) with no yarn equivalent, not part of the
  pipeline.

## Smoke test of the games

### `yarn smoke [--locale es|en] [--base <url>]`

Plays the built site like a person (`scripts/smoke/playAllGames.mjs`, puppeteer-core on the machine's Chrome or
Chromium): per locale, in a fresh profile, "Cargar niveles" / "Load levels" loads every level, then each game page
under `out/juegos/` and `out/en/games/` is opened, its start button (`gamePlay`) clicked, and the round checked: no
page error and the game left its start screen. Prints a PASS/FAIL line per game and exits 1 if any fails.

- Run it after `yarn build` (it serves `./out` itself), or point it at a running server with `--base`.
- Browser: `CHROME_PATH`, else `PUPPETEER_EXECUTABLE_PATH`, else the usual install paths (macOS Chrome, Linux
  google-chrome / chromium).
- Takes about a minute (the first full load of es is ~40 s). The PR CI (`.github/workflows/feature.yml`) runs it after
  the build, so a change that breaks a game fails the PR.
- A new game is picked up by its folder in `out/`; a game whose start button is not `gamePlay` needs its label added
  to `LOCALES` in the script.

### `yarn smoke:mobile [--locale es|en] [--game <id>] [--shots <dir> --tag <name>]`

Mobile audit of the built site (`scripts/smoke/mobileAudit.mjs`): every game page in `out/juegos/` and
`out/en/games/`, emulated as a touch phone (dpr 3) at 360×740, 375×667 and 390×844, plus 740×360, 667×375 and
844×390 for the timed games. Each page is checked on its start screen and after Play:

- no horizontal page scroll (against the emulated width, not `innerWidth`);
- every visible control in the header, main, footer and cookie banner is inside the screen, at least 44×44 px and not
  covered by another element. Exempt: inline links inside running text, and crossword cells (at least 24×24 px).

Two more screens:

- `keyboard` (portrait, games with a text field): the field is focused and the viewport halved (the on-screen
  keyboard); the field, the game's timer and wordChain's breadcrumb and prompt must stay on screen, below the fixed
  header and uncovered.
- `end` (timed games): the timers are sped up 200× until the round ends; the end screen is audited like the others,
  then its Play again button must start a new round.

The cookie banner is audited on the first game of each locale, then declined (no analytics). Prints a PASS/FAIL line
per locale × game × viewport × screen with the offending selectors, and exits 1 on any FAIL (2 without a build or a
browser). Takes about 11 minutes. `--shots` saves portrait screenshots as `<locale>-<gameId>-<width>-<tag>.png`
(after Play) and `<locale>-<gameId>-<width>-start-<tag>.png`. Not in CI.

### `yarn smoke:install`

Install (PWA) check of the built site (`scripts/smoke/installCheck.mjs`):

- es pages link `/site.webmanifest` and en pages `/site-en.webmanifest`;
- Chrome reports no installability errors on `/` and `/en/`;
- the footer's install button works: a synthetic `beforeinstallprompt` on Android calls `prompt()`, iPhone shows the
  Add to Home Screen steps, and the installed app shows no button. Chromium cannot emulate `display-mode:
  standalone` (no media emulation for it, no CDP `PWA` domain), so the script makes `matchMedia` report it;
- in the installed app a spellTower round plays to its end and the header logo goes home.

Exits 1 on any FAIL, 2 without a build or a browser. Not in CI.

### `yarn icons:build`

Renders `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (art inside the 80 % safe zone) and
`apple-touch-icon.png` from inline SVG with Chrome/Chromium (`scripts/icons/buildIcons.mjs`). Run it after changing
the icon design, and commit the PNGs.

The browser scripts share `scripts/smoke/lib.mjs` (browser finder, `./out` server, level loading, Play button).

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
API). Reads `RAE_API_KEY` from `.env.local` (optional, see below). Free tier: 10 req/min, 100 req/day.

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

`RAE_API_KEY` is optional: without it the crawler warns and uses the anonymous tier (same limits).

**Type mapping** (every run, including `crawl:all`): rae-api returns English categories, so the
crawler writes the Spanish type from the closed list (`ES_TYPES` in `scripts/words/wordAudit.ts`):

| Source, in order | Result |
|---|---|
| `category_labels[0]` (`sustantivo` → `nombre`), normalised like the audit's T1 | e.g. `sustantivo femenino` → `nombre femenino`, `verbo copulativo`; a bare `sustantivo`/`verbo` falls through |
| `category` + `gender` (noun) / `verb_category` (verb); English, Spanish or RAE abbreviation (`m`, `f`, `m y f`, `tr`, `intr`, `prnl`, `copulat`, `impers`, `aux`) | `nombre masculino`, `verbo transitivo`, `adjetivo`… |
| noun/verb with no usable gender or verb class | `nombre`/`verbo` + `type_extra` `sin verificar` (T2 FLAG); the raw value is logged once per run |
| `usage` | `obsolete`/`outdated` → `desusado`, `rare` → `poco usado`, `colloquial` → `coloquial`, otherwise nothing; joined with `, ` before the marker |

Only `usage` is kept: RAE domain/register labels (e.g. `América`, `Usado ante sustantivo`) are not written to
`type_extra`, so a replaced word loses them.

Sub-meanings (`sub_meaning` a/b/c) are not flattened.

### `yarn crawl:recrawl-es [--check] [--limit <n>] [--root <dir>]`

Re-crawls es words with weak definitions from RAE and **replaces** their senses (JUE-0009 Phase 3).
Run it once a day until `--check` shows 0 pending.

- **Queue** = C1 ∪ C2: C1 every sense is a single word (D3b) or a form-of reference; C2 a sense has an
  empty type or `sin verificar` in `type_extra`. C3 (more than 6 senses) is printed for information only:
  those words already have Spanish types and labels, a re-crawl would drop the labels and often adds
  sub-senses, so the audit's D9 sense order handles them.
- **Order:** frequency rank (`ops/scripts/frequency/wordfreq_es.txt`), unranked words last in Spanish
  alphabetical order. At most `--limit` words per run (1–100, default 100: the RAE daily quota).
- **Files:** `ops/crawl-output/es-recrawl/` (gitignored) holds `queue.txt`, the crawler JSONL and
  `not-found.txt`. Progress is tracked in git at `ops/crawl-progress/es-recrawl.json`:
  `{ "version": 1, "done": { "<word>": { "status": "replaced" | "not-found", "at": "YYYY-MM-DD" } } }`.
- **Resume:** words already in the JSONL or the not-found file are not re-fetched; leftover JSONL
  entries from an interrupted run are merged on the next run. A word whose fetch failed is not recorded,
  so a later run retries it. A not-found word keeps its current entry.
- **Merge:** replace mode (`crawl:merge --replace`), only for words already in `public/definitions/es/`.
- `--check` prints C1/C2/C3, the queue, done words by status, pending and the next 20, and writes nothing.

| Exit | Meaning |
|---|---|
| `0` | Check done, or run finished (also "nothing to re-crawl") |
| `1` | I/O failure, invalid progress file, or the crawler failed (no merge; saved progress kept) |
| `2` | Bad arguments, or the RAE daily quota ran out (merge and progress are written first) |

Then, as after any crawl: `yarn words:audit --fix`, `yarn words:build`.

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

Merges JSONL crawl output into `public/definitions/{locale}/{letter}_definitions.json`
(reads the letter's `_advanced` file too and writes each word to its file by the split rule above).
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
| `--replace` | Replace a word's `definitions` wholesale instead of merging by `number`; `level` is kept |

**Existing es words: always merge with `--replace`.** The audit's D9 renumbers es senses away from RAE order, so a
default merge (by `number`) of a fresh RAE crawl would overwrite the wrong senses.

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
- Writes `config/WordsDataVersion.ts`: the hash of every served chunk. Browsers with another stamp drop their
  stored words and load the levels again, so commit it with the chunks (`wordDataSync.test.ts` checks it).
- Prints a report per locale: words and chunks per level, flag counts, overrides (ranked word whose list
  disagrees with its frequency band; served only in its band), definition keys in no list (not served),
  syllabify failures. Overrides and failures are reported, never fatal.
- Deterministic: a rerun on unchanged inputs changes no byte.

- Marks every word of `proper_nouns_{locale}.txt` with the `isProperNoun` flag (proper nouns stay in the
  levels; a game excludes them with `exclude: { isProperNoun: true }`).
- Fails before writing anything when a level list holds a word of `offensive_{locale}.txt` or the
  `html_xml_blocklist*.txt` files (allowlisted words excepted): run `yarn words:audit --fix` first.

Exit codes: `0` ok; `1` a missing or invalid input file, or a blocklisted word in a level list; `2` bad arguments. Run it after any change to
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
| W8 | Proper noun (`proper_nouns_{locale}.txt`) | none: kept, `words:build` marks it `isProperNoun` |
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
| D9 | es sense order: `desusado` senses, RAE letter-name senses (`… letra del abecedario español …`, `Sonido que representa la letra …`) and one-word noun senses pointing to a word outside the beginner list (`enebro.`, `cafeto.`) go after the others, stable; RAE order is kept otherwise, so sense 1 is the common meaning games show first. `poco usado`, a lone `desusada`, legacy `obsolete`/`rare` and one-word verb/adjective senses (`donar.`, `quieto.`) or ones pointing to a beginner word (`felicidad.`) stay: they also tag core senses | FIX |
| T1 | Type outside the closed list: mapped (es register qualifiers and subclasses go to `type_extra`) | FIX; FLAG if unmapped |
| T2 | es English label mapped to a generic type (`type_extra` gets `sin verificar`) | FLAG |
| T3 | Missing type | FLAG |

**List files** in `ops/scripts/words/` (one word per line, `#` comments; a
missing file counts as empty):

| File | Use |
|---|---|
| `allowlist_{locale}.txt` | Real words exempt from W4–W7 and from every list rule (e.g. `version`, `hmm`, `mi`). |
| `offensive_{locale}.txt` | Slurs, words whose main meaning is vulgar, and words whose common use is vulgar or adult in a family word game (W10; `words:build` fails on them). |
| `proper_nouns_{locale}.txt` | Names of people, places, organisations, brands whose usual use is the name, even with a rare common sense in the repo (`japan` = varnish, `corea` = chorea) (W8). They stay in the levels, keep their senses and get the `isProperNoun` flag. Never a demonym, nationality, language or religion word (en), never a name whose usual use is a common word (`china`, `rosa`). |
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

### `yarn words:import-wiktionary [--dump <path>] [--letter <l>] [--dry-run] [--root <dir>]`

Imports Spanish lemmas from the es.wiktionary dump into `public/definitions/es/`
(`scripts/words/importWiktionary.ts`). Download the dump first into the gitignored
cache (never commit it):

```
curl -L -o ops/crawl-output/wiktionary/eswiktionary-latest-pages-articles.xml.bz2 \
  https://dumps.wikimedia.org/eswiktionary/latest/eswiktionary-latest-pages-articles.xml.bz2
```

For a reproducible run use the dated dump:
`https://dumps.wikimedia.org/eswiktionary/<YYYYMMDD>/eswiktionary-<YYYYMMDD>-pages-articles.xml.bz2`.
The report records the latest revision timestamp found in the dump.

- Streams the dump (`.bz2` through `bzcat`, `.xml` read directly); no network.
- Keeps ns-0 pages whose title matches `^[a-záéíóúüñ]+$`, reads the lemma POS
  sections of `{{lengua|es}}` (every `Forma …` section is ignored), maps each POS
  onto the closed es types, cleans each sense into plain text and runs the
  `words:audit` sense and word rules on it. Form-of and pointer senses
  (`… (uso pronominal de …)`), senses with an unresolved template and senses
  labelled vulgar / offensive / derogatory (or with the `sexualidad` / `sexo`
  domain) are dropped; an entry whose unlabelled sense repeats the gloss of an
  offensive-labelled sense ("Homosexual." twice, once `despectivo`) is dropped
  whole. Words in `offensive_es.txt` are never imported (W10). Digit-only `<sup>`/`<sub>` and `{{-sup}}`/`{{-sub}}` become
  Unicode super/subscripts.
- Labels go to `type_extra`. "Others as-is" for `{{uso|…}}` is read as: the
  usage codes of es.wiktionary `Módulo:contexto/uso` (`utcs`, `utcp`, `umep`…)
  are written in RAE wording (`Usado también como sustantivo`), aliases map to
  their label (`raro` → `poco usado`, `vulg` → `vulgar`), disused labels become
  `desusado`, an unknown code-like value is dropped, and any other value is
  kept as written.
- **RAE wins:** a key without `source` is never touched. A new key is written as
  `{ "level", "source": "wiktionary", "definitions" }`; an existing
  `source: "wiktionary"` key is refreshed, or removed when it no longer parses.
  A later RAE crawl (`crawl:merge` / `crawl:recrawl-es`) replaces every sense of a
  Wiktionary entry and drops its `source`. `crawl:all` (`--skip-existing`) skips
  Wiktionary keys like any key with definitions; to move one to RAE, crawl it
  explicitly with `crawlRAE.ts` (no `--skip-existing`) and `crawl:merge`, or let
  `crawl:recrawl-es` queue it when it is a candidate.
- A re-import that removes a stale Wiktionary key leaves its word in the level
  list, like any listed word without definitions (most list words have none).
- The entry `level` is always `advanced`, whatever the word's frequency or list
  (lists of listed words are never changed): nobody has reviewed the Wiktionary
  senses, and a rare homograph of a common form (`partes`, `odia`, `fernando`)
  must not reach the lower-level definition games. The definition games use the
  entry `level` to keep Wiktionary entries out of beginner and intermediate, and
  every Wiktionary entry goes to `{letter}_definitions_advanced.json` (split rule
  above). A new word in no level list is appended to the advanced list only;
  a new word ranked in the beginner or intermediate frequency band goes to no
  list (`words:build` would serve it at its band; audit W14 flags it) until
  someone reviews it.
- Sense cleanup also strips references to another page's numbered sense
  (`pato₁`, `aforar₁₋₂`, `atmósfera(1)`), keeping chemical formulas (`Fe³⁺`,
  `Ca₃`) and units (`m²`, `cm³`); senses in the `Wiki` domain (wiki jargon) are
  dropped; the `lgbt` domain is written `LGBT`.
- Writes the report to `ops/crawl-output/wiktionary/es-import-report.md`
  (per letter before → after, skips by reason, list additions, a 20-entry sample
  per letter, top unresolved templates and unmapped POS headers).

| Flag | Meaning |
|---|---|
| `--dump <path>` | Dump file (default `ops/crawl-output/wiktionary/eswiktionary-latest-pages-articles.xml.bz2`) |
| `--letter <l>` | Only that definition letter (a–z) |
| `--dry-run` | Report only; writes no data file |
| `--root <dir>` | Repo root (tests use a fixture copy) |

Exit codes: `0` ok; `1` I/O failure, `bzcat` failure or a missing data file
(unlike `words:audit`, which exits `2` for a missing data file); `2` bad
arguments or a missing dump (prints the `curl` command).

Pipeline order: `yarn words:import-wiktionary` → `yarn words:audit --locale es --fix`
→ `yarn words:audit --locale es` (must exit 0) → `yarn words:build` →
`yarn words:level-counts --baseline <before.json>`. Commit each changed letter
(`public/definitions/es/<letter>_definitions.json` and `<letter>_definitions_advanced.json`
together) in its own commit, then the
level-list additions, then the `words:build` output.

**Licence and attribution.** Entries with `source: "wiktionary"` come from
[Wikcionario](https://es.wiktionary.org) (its contributors), licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), adapted: markup
removed, senses filtered and relabelled. Only those entries are CC BY-SA 4.0 (see
`public/definitions/es/LICENSE`); the RAE entries in the same files are not. Any
redistribution of the Wiktionary entries must keep the attribution and the licence.

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
