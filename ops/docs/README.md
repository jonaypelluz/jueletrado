# Jueletrado — índice de docs

Documentación del proyecto. **Índice por palabras clave**: encuentra el doc por los
términos que buscarías y lee **solo** ese fichero (nunca el set entero). Las keywords van
en español e inglés para que `grep` acierte en cualquier idioma.

| Keywords (ES+EN) | Doc | Qué contiene |
|---|---|---|
| comandos, commands, pipeline, word list, definiciones, definitions, crawler, crawl-output, JSONL, merge, words:transform, public/definitions, public/words, scripts, yarn script, tsx, diccionario, RAE, RAE_API_KEY, ops/scripts, dictionaryapi.dev, Merriam-Webster, MW_API_KEY, libros, books, words:from-book, frecuencia, frequency | [commands.md](commands.md) | Referencia del pipeline de palabras y definiciones: crawlers → JSONL staging → merge a `public/definitions/`; word lists como fuente de verdad. |
| convenciones, conventions, game, juego, nuevo juego, new game, stack, Next.js, static export, SCSS, react-intl, hook, UI.tsx, file pattern, page template, Games.ts, GamePreConfig, GamesRoutes, registro, registration, ES-only, availableLocales, WordsService, getSessionWords, getFullWordSet, data layer, WordGameProcessor, StorageKey, StorageService, WORD_GROUP_KEYS, tests, jest, keyParity | [game-conventions.md](game-conventions.md) | Convenciones de arquitectura para añadir/editar un juego: stack, patrón de ficheros por juego, registro en `Games.ts`, juegos ES-only, API del data layer (`WordsService`, `WordsContext`, utils), componentes UI compartidos y convenciones de test. |

## Convenciones para estos docs
- Un tema por fichero. Al añadir un doc, añade arriba una fila con keywords (ES + EN).
- Cada doc corto y factual — describe *este* repo, no teoría general.
- Las referencias a código apuntan a rutas reales (`games/…`, `config/…`, `services/…`) para que sigan siendo clicables.
- Las reglas de git y de flujo de trabajo (ramas, commits, push) viven en las reglas globales de jon-ai (`~/.claude/CLAUDE.md`, `/defaults/*.md`), no en estos docs.

## Reglas del repo
- Gestor de paquetes: **yarn**, nunca npm (`yarn.lock` es el lockfile; npm generaría `package-lock.json`).
- Nunca stagear ni commitear `next-env.d.ts` (autogenerado por Next.js, ya en `.gitignore`). `next.config.js` sí es parte del repo.
