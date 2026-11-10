# Game conventions — stack, file pattern, data API, tests

Conventions every new game assumes. Read this before adding or editing a game. Git and
workflow rules live in the global jon-ai rules; the repo-specific rules (yarn, `next-env.d.ts`)
are in the [index](README.md#reglas-del-repo) — not repeated here. This doc is the
**architecture/data** reference.

## Stack

- Next.js 15, App Router, **static export** (`output: 'export'` in `next.config.js`). No `src/` — everything at repo root.
- TypeScript, SCSS (plain `.scss` in `styles/`, imported per-page; no CSS Modules).
- react-intl for general UI strings (`FormattedMessage`); game-specific copy in `config/translations/Games.ts`.
- State: per-game hook owns ALL gameplay logic; `UI.tsx` is a pure render layer receiving the hook's return spread as props.
- Bilingual contract: every user-facing string must exist in both `es` and `en` catalogs (ES-only games are the documented exception, below).

## Per-game file pattern (copy `spellTower` as reference)

| File | Purpose |
|---|---|
| `games/<gameId>/use<GameId>.tsx` | `'use client'` hook with all state + logic |
| `games/<gameId>/UI.tsx` | `'use client'` render component, props = gameConfig + hook output |
| `app/juegos/<spanish-slug>/page.tsx` | ES route: `'use client'`, calls hook + `createGamesConfig(locale, '<gameId>')`, wraps in `MainLayout`, imports the game's SCSS |
| `app/en/games/<english-slug>/page.tsx` | EN route, identical component (locale from URL via `IntlProviderClient`) |
| `styles/<GameId>.scss` | game styles (PascalCase file name, e.g. `SpellTower.scss`) |
| `public/images/games/<gameId>.png` | card/hero image (placeholder copy if no asset yet) |

Page template (exact shape used by all existing games — see `app/juegos/la-torre-de-la-ortografia/page.tsx`):

```tsx
'use client';
import React from 'react';
import GameUI from '@games/<gameId>/UI';
import use<GameId> from '@games/<gameId>/use<GameId>';
import { createGamesConfig } from '@hooks/useGamesConfig';
import MainLayout from '@layouts/MainLayout';
import { useWordsContext } from '@store/WordsContext';
import '@styles/<GameId>.scss';

const <GameId>Page: React.FC = () => {
    const { locale } = useWordsContext();
    const gameLogic = use<GameId>();
    const gameConfig = createGamesConfig(locale, '<gameId>');
    return <MainLayout>{gameConfig && <GameUI gameConfig={gameConfig} {...gameLogic} />}</MainLayout>;
};
export default <GameId>Page;
```

## Registration in `config/translations/Games.ts`

1. `GamesRoutes`: add `<gameId>: '/juegos/<spanish-slug>'` under `es` and `<gameId>: '/en/games/<english-slug>'` under `en`.
2. `GamesTranslations`: append a `GamePreConfig`: `id`, `imgSrc: '/images/games/<gameId>.png'`, `title`, `description`, `subtitle`, `gameRules` (`gameGoal`, `howToPlay[]`, `additionalRules[]`, `tips[]`) — ALL with `en` + `es` variants.

The home page game list is generated from `GamesTranslations` via `createAllGamesConfig` (`hooks/useGamesConfig.ts`) — no extra registration needed.

## ES-only games (accentFixer, syllableSplitter)

Mechanically Spanish-only. The mechanism already exists — do not re-implement it:
`GamePreConfig.availableLocales?: string[]` (`models/interfaces.ts`); in `hooks/useGamesConfig.ts`,
`createAllGamesConfig` hides the game in other locales and `createGamesConfig` returns `null` (the
page's `gameConfig &&` guards direct URL access).

For a new ES-only game:
- Set `availableLocales: ['es']` on its `GamePreConfig` entry.
- Create NO `app/en/...` route.
- Still provide `en` strings in the catalog (type requires them; keeps `tests/translations/keyParity.test.ts` passing).
- Point the `GamesRoutes.en` entry to the ES route so the type stays total; it is unreachable from UI due to the filter.

## Data layer API (use these, do not reinvent)

Games ask for words with a **query object**, never with positional arguments or their own filters.

### Word model (`WordRecord`, `models/types.ts`)

One record per word and locale, derived by the pure `utils/WordRecord.ts` (shared by the generator, the
client hydrator, `level-counts` and the tests):

| Field | Meaning |
|---|---|
| `word`, `locale` | The word as served, its locale. |
| `level` | Computed level (see formula). Informational; games filter on `levels`. |
| `levels` | Pool membership: `[level]` for a ranked word, every source list containing it for an unranked one. |
| `freqRank` | 1-based line in `ops/scripts/frequency/wordfreq_<locale>.txt`, `null` when not in the corpus. |
| `length` | `word.length` (UTF-16 units, as the legacy filters). |
| `syllables`, `stressedSyllable` | es only: `syllabify(word).length` and the 0-based stressed syllable (acute accent; else vowel/n/s ending → penultimate, else last; monosyllable 0). `null` for en. |
| `firstLetter`, `lastLetter` | Lowercase, accent stripped (`ü` → `u`), `ñ` kept. |
| `letters` | The word's characters sorted. |
| `pos`, `senseCount` | Type of the first sense and number of senses in `public/definitions` (`null` / 0 without definitions). Senses are not stored; read them with `getDefinition(s)`. |
| `source` | `'rae'` for an es word with senses; `null` otherwise. For en `null` means "unknown" (filled later). |
| flags (0/1) | `hasAccent` (`[áéíóú]`), `hasEnye`, `hasDieresis`, `hasTl`, `hasDiphthong`, `hasHiatus` (`vowelFeatures` in `utils/SyllableSplitter.ts`), `isPlural`, `isVerbForm` (approximate suffix heuristics against the locale word set; no game uses them yet). |

Flag bit order in chunks is `WORD_FLAGS` (the order above). `isProperNoun` is a reserved name for a
future flag; do not reuse it for something else.

### Level formula (`computeLevel`)

- Ranked word: `freqRank ≤ LEVEL_BANDS[locale].beginner` → beginner, `≤ intermediate` → intermediate,
  else advanced. `LEVEL_BANDS` (`config/LevelConfig.ts`, 3000 / 10000 for es and en) is provisional
  until the calibration of JUE-0017.
- Unranked word: the lowest source list (`ops/scripts/words/<locale>/<level>_words.txt`) that contains
  it, and `levels` keeps every list containing it. No rank and no list → advanced.
- Keeping the legacy list membership for unranked words is a deliberate, temporary departure from
  "levels are computed, not hand-curated": Phase 2 must not change any game pool. JUE-0017/0018 retire it.
- `words:build` reports overrides (a ranked word whose list disagrees with its band); there are 0 today.

### Query API (`@services/WordsService`)

`WordFilter = { level?, minLen?, maxLen?, exclude?: { <flag>: true }, minSyllables? }`;
`WordQuery = WordFilter & { locale, level, count }` (`level` required). Matching is the pure `matchesQuery` in
`utils/WordQuery.ts`: `level` is membership in `record.levels`; `minLen`/`maxLen` are inclusive with no
implicit minimum; `exclude` rejects records whose flag is 1; `minSyllables` needs a known count.

- `getWords(query, setError?)` → `string[]` — uniform sample without replacement of `min(count, matches)`
  words. Populates the level first when IndexedDB does not hold its last served position
  (`checkIfPopulated`, see "Populated check"). Missing or invalid level → `setError(Error('Invalid level specified'))` and `[]`.
  `getWords({ locale, level, count: 150, minLen: 4 }, setError)`
- `getSessionWords(key, sessionSize, query, setError, refetchThreshold?)` → `string[]` — draws N words
  from a persistent localStorage pool and refetches in the background with the same query (spellTower,
  wordFinder, accentFixer, letterMatcher, syllableSplitter). Requires a `StorageKey`.
  `getSessionWords(StorageService.WORDS_FINDER, 10, { locale, level, count: 60, minLen: 3, maxLen: 4 }, setError, 20)`
- `getWordRecords(words, locale)` → `WordRecord[]` in input order, unknown words dropped — for filters on
  record fields after a draw (syllableSplitter re-applies `SYLLABLE_QUERY` + `isPlayable`).
- `getFullWordSet(locale, setError?, setLoadingProgress?)` → `Set<string>` — every word of the locale,
  to validate words/variants. Populates IndexedDB on first call (slow first time → show loading UI, see
  spellTower's `isLoadingWords` + `setLoadingProgress`).
- `getDefinitions({ locale, firstLetter, minSenses?, minLen? })` → the letter file
  (`/definitions/<locale>/<letter>_definitions.json`, `Record<word, WordEntry>`) filtered by sense count
  and character length (`filterDefinitions`), `null` when it cannot be fetched (definitionMaster,
  spellingBee, crossWordPuzzle).
- `getDefinition(word, locale)` → the word's `WordEntry` from its base-letter file (`ñ` → `n`), or `null`.

Static game queries live in the game's `config.ts` as `WordFilter` objects (`WORD_LENGTH_BY_LEVEL`,
`LEVEL_FETCH_OPTIONS`, `SYLLABLE_WINDOW` / `SYLLABLE_QUERY`, `SEED_QUERY`), and `WORD_GROUP_FETCH_CONFIG`
(`config/WordGroupConfig.ts`) holds `{ key, count, query }` per prefetched group (`fetchConfig(key)`
returns one). `words:level-counts` builds every pool from these same objects, so a change shows up there.

### Served data and IndexedDB

- `yarn words:build` writes `public/words/<locale>/<level>_<n>.json`:
  `{ version: 2, locale, level, fields, rows }`, fields `word, freqRank, levels, flags, syllables,
  stressedSyllable, pos, senseCount, source`; `levels` and `flags` are bitmasks (beginner 1,
  intermediate 2, advanced 4); trailing null/0 fields are trimmed; the remaining fields are recomputed
  by `hydrateRow`. A word in several levels has the same row in each level file.
- Chunking is per locale + level (≤ 100k rows), not per letter: populating a level needs every letter
  anyway (sampling and the full word set), and per-letter files cost more for the same rows (es beginner
  25 files / 35.0 KB gz vs 1 file / 27.3 KB gz; es advanced 27 files / 2.93 MB gz vs 7 files / 2.93 MB gz;
  en beginner 25 files / 28.2 KB gz vs 1 / 22.1 KB gz). The beginner level stays a single ~140 KB fetch.
- IndexedDB `jueletrado-db` version 2: two stores per locale. `words_<locale>` (keyPath `word`, no
  index) holds `{ word, row }`: the key and the served chunk row (levels in its mask);
  `getRecords` / `getWordRecords` hydrate it back to a full `WordRecord` (`hydrateRow`), so the cheap
  fields are not stored. `positions_<locale>` (out-of-line keys) keeps each served level file as its words
  in order at `[level, start]` (`start` = the file's first position, a multiple of `WORD_CHUNK_ROWS`,
  100,000). `putChunk` writes each word once into the words store, in transactions of 10,000 rows (one
  transaction per 100k-row chunk took 70–117 s and sometimes hit `QuotaExceededError`), then the file's
  word list in one put, last. A first load is one put per word, as in v1 (the earlier `[level, i]` → word
  layout was two, the cause of the ~2.5× first populate). The
  spec's five indexes (`level`, `length`, `firstLetter`, `freqRank`, `hasTl`) were dropped before
  shipping because QA measured them (with full records) at 2.8× the v1 cold load and 218 MB for es;
  a multiEntry `levels` index followed them because Chromium walks an index cursor (`advance`) and a
  range count linearly: QA measured advanced-level draws at 6–60× slower than v1's `get(randomKey)`.
  Measured cost of the earlier `[level, i]` layout (QA, Chromium, fresh profile, full es populate): first
  full populate ~2.5× v1 (~470 s vs ~183 s) and ~1.8× the storage (~75 MB vs ~42 MB); the per-file word
  lists halve the puts of that populate. Add an index back only together with a query that uses it. The full word set reads the words store
  keys. The upgrade from v1 deletes the `words_level_*` stores; while a tab still holding v1 blocks it,
  `initDB` waits instead of failing, `dbService.onBlockedChange` sets `WordsContext.dbBlocked`, and the
  loading banner / screen ask to close that tab (`dbUpgradeBlocked`); the page goes on once it closes.
- Populated check: a level is populated when the level file holding its last served position
  (`minimumPopulatedCount - 1`) is stored in full (one keyed `get` of `[level, start]`, cached per locale +
  level + count). Populate stores the chunks in order, each file's word list last, and stops at the first
  failing one.
- Sampling: a level draw takes a uniform sample without replacement of the served positions
  `[0, minimumPopulatedCount)` (lazy Fisher–Yates over a Map of swapped indices), reads them in
  batches of 256 (`getWordsAt`: each position's word from its level file, read once and kept in memory
  until the stores change, then the records by word) and keeps the matches until
  `count` are found or the positions run out. Cost grows with `count / match rate`: today's queries
  match most words, but a query matching fewer than `count` words reads every position of the level
  (~2,600 batches on es advanced), so keep game queries dense.
- `StorageService.WORDS_DATA_VERSION` (persistent): the stamp `<chunk format>:<hash of the served chunks>`
  (`config/WordsDataVersion.ts`, written by `yarn words:build`; `wordDataSync.test.ts` fails if it is stale).
  `WordsContext` calls `migrateWordsData()` on hydrate: when the stored stamp differs (the v1 layout, or
  chunks changed since they were loaded) it clears `LEVELS_POPULATED`, the word queues (`WORD_GROUP_KEYS`)
  and the IndexedDB word stores (`clearWordStores`, behind the DB lock so loads wait for it), keeps every
  setting (locale, level, daily word, best scores), and writes the new stamp only once the stores are empty.

From `@store/WordsContext` (via `useWordsContext()`): `{ locale, gameLevel, error, setError, setLoading, setLoadingProgress }`. `gameLevel` ∈ `'beginner' | 'intermediate' | 'advanced'` (`config/LevelConfig.ts`).

### Other rules

New storage keys: add to the `StorageKey` union AND the static map in `store/StorageService.ts`. If the game's word pool should be prefetched on level selection, also append to `WORD_GROUP_FETCH_CONFIG` (`config/WordGroupConfig.ts`) and `WORD_GROUP_KEYS` in `WordsService.ts`. Keys in `WORD_GROUP_KEYS` are wiped by `clearWordGroupCaches()` — never put data that must persist (e.g. best scores) there.

Word-processing utils:
- `utils/WordGameProcessor.ts` — `processWord(word)` (misspelled variants via `config/ChangeRules.ts`), `processWordWithAccent(word)` (accent variants), `filterWordsByLetters(letters, allWords)`. Constructor: `new WordGameProcessor(locale, wordSet)` — `wordSet` used to reject variants that are real words.
- `config/AccentRules.ts` — `NonAccentedVowels` (`a→á`...), `AccentedVowels` (`á→a`...).
- `config/DefinitionConfig.ts` (`DEFINITION_LETTERS`, `LETTERS_WITHOUT_DEFINITIONS`) and `utils/DefinitionPicker.ts` (`getDefinitionForLevel`, `formatDefinition`) — shared by definition-based games (definitionMaster, spellingBee); reuse them instead of copying.
- `hooks/useWordProcessor.ts` — hook wrapper around WordGameProcessor.

The definitions/words data behind `WordsService` is produced by the pipeline in [commands.md](commands.md).

## Shared UI components

- `Hero` (`@components/Hero`) — game header: `image`, `title`, plus children.
- `GameRules` (`@components/GameRules`) — renders `gameConfig.gameRules` before the game starts.
- Start-button / countdown / stats overlay: copy from `games/spellTower/UI.tsx` and `games/wordFinder/UI.tsx`.

## Test conventions

- Jest + ts-jest + jsdom; testing-library (react, user-event, jest-dom). `fake-indexeddb` for DB-touching tests.
- Tests under `tests/` mirroring source: `tests/utils/X.test.ts`, `tests/games/hooks/use<GameId>.test.tsx`, `tests/games/ui/<GameId>UI.test.tsx`, `tests/config/gamesConfig.test.ts`.
- Path aliases (`@games/...`) work in tests (`jest.config.json` moduleNameMapper); SCSS is identity-obj-proxy'd.
- Hooks tested with `renderHook` from `@testing-library/react`; mock `@services/WordsService` and `@store/WordsContext` with `jest.mock`.
- Pure logic (algorithms) MUST be extracted into `utils/` so it is testable without React.
- `tests/translations/keyParity.test.ts` fails if a catalog entry misses a locale — keep both locales filled.

## Text length budgets (`config/translations/Games.ts`)

Measured on the static build (headless Chromium, es + en, 375 / 768 / 1280 px; JUE-0010). The home
and `/juegos` cards sit in a grid with `grid-auto-rows: 1fr`, so the **longest card subtitle sets the
height of every card**: one long subtitle stretches the whole list. Keep every game inside these
budgets, in both locales.

| Field | Where it shows | Budget | What it gives |
|---|---|---|---|
| `title` | card `h3` (16 px, uppercase) and game page `h1` | ≤ 27 characters | ≤ 2 lines on the card at 375 px (≈ 13 characters/line), 1 line at 1280 px |
| `subtitle` | card text under the title (13 px) | ≤ 55 characters, one sentence | ≤ 3 lines at 375 px (≈ 20 characters/line), ≤ 2 lines at 768 and 1280 px |
| `description` | game page header (`Hero`), next to the image | ≤ 120 characters | ≤ 4 lines at 375 px (220 px column), 3 at 768 px, ≤ 2 at 1280 px |
| `gameGoal` | rules screen | one sentence, ≤ 75 characters | ≤ 2 lines at 375 px |
| `howToPlay[]` | rules screen, bulleted | 3–5 steps, each ≤ 115 characters | ≤ 4 lines per step at 375 px |
| `additionalRules[]`, `tips[]` | rules screen, one line break per item | ≤ 3 items each, each ≤ 115 characters | ≤ 4 lines per item at 375 px |

Content rules that go with the budget:
- `subtitle` says what *this* game is; `description` says what you do and what you practise.
- Rules describe the real behaviour in the game's hook: timer, word count, scoring (scores are
  floored at 0), what counts as correct, how the game ends. Use the exact button labels from
  `config/translations/General.ts` (`Jugar` / `Start`, `Comprobar palabra` / `Check word`…).
- Measured at the time: the 375 px page is ~5 px wider than the viewport on every page (`main` and
  `footer` overflow); that is a layout issue, not a text one.
