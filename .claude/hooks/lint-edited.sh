#!/usr/bin/env bash
# PostToolUse hook: lint the file Claude just wrote or edited, and type-check
# the project after a .ts edit. Exit 2 hands the errors back to Claude, so a
# broken edit is fixed before the next one rather than found at commit time.
set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  "$CLAUDE_PROJECT_DIR"/src/* | "$CLAUDE_PROJECT_DIR"/test/* | "$CLAUDE_PROJECT_DIR"/tests/* | "$CLAUDE_PROJECT_DIR"/scripts/*) ;;
  *) exit 0 ;;
esac
case "$file" in
  *.ts | *.astro | *.mjs) ;;
  *) exit 0 ;;
esac

# The project pins Node 24 with Volta; prefer it over a newer system Node.
[ -d "$HOME/.volta/bin" ] && PATH="$HOME/.volta/bin:$PATH"
cd "$CLAUDE_PROJECT_DIR" || exit 0

if ! out=$(npx eslint --max-warnings=0 "$file" 2>&1); then
  echo "$out" >&2
  exit 2
fi
if [[ "$file" == *.ts ]] && ! out=$(npx tsc --noEmit 2>&1); then
  echo "$out" >&2
  exit 2
fi
exit 0
