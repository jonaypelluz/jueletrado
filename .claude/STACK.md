# Stack Profile: Next.js SSG (App Router) + TypeScript + Sass + Ant Design + IndexedDB

Stack-level conventions for `jueletrado`: Next.js 15 App Router in full static-export mode (`output: 'export'`, no server runtime), TypeScript, Sass/SCSS, Ant Design v5, react-intl for i18n, IndexedDB/localStorage for client-side data, and Jest for tests. **Stack-specific, not project-specific** — no folder layout, no domain class names. Those live in the project's `PROJECT.md` / `CLAUDE.md`.

## Next.js (App Router, static export)

- Output is `export` (no server runtime). No `getServerSideProps`, no API routes, no server actions, no `[slug]`/dynamic routes — every route is a real `page.tsx` file under `app/`.
- `next/image` requires `images.unoptimized: true`. Do not rely on built-in image optimisation — optimise images at source.
- `trailingSlash: true` is active. All internal links must end with `/`, otherwise the static file structure won't match and navigation breaks.
- `basePath`/`assetPrefix` are conditional on `process.env.GITHUB_ACTIONS` (`/jueletrado` in CI for GitHub Pages, empty locally). Don't hardcode `/jueletrado/` in links — use `next/link` and relative paths so both environments resolve correctly.
- `transpilePackages` includes `antd` and its `rc-*` deps — required for SSR of the static build. Don't remove entries from this list without testing the prerendered HTML.
- Routing uses `next/link`, `useRouter`/`usePathname` from `next/navigation` — never `react-router-dom`.
- Use `'use client'` where state, react-intl, or antd are needed. Next still prerenders static HTML for each route at build time for SEO; the client hydrates on top.

## i18n (react-intl)

- Locale is **inferred from the URL** in `Providers.tsx`/`IntlProviderClient.tsx`: paths starting with `/en` start in English, everything else in Spanish. This avoids a language flash on SSR.
- `WordsContext` falls back to `localStorage` for locale only when the URL doesn't specify one.
- Adding a new English route means putting it under `app/en/...` and mirroring the Spanish route.
- Message catalogs live in `config/translations/`. Add new strings there — never hardcode user-facing text in components.

## TypeScript

- `strict` mode on. No `any` except at genuine external boundaries (e.g. raw IndexedDB results before validation).
- Shared types/interfaces live in `models/` (`interfaces.ts`, `types.ts`). Don't scatter shared contracts across component files.
- Use `type` for shapes without methods; `interface` for extensible contracts.
- No `as Type` casts without a comment explaining why the type is known. Prefer type guards.
- Path aliases (`@/`, `@components/`, `@games/`, `@models/`, `@hooks/`, `@config/`, `@store/`, `@services/`, `@context/`, `@layouts/`, `@utils/`, `@styles/`) are defined in `tsconfig.json`. Use them; do not add new aliases without updating `tsconfig.json` (and Jest config if tests need them too).

## Sass / SCSS

- Component-level styles are colocated `.scss` files (e.g. `Header.scss` next to `Header.tsx`). Global entries: `styles/globals.scss`, `styles/common.scss`, `styles/variables.scss`.
- Variables for colours, spacing, breakpoints — no magic hex/pixel values in component files.
- Nesting depth ≤ 3.
- `sass-loader` handles compilation via the Next.js Webpack pipeline (`sassOptions.includePaths` points at `./styles`). No separate `sass` CLI build step.

## Ant Design (v5)

- On v5, not v6 — the only version stable with React 18 + Next 15 at time of migration. Don't bump to v6 without checking `@ant-design/nextjs-registry` compatibility and React version.
- `@ant-design/nextjs-registry` (`AntdRegistry`) wraps the app in `Providers.tsx` so SSR doesn't produce a flash of unstyled content. Never remove or reorder it relative to other providers without testing SSR output.
- Stick to stable, well-supported APIs (Layout, Menu, Card, Button, Typography, Collapse, Select, Spin, Row/Col/Flex).

## React (with Next.js)

- Functional components only. No class components.
- `useState`/`useEffect` for local state/effects; Context (`WordsContext`, `CookieContext`) for cross-tree state.
- Game logic lives in each game's `use<GameName>.tsx` hook; `UI.tsx` is render-only. Don't put gameplay logic in the UI layer.
- Shared pure logic goes in `utils/` (e.g. `WordGameProcessor.ts`) — no side effects, no React imports.
- `react-ga4` is initialised only after cookie consent (`CookieContext` + `CookieConsent`). Never call `ReactGA.initialize` unconditionally.
- `reactStrictMode` runs effects twice in dev — don't paper over double-invocation with refs unless cleanup is genuinely broken.

## Data: IndexedDB / localStorage (no backend)

- **No database, no API.** Word lists and definitions are static JSON under `public/words/<locale>/` and `public/definitions/<locale>/`, fetched and loaded into IndexedDB at runtime via `DBService`.
- `DBService` is a **lazy Proxy** — initialisation is deferred until it runs in the browser (`window.indexedDB`). It throws a descriptive error if accessed on the server. All calls to it must be inside `useEffect` or event handlers — never at module/render scope.
- `StorageService` (localStorage) guards every method with `typeof window !== 'undefined'`. Without the guard, SSR breaks.
- Don't read from `localStorage`/`indexedDB` directly inside a `useState` initializer — it causes an SSR/client hydration mismatch (server: null, client: value). Use a `useEffect` + a `hydrated` flag instead, following the `WordsContext` pattern.
- New game content (word lists, definitions, levels) means adding/editing JSON under `public/` and, if needed, config in `config/LevelConfig.ts`. Don't introduce a backend, API layer, or external CMS.

## Testing (Jest)

- Test environment: `jest-environment-jsdom`.
- `@testing-library/react` for component tests. No Enzyme, no manual `ReactDOM.render`.
- `ts-jest` for TypeScript transformation.
- `fake-indexeddb` is available for mocking `DBService`/IndexedDB in tests — use it rather than hitting real browser storage.
- Run with `npm test` / `npm run test:watch`.

## Linting / Formatting

- ESLint via `next lint` (`eslint-config-next`). Run `npm run lint` before committing.
- Keep import grouping/order consistent with the existing files in each folder.

## Anti-patterns (do not do)

- `getServerSideProps`, API routes, or dynamic `[slug]` routes — this is a static export with fixed paths.
- Accessing `window`, `document`, `localStorage`, or `indexedDB` at module scope or in a `useState` initializer — guard with `typeof window !== 'undefined'` / `useEffect`, or SSR breaks.
- Hardcoding user-facing strings instead of adding them to `config/translations/`.
- Bypassing the locale-from-URL convention — new English content must live under `/en/...` and `app/en/...`.
- `next/image` without `unoptimized` awareness, or relying on Next's image optimiser — it doesn't run in static export.
- `as any` casts to dodge type errors — find or write the correct type in `models/`.
- Hardcoded absolute URLs — the site is deployed statically; use relative paths or env vars.
- Storing derived state in `useState` — derive inline or with `useMemo`.
- Committing build output (`out/`, `.next/`) or `next-env.d.ts` (auto-generated, see `CLAUDE.md`).
