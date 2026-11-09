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

From `@services/WordsService`:
- `getSessionWords(key, sessionSize, level, locale, setError, fetchOptions, refetchThreshold?)` → `string[]` — draws N words from a persistent localStorage pool, refetches in background (spellTower, wordFinder, accentFixer, letterMatcher, syllableSplitter). Requires a new `StorageKey`.
- `getFullWordSet(locale, setError?, setLoadingProgress?)` → `Set<string>` — combined dictionary of all levels, to validate words/variants. Populates IndexedDB on first call (slow first time → show loading UI, see spellTower's `isLoadingWords` + `setLoadingProgress`).
- `getWords(level, locale, count, setError, maxLength?, minLength?)` → random words from current level.
- `loadDefinition(letter, locale)` → fetches `/definitions/<locale>/<letter>_definitions.json`, shape: `Record<word, { level?: string; definitions: { number: number; type: string; definition: string }[] }>`.

From `@store/WordsContext` (via `useWordsContext()`): `{ locale, gameLevel, error, setError, setLoading, setLoadingProgress }`. `gameLevel` ∈ `'beginner' | 'intermediate' | 'advanced'` (`config/LevelConfig.ts`).

New storage keys: add to the `StorageKey` union AND the static map in `store/StorageService.ts`. If the game's word pool should be prefetched on level selection, also append to `WORD_GROUP_FETCH_CONFIG` and `WORD_GROUP_KEYS` in `WordsService.ts`. Keys in `WORD_GROUP_KEYS` are wiped by `clearWordGroupCaches()` — never put data that must persist (e.g. best scores) there.

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
