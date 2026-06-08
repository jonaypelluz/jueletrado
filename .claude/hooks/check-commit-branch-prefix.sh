#!/usr/bin/env bash
# PreToolUse hook: enforce "{BRANCH} ..." prefix on git commit messages.
# Reads hook JSON on stdin. Exits 0 (allow) unless the command is `git commit`
# with a message that doesn't start with the current branch name.

set -uo pipefail

payload=$(cat)
cmd=$(jq -r '.tool_input.command // ""' <<<"$payload")

# Only enforce on `git commit` that provides a message inline (-m/-F).
# Editor-based commits (no -m) aren't inspectable here; allow them through.
grep -qE '(^|[^[:alnum:]])git[[:space:]]+commit([[:space:]]|$)' <<<"$cmd" || exit 0
grep -qE -- '(^|[[:space:]])-m([[:space:]]|=|$)' <<<"$cmd" || exit 0

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
[[ -z "$branch" || "$branch" == "HEAD" ]] && exit 0

branch_esc=$(printf '%s' "$branch" | sed 's/[][().*+?{}|^$\\/]/\\&/g')

# Accept if any of:
#   -m "<branch> ..."   or   -m '<branch> ...'
#   heredoc body where a line starts with "<branch> "
pattern_m="-m[[:space:]]+['\"]${branch_esc}([[:space:]]|['\"])"

# Flatten newlines to \001 so BusyBox grep (no -z) can match line-anchored prefix
sep=$(printf '\001')
flat=$(printf '%s' "$cmd" | tr '\n' "$sep")
pattern_heredoc="(^|${sep})${branch_esc}[[:space:]]"

if grep -qE -- "$pattern_m" <<<"$cmd" || grep -qE -- "$pattern_heredoc" <<<"$flat"; then
  exit 0
fi

jq -nc --arg b "$branch" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ("Commit message must start with \"" + $b + " \" prefix per project convention. Rewrite the message as: " + $b + " <your message>")
  }
}'
exit 0
