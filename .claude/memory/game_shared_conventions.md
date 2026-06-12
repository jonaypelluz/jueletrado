---
name: game-shared-conventions
description: Shared conventions for all new game plans (plans 01–05) — stack, file patterns, data API, test setup. Agents must read this before any game plan.
metadata:
  type: project
---

# Shared Conventions for All New Game Plans (READ FIRST)

Every game plan in this folder (`plan_01` … `plan_05`) assumes the conventions below. The test-writer agent and the coder agent MUST read this file before their assigned plan.

## Stack

- Next.js 15, App Router, **static export** (`output: 'export'` in `next.config.js`). No `src/` folder — everything at repo root.
- TypeScript, SCSS (plain `.scss` files in `styles/`, imported per-page; no CSS Modules).
- react-intl for general UI strings (`FormattedMessage`); game-specific copy lives in `config/translations/Games.ts`.
- State: per-game hook owns ALL gameplay logic; `UI.tsx` is a pure render layer receiving the hook's return spread as props.
- Package manager: **yarn only, never npm**. Tests: `yarn test` (jest).

## Mandatory rules (from project CLAUDE.md)

- All code in English: file names, components, variables, CSS classes, comments. Spanish/English only in user-facing strings inside translation catalogs.
- Bilingual contract: every user-facing string must exist in both `es` and `en` catalogs (exception documented per-plan for ES-only games).
- Never commit to `main`. Branch: `feature/<english-description>`. Commit subject must start with the branch name (`feature/x fix: ...`).
- Never push, never open PRs. Never commit `next-env.d.ts`.

## Per-game file pattern (copy spellTower as reference implementation)

| File | Purpose |
|---|---|
| `games/<gameId>/use<GameId>.tsx` | `'use client'` hook with all state + logic |
| `games/<gameId>/UI.tsx` | `'use client'` render component, props = gameConfig + hook output |
| `app/juegos/<spanish-slug>/page.tsx` | ES route: `'use client'`, calls hook + `createGamesConfig(locale, '<gameId>')`, wraps in `MainLayout`, imports the game's SCSS |
| `app/en/games/<english-slug>/page.tsx` | EN route, identical component (locale comes from URL via `IntlProviderClient`) |
| `styles/<GameId>.scss` | game styles (PascalCase file name, matches existing: `SpellTower.scss`) |
| `public/images/games/<gameId>.png` | card/hero image — coder should add a placeholder copy of an existing PNG if no asset provided |

Page template (exact shape used by all 6 existing games — see `app/juegos/la-torre-de-la-ortografia/page.tsx`):

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
    return (
        <MainLayout>{gameConfig && <GameUI gameConfig={gameConfig} {...gameLogic} />}</MainLayout>
    );
};

export default <GameId>Page;
```

## Registration in `config/translations/Games.ts`

Two edits per game:

1. `GamesRoutes`: add `<gameId>: '/juegos/<spanish-slug>'` under `es` and `<gameId>: '/en/games/<english-slug>'` under `en`.
2. `GamesTranslations`: append a `GamePreConfig` object: `id`, `imgSrc: '/images/games/<gameId>.png'`, `title`, `description`, `subtitle`, `gameRules` (`gameGoal`, `howToPlay[]`, `additionalRules[]`, `tips[]`) — ALL with both `en` and `es` variants. Each plan provides draft copy.

The home page game list is generated from `GamesTranslations` via `createAllGamesConfig` (`hooks/useGamesConfig.ts`) — no extra registration needed.

## ES-only games (plans 01 and 04)

accentFixer and syllableSplitter are mechanically Spanish-only. Implementation decision:

- Add optional `availableLocales?: string[]` to `GamePreConfig` (`models/interfaces.ts`).
- In `createAllGamesConfig`, filter out games where `availableLocales` is set and doesn't include the current locale.
- In `createGamesConfig`, return `null` in the same case (guards direct URL access via the page's `gameConfig &&` check — but still create NO `app/en/...` route for these games).
- Still provide `en` strings in the catalog entry (type requires them; also keeps `tests/translations/keyParity.test.ts` passing — test-writer must check that test and update expectations if it enumerates routes).
- `GamesRoutes.en` entry: point to the ES route (`/juegos/...`) so the type stays total; it is unreachable from UI because of the filter.

## Data layer API (use these, do not reinvent)

From `@services/WordsService`:

- `getSessionWords(key, sessionSize, level, locale, setError, fetchOptions, refetchThreshold?)` → `string[]` — draws N words from a persistent localStorage pool, refetches in background. Used by spellTower/wordFinder. Requires a new `StorageKey`.
- `getFullWordSet(locale, setError?, setLoadingProgress?)` → `Set<string>` — combined dictionary of all levels, for validating words/variants. Populates IndexedDB on first call (slow first time → show loading UI, see spellTower's `isLoadingWords` + `setLoadingProgress` pattern).
- `getWords(level, locale, count, setError, maxLength?, minLength?)` → random words from current level.
- `loadDefinition(letter, locale)` → fetches `/definitions/<locale>/<letter>_definitions.json`, shape: `Record<word, { level?: string; definitions: { number: number; type: string; definition: string }[] }>`.

From `@store/WordsContext` (via `useWordsContext()`): `{ locale, gameLevel, error, setError, setLoading, setLoadingProgress }`. `gameLevel` ∈ `'beginner' | 'intermediate' | 'advanced'` (see `config/LevelConfig.ts`).

New storage keys: add to the `StorageKey` union AND the static map in `store/StorageService.ts`. If the game should be prefetched on level selection, also append an entry to `WORD_GROUP_FETCH_CONFIG` and `WORD_GROUP_KEYS` in `WordsService.ts` (each plan says whether to).

Existing utils relevant to the plans:

- `utils/WordGameProcessor.ts` — `processWord(word)` (misspelled variants via `config/ChangeRules.ts`), `processWordWithAccent(word)` (accent variants), `filterWordsByLetters(letters, allWords)`. Constructor: `new WordGameProcessor(locale, wordSet)` — `wordSet` used to reject variants that are real words.
- `config/AccentRules.ts` — `NonAccentedVowels` (`a→á`...), `AccentedVowels` (`á→a`...).
- `hooks/useWordProcessor.ts` — hook wrapper around WordGameProcessor.

## Shared UI components

- `Hero` (`@components/Hero`) — game header: `image`, `title`, plus children; see any `UI.tsx`.
- `GameRules` (`@components/GameRules`) — renders `gameConfig.gameRules` before the game starts.
- Start-button / countdown / stats overlay patterns: copy from `games/spellTower/UI.tsx` and `games/wordFinder/UI.tsx`.

## Test conventions

- Jest + ts-jest + jsdom; testing-library (react, user-event, jest-dom) available. `fake-indexeddb` available for DB-touching tests.
- Tests live under `tests/` mirroring source layout: `tests/utils/X.test.ts`, `tests/games/use<GameId>.test.tsx`, `tests/config/...`.
- Path aliases (`@games/...` etc.) work in tests (see `jest.config.json` moduleNameMapper). SCSS is identity-obj-proxy'd.
- Hooks are tested with `renderHook` from `@testing-library/react`; mock `@services/WordsService` and `@store/WordsContext` with `jest.mock`.
- Pure logic (algorithms) MUST be extracted into `utils/` so it is testable without React. Each plan lists the pure modules and their test cases.
- Existing parity test `tests/translations/keyParity.test.ts` will fail if a catalog entry misses a locale — keep both locales filled.
