#!/usr/bin/env bash
# A section comment is a missing abstraction announcing itself.
# See DISCIPLINE.md, Cohesion. Banned in the Core; extract instead.
set -euo pipefail

PATTERN='^[[:space:]]*(//|/\*|\*)[[:space:]]*[-=*_#~]{2,}'

if matches=$(grep -rnE "$PATTERN" src/core 2>/dev/null); then
  echo "Section comments found in the Core:"
  echo "$matches"
  echo
  echo "Extract the section into a well-named function or module instead."
  exit 1
fi

echo "No section comments in the Core."
