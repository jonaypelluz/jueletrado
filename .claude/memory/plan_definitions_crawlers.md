---
name: plan-definitions-crawlers
description: Plan for crawler architecture refactor, intermediate format, merge script, and definition data model improvements
metadata:
  type: project
---

# Plan: Definitions & Crawlers

**Why:** Crawlers currently write directly to `public/definitions/`. Fragile — one run can corrupt production data. No level tagging. EN coverage is 3%. Need a safe, resumable, staged pipeline.

**How to apply:** Work phase by phase. Do not skip to data model or game changes until Phase 1 and 2 are done and tested.

---

## Phase 1 — Crawler → intermediate JSONL output

**Goal:** Crawlers write to a staging file, never directly to `public/definitions/`.

**Output format** (`ops/crawl-output/{locale}/{timestamp}.jsonl`):
Each line is one word entry:
```json
{"word":"gato","locale":"es","level":"beginner","source":"rae","crawledAt":"2026-06-09T12:00:00Z","definitions":[...]}
```

**Changes to `crawlRAE.ts` and `crawlDictionary.ts`:**
- Remove all `writeFile` / `updateDefinitionsFile` logic
- Add `--output <file>` flag (defaults to `ops/crawl-output/{locale}/{Date.now()}.jsonl`)
- Append one JSON line per word to the output file (append-safe, resumable)
- `--skip-existing` checks against the *final* `public/definitions/` files (not the output file)
- Keep all existing flags: `--start`, `--letter`, `--level`, `--skip-existing`, `--force-update`

**Why JSONL:**
- Append-friendly (process can die and restart, output stays intact)
- One word per line → easy to inspect, grep, edit before merging
- Multiple crawl runs produce multiple files → merge step handles dedup

---

## Phase 2 — Merge script (`scripts/crawlers/mergeDefinitions.ts`)

**Usage:**
```bash
tsx scripts/crawlers/mergeDefinitions.ts ops/crawl-output/es/1234.jsonl [ops/crawl-output/es/5678.jsonl ...]
tsx scripts/crawlers/mergeDefinitions.ts ops/crawl-output/es/*.jsonl --dry-run
```

**Logic:**
1. Read each JSONL file in order (oldest first → newer wins on conflict)
2. For each word entry, load the target letter file from `public/definitions/{locale}/{letter}.json`
3. Merge definitions by `number` field (update existing, append new)
4. Update `level` on the word entry if not already set (take the lowest/simplest level seen)
5. Write back to `public/definitions/`

**Flags:**
- `--dry-run`: print what would change, write nothing
- `--locale <es|en>`: limit to one locale
- `--letter <l>`: limit to one letter

---

## Phase 3 — Data model (DECIDED 2026-06-09)

**Decision:** `level` lives only on the word entry, NOT on individual definitions.

**Final structure:**
```json
{
  "gato": {
    "level": "beginner",
    "definitions": [
      { "number": "1", "type": "sustantivo", "definition": "..." },
      { "number": "2", "type": "sustantivo", "definition": "..." }
    ]
  }
}
```

**Game-level → eligible definitions:**
- beginner    → def number 1 only
- intermediate → defs 1-3
- advanced    → all defs (except cross-references)

**Rationale:** Pool is large enough (8k+ ES words) that using only def 1 per beginner word avoids repetition without complex per-definition tagging. RAE orders by frequency — def 1 is always the most common meaning.

**IndexedDB:** definitions stay as fetch-per-letter (no change). Only used in definitionMaster + crossWordPuzzle, current approach is fine.

---

## Phase 4 — Game usage of levels (AFTER Phase 3 decided)

- `useDefinitionMaster`: filter words by `gameLevel` when building quiz
- `crossWordPuzzle`: optionally filter clue words by level
- Requires Phase 3 model to be in place first

---

## Current data state (as of 2026-06-09)

| Locale | Words | Avg defs/word | Level tagged | Beginner coverage | Intermediate coverage |
|--------|-------|--------------|--------------|-------------------|-----------------------|
| ES     | 8,425 | 6.7          | 0            | 81%               | 5%                    |
| EN     | 1,517 | 6.8          | 0            | 3%                | 3%                    |

Missing letters: EN → j, k, l, x, z / ES → x

---

## Immediate next actions (in order)

1. Refactor `crawlRAE.ts` → JSONL output
2. Refactor `crawlDictionary.ts` → JSONL output
3. Write `mergeDefinitions.ts`
4. Test pipeline end-to-end with a small word list
5. Discuss Phase 3 data model
6. Implement Phase 4 only after model is settled
