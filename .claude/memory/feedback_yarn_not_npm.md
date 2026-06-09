---
name: feedback-yarn-not-npm
description: Use yarn, never npm, for all package manager commands in this project
metadata:
  type: feedback
---

Use `yarn` for all package manager commands. Never `npm`.

**Why:** Project uses yarn. `yarn.lock` is the lock file. Using npm creates inconsistency and may generate `package-lock.json`.

**How to apply:** Replace every npm command mentally before running:
- `npm test` → `yarn test`
- `npm install` → `yarn`
- `npm run X` → `yarn X`
- `npm add X` → `yarn add X`

Already documented in `.claude/STACK.md` line 3.
