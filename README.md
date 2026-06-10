# Jueletrado

Jueletrado: Donde jugar y aprender a escribir bien van de la mano.

Bilingual Spanish/English word-game platform built with Next.js 15 (App Router, static export).

## Juegos / Games

- **La torre de la ortografía / The Spelling Tower** — choose correctly spelled words to build the tallest tower
- **Lluvia de palabras / Word Rain** — prevent well-spelled words from falling while dodging misspelled ones
- **Constructor de palabras / Word Builder** — form as many words as possible from a random set of letters
- **Buscador de palabras / Word Finder** — guess the secret word by placing letters in the right positions
- **Maestro de las definiciones / Master of Definitions** — match words to their correct definitions
- **Crucigramas / Crossword Puzzle** — fill the grid using the given clues

## Arrancar / Getting started

```bash
# Local dev (Node 22 required)
yarn install
yarn dev        # http://localhost:3000

# Or via Docker
make build
make start
```

## Build

```bash
yarn build      # generates static site in /out
yarn lint
yarn test
```

GitHub Actions deploys the `/out` folder to GitHub Pages on every push to `main`.

## Palabras y definiciones / Word data

- **Spanish words** — based on [diccionario-espanol-txt](https://github.com/JorgeDuenasLerin/diccionario-espanol-txt), converted and structured into tiered JSON via `ops/scripts/transformWordsToJSON.sh`. Definitions sourced from RAE ([dle.rae.es](https://dle.rae.es)).
- **English words** — sourced from [dwyl/english-words](https://github.com/dwyl/english-words) and other public word lists, cleaned and split by level. Definitions follow British English, sourced from Collins Dictionary ([collinsdictionary.com](https://www.collinsdictionary.com)).
- Word lists live in `public/words/<locale>/`, definitions in `public/definitions/<locale>/`, loaded into IndexedDB at runtime.
- Utility scripts for expanding/maintaining word lists are in `ops/scripts/`.
- See [`ops/docs/commands.md`](ops/docs/commands.md) for the full crawler / word-list command reference.

## Stack

Next.js 15 · TypeScript · Sass · Ant Design v5 · react-intl · IndexedDB · Jest

## Contribuir

Si detectas algún error de ortografía o tienes alguna consulta, abre un issue o envíame un mensaje. ¡Gracias!
