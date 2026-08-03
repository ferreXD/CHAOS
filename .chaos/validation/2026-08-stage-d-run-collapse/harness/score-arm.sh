#!/usr/bin/env bash
# Score one arm against its HELD-OUT oracle. The oracle never lives in the worktree — it is
# copied in, run, and removed, so no arm can ever have optimized against it.
# Usage: score-arm.sh <worktree> <oracle.cs>
set -uo pipefail
WT="${1:?usage: score-arm.sh <worktree> <oracle.cs>}"
ORACLE="${2:?usage: score-arm.sh <worktree> <oracle.cs>}"
NAME="$(basename "$ORACLE")"
DEST="$WT/tests/TaskTracker.Tests/$NAME"

cleanup() { rm -f "$DEST"; }
trap cleanup EXIT

cp "$ORACLE" "$DEST"
OUT="$(cd "$WT" && dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj --nologo -v q 2>&1)"
echo "$OUT" | grep -E "^(Passed|Failed|Aborted|error|Error)!?" | tail -5
# The summary line is authoritative; grep it out for the scorecard.
echo "$OUT" | grep -Eo "(Passed|Failed)!? *- *Failed: *[0-9]+, *Passed: *[0-9]+" | tail -1 \
  || echo "$OUT" | tail -20
