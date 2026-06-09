---
name: memory-scope-per-project
description: Project memory goes in .claude/memory/, never in the global ~/.claude/projects/ path
type: feedback
---

**Rule:** Write memory files to `.claude/memory/` in this repo. Never to `~/.claude/projects/<encoded-path>/memory/`.

**Why:** CLAUDE.md only loads `.claude/memory/MEMORY.md`. Files written to the global path are invisible to the next session — effectively lost.

**How to apply:** Always use Write tool targeting `.claude/memory/<file>.md` and add index line to `.claude/memory/MEMORY.md`.
