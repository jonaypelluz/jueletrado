# Done JUEs — leftover work

Residual / deferred items from JUEs that are already done, kept here so nothing is lost.
These are NOT active jobs; promote one back to a job file only if it is picked up again.

## JUE-0001 — Corregidor de acentos (accentFixer) (done)
- Juego ES-only construido: `games/accentFixer/`, ruta `/juegos/corregidor-de-acentos`,
  util `utils/AccentGameProcessor.ts`, hook `useAccentFixer`, tests
  (`tests/games/hooks/useAccentFixer.test.tsx`, config de juegos). Registrado con
  `availableLocales: ['es']`; ausente de la lista EN. Plan fuente:
  `.claude/tmp/plan_01_accentFixer.md`.

## JUE-0002 — Maestro de letras (letterMatcher) (done)
- Juego en ambos locales construido: `games/letterMatcher/`, rutas
  `/juegos/maestro-de-letras` y `/en/games/letter-matcher`. Deriva los pares de confusión de
  `config/ChangeRules.ts` (mismo origen que spellTower). Hook `useLetterMatcher`, tests
  (`tests/games/hooks/useLetterMatcher.test.tsx`, config de juegos). Plan fuente:
  `.claude/tmp/plan_02_letterMatcher.md`.

## JUE-0004 — Separador de sílabas (syllableSplitter) (done)
- Juego ES-only: `games/syllableSplitter/` (hook + UI), ruta `/juegos/separador-de-silabas`, util
  `utils/SyllableSplitter.ts` (`syllabify` / `dividerPositions`, reglas RAE, invariante
  `join('') === word`), storage key `WORDS_SYLLABLE`, estilos `styles/SyllableSplitter.scss`.
- Elección documentada `tl`: `a-tle-ta` (comentario en el código).
- QA en navegador (2026-11-03, headless, 420 px): nivel Principiante, partida completa de 10 palabras
  hasta la pantalla de resultados sin errores de JS; las 10 separaciones correctas según RAE
  (per-mi-ten, qui-zás, e-je-cu-ti-vo, me-dia, con-tra-to…). Detalle: a 420 px una palabra de 8
  letras parte las fichas en dos líneas.
