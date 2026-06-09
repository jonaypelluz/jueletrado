---
name: Commit message must prefix branch name
description: Every git commit Claude creates must start with "{BRANCH} " followed by the message
type: feedback
---

**Rule:** Every git commit Claude authors in the project must have a subject line that starts with the current branch name, followed by a space: `{BRANCH} Blabla...`.

**Why:** Team convention set by the project owner. Makes every commit traceable to its branch without inspecting metadata.

**How to apply:**
- Before creating a commit, run `git rev-parse --abbrev-ref HEAD` to get the branch name.
- Prepend `{branch} ` verbatim to the subject line (keep the rest of the message — type, description, body — normal).
- Applies to all commits: new commits, amendments, squashes, auto-generated messages.
- Example: on branch `feature/{feature-text}`, a message becomes `feature/{feature-text} fix: token expiry check`.

**Enforcement:**
- A PreToolUse hook (`.claude/hooks/check-commit-branch-prefix.sh`, baked into the container) blocks `git commit -m/-F` when the message doesn't start with the branch prefix. Editor-based commits (no `-m`) are not inspected and pass through.
