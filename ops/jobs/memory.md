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

## JUE-0003 — Abeja deletreadora (spellingBee) (done 2026-11-04)
- PR: https://github.com/jonaypelluz/jueletrado/pull/58
- Juego ES + EN: `games/spellingBee/` (hook + UI), rutas `/juegos/abeja-deletreadora` y
  `/en/games/spelling-bee`, util pura `utils/SpellingComparer.ts` (`compareSpelling`, `pickHint`,
  `revealsWord`, `isUsableClue`), estilos `styles/SpellingBee.scss`.
- Compartidos para juegos de definiciones: `utils/DefinitionPicker.ts` (`getDefinitionForLevel`,
  `formatDefinition`) y `config/DefinitionConfig.ts` (`DEFINITION_LETTERS`,
  `LETTERS_WITHOUT_DEFINITIONS`); definitionMaster los importa sin cambio de comportamiento.
- Datos: los diccionarios ES traen ~4.4k tipos en inglés (`verb`, `noun`…); en ES se descartan esas
  acepciones. Una pista también se descarta si tiene <10 letras o contiene la palabra.
- Residual (aparcado): `revealsWord` es substring simple, ~10% de pistas filtran la raíz
  (abandono ← "abandonar"); muchas claves ES son formas flexionadas o sin tilde con la definición
  del lema (`jugaba`, `kilometro`) y no hay campo de lema para filtrar; el nivel solo elige la
  acepción, no la dificultad de la palabra; con <5 rondas el máximo es 3 × rondas aunque las reglas
  dicen 15; 4ª copia privada de `shuffle`; revisar la copia cuando JUE-0010 fije los límites.
- QA: tecla muerta real del SO sin probar (headless usó entrada NFD, aceptada).

## JUE-0005 — Cadena de palabras (wordChain) (done 2026-11-08)
- PR: https://github.com/jonaypelluz/jueletrado/pull/59
- Juego en ambos locales: `games/wordChain/` (hook + UI), rutas `/juegos/cadena-de-palabras` y
  `/en/games/word-chain`, util `utils/ChainLetterIndex.ts`, storage key `WORD_CHAIN_BEST`
  (`{ locale: { level: n } }`), estilos `styles/WordChain.scss`.
- Dead ends: el índice se construye sobre el word set completo (el mismo que valida). Con los datos
  actuales ninguna letra real queda bajo el umbral 50 (ES: w 115, x 206, ñ 315, k 377; EN mínimo
  x 541); solo caracteres raros (`º`). La nota original ("ñ, w, x, k") solo valía para sets por
  nivel. Si se quiere que la regla muerda, revisar umbral o base del índice (parked).
- `StorageService.clearStorage` conserva `PERSISTENT_KEYS` (hoy solo `WORD_CHAIN_BEST`) para que el
  cambio de idioma no borre las mejores marcas del otro locale.
- Residual: primera carga en frío del word set ES ~38 s (EN ~21 s) con Jugar desactivado y sin texto
  de progreso en el hero (mismo patrón que spellTower). La flecha `→` del breadcrumb no se vio en el
  contenedor headless por falta de fuente; comprobar en dispositivo.

## JUE-0010 — Textos de juegos: descripciones que caben y reglas fieles (done 2026-11-09)
- PR: https://github.com/jonaypelluz/jueletrado/pull/61
- Reescritos `subtitle`, `description` y `gameRules` (es + en) de los 10 juegos en
  `config/translations/Games.ts`, verificados contra cada hook; ningún título cambió.
- Presupuestos de longitud en `ops/docs/game-conventions.md` (sección *Text length budgets*):
  title ≤ 27, subtitle ≤ 55, description ≤ 120, gameGoal ≤ 75, ítems de reglas ≤ 115.
  Las tarjetas usan `grid-auto-rows: 1fr`: el subtítulo más largo fija la altura de todas.
- Capturas: las comprimidas quedan en el historial del PR (commit b3072f4); el set completo,
  en `$JON_ASSETS_DIR/jue-0010/`.
- La palabra del día no tiene textos descriptivos (solo `headerWordOfTheDay*` en `General.ts`).
- Residual (trabajos propuestos, sin abrir):
  - A 375 px, `main` y `footer` desbordan ~5 px (scroll horizontal en todas las páginas).
  - definitionMaster: tras responder se puede seguir pulsando y la correcta suma +1 cada vez.
  - wordFinder: el contador del botón muestra un intento de más (`UI.tsx:113`).
  - wordsRain: el tiempo aguantado nunca se muestra.
  - wordBuilder: sin estado final al encontrar todas las palabras.
  - accentFixer: palabras sin tilde con gemela acentuada (esta/está) dan una respuesta ambigua.
  - `components/DayWord.tsx` es código muerto.

## JUE-0008 — Spike: revisión de todos los juegos: jugabilidad, palabras por nivel, errores (done 2026-11-09)
- PR: https://github.com/jonaypelluz/jueletrado/pull/62 (revisado en vivo en la PR combinada #63).
  El informe completo y los logs de partidas están en el historial de git (commit de #62); capturas
  en `$JON_ASSETS_DIR/jue-0008/`.
- Medición que se queda: `node ops/jobs/spikes/JUE-0008/run.cjs` (determinista, ~1 min; transpila
  `measure.ts` con el compilador TypeScript porque `tsx` no corre en el contenedor) escribe
  `results.md`/`results.json`. Los jobs JUE-0012/14/15/17/18/19 la usan en su criterio de hecho.
- Hallazgos (F1–F17; los jobs los citan por número):
  - F1: el pool precargado ignora la ventana de longitud de cada juego.
  - F2: volver a jugar repite las palabras (spellTower, wordsRain); wordFinder se queda sin palabras.
  - F3: rondas de una sola opción, punto regalado (EN ~60–70 %).
  - F4: accentFixer principiante: el 80 % de palabras con tilde se queda en ~20 %.
  - F5: palabrotas, contenido adulto, nombres propios y basura en las listas (sobre todo principiante).
  - F6: las blocklists no protegen las listas de nivel.
  - F7: la palabra del día ignora `WORDS_DAILY` y puede ser «a», «de», «ah».
  - F8: entrar por URL a la otra locale deja los juegos colgados (pools sin locale).
  - F9: curva de dificultad: salto brusco P→I, solape I∩A del 91 %, juegos donde el nivel no cambia
    nada (spellingBee: el nivel solo elige la acepción).
  - F10: opciones duplicadas y pistas ambiguas por formas flexionadas en las definiciones.
  - F11: datos de definiciones: 4.501 etiquetas inglesas en ES; `formatDefinition` corta en el primer
    «.» (1.407 ES / 6.660 EN quedan con < 10 letras); `k`/`w` ES con pocas palabras.
  - F12: feedback solo por color, sin `aria-live`.
  - F13: móvil 375 px: la cuadrícula del crucigrama (750 px) se corta; wordBuilder desborda 7 px.
  - F14: tiempo, duración y final de partida (la pausa de feedback consume tiempo).
  - F15: inconsistencias entre juegos: pantalla de resultados y si un fallo resta punto.
  - F16: validación: sin errores en `SpellingComparer` ni `syllabify`.
  - F17: tests que faltan (final de partida de wordBuilder/crossWordPuzzle, sesiones cortas).
- Se deja como está: volumen de palabras (ningún nivel seco), generación de crucigramas (900/900),
  `syllabify`, `SpellingComparer`, comportamiento sin nivel y al recargar a mitad de partida.
- Decisiones del owner (2026-11-09):
  - nivel = bandas de frecuencia (no longitud ni rasgos ortográficos);
  - nombres propios: se quedan, marcados con un campo por palabra (para excluirlos o hacer juegos
    con ellos);
  - wordFinder y crossWordPuzzle aceptan con y sin tilde y lo dicen en las reglas;
  - la carga sigue igual: todos los niveles al cargar los niveles.
- Los 10 jobs propuestos se abrieron como JUE-0011..JUE-0020.
- Sin decidir (anotado en los jobs): marcar palabras desusadas como `zebra` (JUE-0012); la pista de
  spellingBee pasa desapercibida (JUE-0016).
