# Done JUEs — leftover work

Residual / deferred items from JUEs that are already done, kept here so nothing is lost.
These are NOT active jobs; promote one back to a job file only if it is picked up again.

## JUE-0001 — Corregidor de acentos (accentFixer) (done)
- Juego ES-only construido: `games/accentFixer/`, ruta `/juegos/corregidor-de-acentos`,
  util `utils/AccentGameProcessor.ts`, hook `useAccentFixer`, tests
  (`tests/games/hooks/useAccentFixer.test.tsx`, config de juegos). Registrado con
  `availableLocales: ['es']`; ausente de la lista EN.

## JUE-0002 — Maestro de letras (letterMatcher) (done)
- Juego en ambos locales construido: `games/letterMatcher/`, rutas
  `/juegos/maestro-de-letras` y `/en/games/letter-matcher`. Deriva los pares de confusión de
  `config/ChangeRules.ts` (mismo origen que spellTower). Hook `useLetterMatcher`, tests
  (`tests/games/hooks/useLetterMatcher.test.tsx`, config de juegos).

## JUE-0004 — Separador de sílabas (syllableSplitter) (done)
- Juego ES-only: `games/syllableSplitter/` (hook + UI), ruta `/juegos/separador-de-silabas`, util
  `utils/SyllableSplitter.ts` (`syllabify` / `dividerPositions`, reglas RAE, invariante
  `join('') === word`), storage key `WORDS_SYLLABLE`, estilos `styles/SyllableSplitter.scss`.
- `tl`: el util separa `a-tle-ta` (comentario en el código), pero el juego excluye las palabras con
  `tl` (la RAE admite también `at-le-ta`, que es la de España). El juego filtra además por la longitud
  del nivel (la cola precargada no tiene máximo; Avanzado 6-12 letras) y vuelve a sacar palabras
  (máx. 3 tandas) hasta reunir 10 elegibles.
- QA en navegador (2026-11-03, headless, 420 px): nivel Principiante, partida completa de 10 palabras
  hasta la pantalla de resultados sin errores de JS; las 10 separaciones correctas según RAE
  (per-mi-ten, qui-zás, e-je-cu-ti-vo, me-dia, con-tra-to…).
- Fichas: se encogen con el ancho (unidades `cqi` y `--letters`) para que la palabra quepa en una
  línea; por debajo del tamaño mínimo (móvil) parten en líneas, pero cada hueco va unido a la letra
  siguiente, así que ninguna línea acaba en un hueco. QA headless (375/768/1280 px, Avanzado, palabra
  de 12 letras): sin recortes; una línea a 768 y 1280 px, dos a 375 px.

## JUE-0006 — Remove legacy scripts from ops/scripts (done 2026-11-03)
- PR: https://github.com/jonaypelluz/jueletrado/pull/57
- Borrados (cada uno con sustituto `yarn` en `ops/docs/commands.md`): `transformWordsToJSON.sh`,
  `compareAndAdd.sh`, `raeCrawler/`, `dictionaryApiCrawler/crawler.py` y `checker.py`, `wordChecker/`.
  Sección "Legacy scripts" fuera de `commands.md` y keyword `legacy` fuera del índice.
- Residual: `ops/scripts/extractFromText.sh` se conserva (extractor de columna con `awk`, sin
  equivalente `yarn`); `commands.md` lo indica. `crawl:check-en` documenta ahora su `--output` por
  defecto (`ops/scripts/dictionaryApiCrawler/output.txt`), que sigue vivo.
- `yarn words:transform` en el contenedor falla con el esbuild darwin de `node_modules` del host:
  usar `ESBUILD_BINARY_PATH` apuntando a un `@esbuild/linux-arm64` instalado fuera del repo.
