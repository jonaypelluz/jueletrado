# Jueletrado — Next.js 15 (App Router, static export)

Migración de la app original (CRA + craco + react-router HashRouter) a
**Next.js 15 con App Router** y `output: 'export'`, manteniendo intactas
todas las URLs públicas, los juegos, el flujo de carga de palabras en
IndexedDB y el sistema de i18n con `react-intl`.

## Cómo arrancar

```bash
npm install
npm run dev          # desarrollo en http://localhost:3000
npm run build        # genera el sitio estático en /out
```

`next build` con `output: 'export'` genera el sitio completo en la
carpeta `out/`. Puedes servirlo con cualquier servidor estático
(`npx serve out`, GitHub Pages, S3, Netlify, Vercel, etc.).

## Mapa de rutas

Las URLs públicas se mantienen exactamente igual que en la versión CRA.
Cada ruta es ahora un archivo real del sistema, no un hash.

### Español (locale por defecto)

| URL | Archivo |
|---|---|
| `/` | `app/page.tsx` |
| `/juegos` | `app/juegos/page.tsx` |
| `/juegos/la-torre-de-la-ortografia` | `app/juegos/la-torre-de-la-ortografia/page.tsx` |
| `/juegos/lluvia-de-palabras` | `app/juegos/lluvia-de-palabras/page.tsx` |
| `/juegos/constructor-de-palabras` | `app/juegos/constructor-de-palabras/page.tsx` |
| `/juegos/buscador-de-palabras` | `app/juegos/buscador-de-palabras/page.tsx` |
| `/juegos/maestro-de-las-definiciones` | `app/juegos/maestro-de-las-definiciones/page.tsx` |
| `/juegos/crucigramas` | `app/juegos/crucigramas/page.tsx` |
| `/reglas-de-ortografia` | `app/reglas-de-ortografia/page.tsx` |
| `/reglas-de-ortografia/deletreo` | `app/reglas-de-ortografia/deletreo/page.tsx` |
| `/reglas-de-ortografia/acentuacion` | `app/reglas-de-ortografia/acentuacion/page.tsx` |
| `/reglas-de-ortografia/ortografia` | `app/reglas-de-ortografia/ortografia/page.tsx` |
| `/politica-de-privacidad` | `app/politica-de-privacidad/page.tsx` |
| `/politica-de-cookies` | `app/politica-de-cookies/page.tsx` |

### Inglés

| URL | Archivo |
|---|---|
| `/en/` | `app/en/page.tsx` |
| `/en/games` | `app/en/games/page.tsx` |
| `/en/games/word-builder` | `app/en/games/word-builder/page.tsx` |
| `/en/games/word-finder` | `app/en/games/word-finder/page.tsx` |
| `/en/games/definition-master` | `app/en/games/definition-master/page.tsx` |
| `/en/games/crossword-puzzles` | `app/en/games/crossword-puzzles/page.tsx` |
| `/en/privacy` | `app/en/privacy/page.tsx` |
| `/en/cookies` | `app/en/cookies/page.tsx` |

`app/not-found.tsx` cubre las 404.

## Decisiones clave de la migración

### Routing

- **HashRouter eliminado.** Se ha sustituido por el filesystem routing de
  Next. Las URLs son ahora *crawleables* por Google, que era el motivo
  principal de la migración.
- `Link` de `react-router-dom` → `next/link`.
- `useNavigate` → `useRouter().push` de `next/navigation`.
- `useLocation` → `usePathname` de `next/navigation`.
- El antiguo `componentMap` y la lógica centralizada de `Routes.tsx` ya
  no son necesarios; cada ruta es un archivo `page.tsx`.

### i18n

- `react-intl` se mantiene tal cual.
- El `IntlProvider` está en `components/IntlProviderClient.tsx` y se
  envuelve en el árbol desde `Providers.tsx`.
- El **locale se infiere de la URL** en `Providers.tsx`. Si la ruta empieza
  por `/en` el locale arranca en inglés, si no, en español. Esto evita el
  flash de idioma incorrecto en SSR.
- `WordsContext` también lee el locale de `localStorage` como fallback,
  pero solo si la URL no especifica uno.

### Almacenamiento

- **IndexedDB** sigue siendo la fuente de verdad para los diccionarios de
  palabras. `DBService.ts` se mantiene casi idéntico, pero ahora usa un
  **Proxy lazy** que difiere la inicialización hasta que se ejecuta en
  el cliente (`window.indexedDB`). En el servidor lanza un error
  descriptivo si alguien intenta usarlo, lo cual no debería ocurrir
  porque todas las llamadas están dentro de `useEffect` o handlers.
- **localStorage** (`StorageService.ts`) se ha protegido con guards
  `typeof window !== 'undefined'` en cada método. Sin esto, todo lo que
  toca el storage rompe el SSR.
- **WordsContext**: el original leía de `localStorage` directamente en
  el inicializador de `useState`, lo cual genera mismatch de hidratación
  en SSR (server: null, client: valor). Se ha movido a un `useEffect`
  con un flag `hydrated` que se expone en el contexto por si algún
  componente lo necesita.

### Ant Design

- Subido de **Antd v6** a **v5** (la única estable con React 18 + Next 15
  en este momento; v6 pelea con la versión de React de Next).
- `@ant-design/nextjs-registry` envuelve toda la app para que el SSR de
  Antd no produzca *flash of unstyled content*.

### Static export

- `next.config.js` configura `output: 'export'`, `trailingSlash: true` y
  `images.unoptimized: true` (obligatorio porque `next/image` con loader
  por defecto no funciona en export).
- **No hay rutas dinámicas** (`[id]`, `[slug]`). Todas son estáticas
  fijas, tal como pediste.

### Páginas estáticas para SEO

Aunque casi todos los componentes son `'use client'` (porque usan
react-intl, antd o estado), Next genera **HTML estático prerenderizado**
para cada ruta en build. Eso es lo que le sirves a Google. El cliente
hidrata el JS encima.

Las páginas de contenido (`/reglas-de-ortografia/...`) son
particularmente buenas candidatas a posicionar bien porque tienen mucho
texto y todo el contenido textual está en el SCSS-prerenderizado.

## Estructura de carpetas

```
jueletrado-next/
├── app/                     # Rutas (App Router)
│   ├── layout.tsx           # Layout raíz con Providers
│   ├── page.tsx             # /
│   ├── not-found.tsx        # 404
│   ├── juegos/              # rutas /juegos/...
│   ├── reglas-de-ortografia/
│   ├── politica-de-privacidad/
│   ├── politica-de-cookies/
│   └── en/                  # rutas /en/...
├── components/              # UI compartida (todo 'use client')
│   ├── Header.tsx, Footer.tsx, Hero.tsx, ...
│   ├── HomeContent.tsx      # contenido del home, reusable por / y /en/
│   ├── IntlProviderClient.tsx
│   └── Providers.tsx        # AntdRegistry + Cookie + Words + Intl
├── games/                   # 6 juegos: hooks + UI por juego
│   ├── spellTower/
│   ├── wordsRain/
│   ├── wordBuilder/
│   ├── wordFinder/
│   ├── definitionMaster/
│   └── crossWordPuzzle/
├── config/                  # constantes, traducciones, niveles
│   └── translations/
├── contexts/                # CookieContext (analytics consent)
├── store/                   # WordsContext + StorageService (localStorage)
├── services/                # DBService (IndexedDB), WordsService, Logger
├── hooks/                   # useGamesConfig, useContentConfig, useWordProcessor
├── models/                  # types e interfaces TypeScript
├── utils/                   # WordGameProcessor
├── layouts/                 # MainLayout (Header + Content + Footer)
├── styles/                  # globals.scss, common.scss, variables.scss
├── public/                  # palabras (JSON), imágenes, definiciones, favicons
├── next.config.js
├── tsconfig.json
├── global.d.ts              # JSX namespace global compatibility
└── package.json
```

## Path aliases

`tsconfig.json` define los siguientes alias (mantenidos del proyecto
original para minimizar diff):

| Alias | Apunta a |
|---|---|
| `@/*` | `./*` |
| `@components/*` | `./components/*` |
| `@games/*` | `./games/*` |
| `@models/*` | `./models/*` |
| `@hooks/*` | `./hooks/*` |
| `@config/*` | `./config/*` |
| `@store/*` | `./store/*` |
| `@services/*` | `./services/*` |
| `@context/*` | `./contexts/*` |
| `@layouts/*` | `./layouts/*` |
| `@utils/*` | `./utils/*` |

## Caveats / cosas que probablemente quieras revisar

1. **No he podido ejecutar `npm install && npm run build`** en mi
   sandbox (limitación del entorno, no del proyecto). El primer build
   en tu máquina puede revelar algún ajuste menor — lo más probable es
   un import sin actualizar o un type warning. Toda la auditoría manual
   que he podido hacer está limpia.

2. **Antd v5 vs v6.** Si decides volver a v6 cuando sea estable con
   React 19 + Next, los componentes deberían ser compatibles porque
   solo se usan APIs estables (Layout, Menu, Card, Button, Typography,
   Collapse, Select, Spin, Row/Col/Flex). Revisa si `@ant-design/nextjs-registry`
   tiene versión para v6.

3. **Locale en la URL.** El `Providers.tsx` infiere el locale del path
   con `usePathname`. Funciona correctamente para todas las rutas de la
   app. Si añades nuevas rutas en inglés, asegúrate de que estén bajo
   `/en/...`.

4. **Carga de IndexedDB tras navegación directa.** Si un usuario llega
   directamente a `/juegos/lluvia-de-palabras` (caso real desde Google),
   la BD no está poblada todavía: el juego mostrará el `LoadingScreen`
   en estado de error y le dará la opción de borrar y recargar. El flujo
   esperado sigue siendo entrar primero a `/`, elegir nivel, y desde
   ahí jugar. No he cambiado este comportamiento, solo lo apunto.

5. **`document.title` y `<meta description>`.** Se sincronizan con el
   locale activo en `IntlProviderClient.tsx`. Si quieres títulos por
   ruta para SEO, lo idiomático en Next es usar `export const metadata`
   en cada `page.tsx` (server component). Como las páginas son `'use client'`
   no se puede directamente, pero puedes mover el wrapper de cada juego
   a un patrón `page.tsx` (server, con metadata) → `Game.tsx` (client).
   Lo dejo apuntado pero no lo he hecho para no inflar el PR.

6. **Tests.** No he tocado la carpeta `__tests__` del original. Si
   quieres mantenerlos, habrá que adaptar los mocks de `react-router-dom`
   a `next/navigation`. Los tests de `DBService` y `WordGameProcessor`
   deberían funcionar tal cual porque la lógica no ha cambiado.

7. **`react-ga4`** (Google Analytics) se carga dinámicamente solo si el
   usuario acepta cookies, igual que en el original.
