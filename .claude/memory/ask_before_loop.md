---
name: ask-before-retry-loops
description: Stop after 2 unexpected failures and ask the user before retrying
type: feedback
---

Stop after 2 unexpected failures. Ask the user before attempting a third retry or changing approach.

**Why:** Avoids burning time on loops that won't converge without more context.

**How to apply:** If a command/test/build fails twice with unexpected errors, stop and report what failed — don't keep iterating silently.
