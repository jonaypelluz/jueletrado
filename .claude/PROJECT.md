# Project Structure: jueletrado

Folder layout reference for the project root. Static-export Next.js 15 game site (no `src/` — everything lives at root). All game data (word lists, definitions) lives in `public/` as JSON, loaded into IndexedDB at runtime. Build output goes to `out/` (gitignored).

## Root

```
jueletrado/
├── app/                 # Routes (App Router) — both /es (default) and /en
├── components/          # Shared UI components ('use client')
├── games/               # One folder per game: hook + UI
├── config/              # Constants, spelling rules, level config, translations
├── contexts/            # CookieContext (analytics consent)
├── store/               # WordsContext + StorageService (localStorage)
├── services/            # DBService (IndexedDB), WordsService, Logger
├── hooks/               # useGamesConfig, useContentConfig, useWordProcessor
├── models/              # TypeScript interfaces and types
├── utils/               # WordGameProcessor (pure game logic)
├── layouts/             # MainLayout (Header + Content + Footer)
├── styles/              # globals.scss, common.scss, variables.scss
└── public/              # Word lists, definitions, images, favicons
```

## app/

Next.js App Router. Every route is a real `page.tsx` file — no dynamic `[slug]` routes, all paths are static and fixed.

```
app/
├── layout.tsx                          # Root layout, wraps Providers
├── page.tsx                            # /
├── not-found.tsx                       # 404
├── juegos/                             # /juegos and the 6 games (Spanish, default locale)
│   ├── la-torre-de-la-ortografia/      # spellTower
│   ├── lluvia-de-palabras/             # wordsRain
│   ├── constructor-de-palabras/        # wordBuilder
│   ├── buscador-de-palabras/           # wordFinder
│   ├── maestro-de-las-definiciones/    # definitionMaster
│   └── crucigramas/                    # crossWordPuzzle
├── reglas-de-ortografia/               # spelling-rules content pages (SEO-heavy text)
│   ├── deletreo/
│   ├── acentuacion/
│   └── ortografia/
├── politica-de-privacidad/
├── politica-de-cookies/
└── en/                                 # English mirror of the above
    ├── games/
    │   ├── word-builder/, word-finder/, definition-master/, crossword-puzzles/
    ├── privacy/
    └── cookies/
```

## games/

One folder per game. Each contains a UI component and a hook with the game's logic/state. The hook owns gameplay; `UI.tsx` is the render layer.

```
games/
├── spellTower/          # la-torre-de-la-ortografia
├── wordsRain/           # lluvia-de-palabras
├── wordBuilder/         # constructor-de-palabras
├── wordFinder/          # buscador-de-palabras
├── definitionMaster/    # maestro-de-las-definiciones
└── crossWordPuzzle/     # crucigramas
    ├── UI.tsx
    └── use<GameName>.tsx
```

## components/

Shared UI, all `'use client'`. Notable ones:

- `Providers.tsx` — wraps the tree: AntdRegistry + CookieContext + WordsContext + IntlProvider
- `IntlProviderClient.tsx` — react-intl provider, infers locale from URL
- `HomeContent.tsx` — home page content, reused by `/` and `/en/`
- `Header.tsx`, `Footer.tsx`, `Hero.tsx`, `Content.tsx` — layout pieces
- `Games.tsx`, `LevelList.tsx`, `GameRules.tsx`, `DayWord.tsx` — game-selection / home UI
- `LoadingScreen.tsx`, `LoadingSpinner.tsx` — IndexedDB load states
- `CookieConsent.tsx` — cookie banner, drives analytics consent

## config/

Game and content constants — no JSON data here (that's in `public/`).

| File | Purpose |
|------|---------|
| `AccentRules.ts` | Accent (acentuación) rule definitions |
| `ChangeRules.ts` | Spelling change rule definitions |
| `LevelConfig.ts` | Game level/difficulty configuration |
| `LocaleConfig.ts` | Locale list and defaults |
| `LogConfig.ts` | Logger configuration |
| `translations/` | react-intl message catalogs: `Content.ts`, `Games.ts`, `General.ts`, `Legal.ts`, `Letters.ts` |

## models/

- `interfaces.ts` — all TypeScript interfaces (game state, word entries, definitions, etc.)
- `types.ts` — type aliases and unions

## services/

- `DBService.ts` — IndexedDB access via a lazy Proxy (defers init until `window.indexedDB` exists; throws descriptively on the server)
- `WordsService.ts` — word-list loading/query layer on top of `DBService`
- `Logger.ts` — app logging, configured via `config/LogConfig.ts`

## store/

- `WordsContext.tsx` — global word/dictionary state, exposes a `hydrated` flag to avoid SSR mismatch
- `StorageService.ts` — `localStorage` wrapper, guarded with `typeof window !== 'undefined'`

## contexts/

- `CookieContext.tsx` — cookie-consent state, gates `react-ga4` initialization

## hooks/

- `useGamesConfig.ts` — per-game configuration/levels
- `useContentConfig.ts` — content-page (rules) configuration
- `useWordProcessor.ts` — wraps `WordGameProcessor` for component use

## utils/

- `WordGameProcessor.ts` — pure word-game logic (no side effects), shared across games

## layouts/

- `MainLayout.tsx` — wraps every page; mounts Header, Footer

## styles/

`globals.scss`, `common.scss`, `variables.scss` — entry points and shared partials. SCSS, no CSS Modules.

## public/

Static assets served as-is. This is the data layer for word games (mirrors what `config/` is for site content elsewhere).

```
public/
├── words/<locale>/          # word-list JSON, loaded into IndexedDB by DBService
├── definitions/<locale>/    # word-definition JSON
├── games/                   # per-game background images
├── images/                  # general site images
└── <favicons, manifest, robots.txt, humans.txt>
```
