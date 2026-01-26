#!/bin/bash
set -e  # stop on first failure

BASE="src/test"

TESTS=(
  CHANNEL_MAP.test.ts
)

for test in "${TESTS[@]}"; do
  npm test "$BASE/$test"
done

