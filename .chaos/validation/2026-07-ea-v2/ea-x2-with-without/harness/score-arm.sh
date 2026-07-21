#!/usr/bin/env bash
# Usage: score-arm.sh <worktree> <oracle.cs>
# Copies the held-out oracle into the arm's test project, runs (1) the arm's own baseline
# suite and (2) the oracle-only suite, reports pass/fail + failing names, then removes the
# oracle so the arm diff stays clean for publishing. Never commits.
set -uo pipefail
WT="$1"; ORACLE="$2"
TESTS="$WT/tests/TaskTracker.Tests"
CSPROJ="$TESTS/TaskTracker.Tests.csproj"
ORACLE_BASENAME="$(basename "$ORACLE")"

cp "$ORACLE" "$TESTS/$ORACLE_BASENAME"

echo "########## ARM OWN SUITE (TaskTracker.Tests) ##########"
dotnet test "$CSPROJ" --filter "FullyQualifiedName~TaskTracker.Tests" --nologo -v q 2>&1 \
  | grep -E 'Passed!|Failed!|error CS|Passed:|Failed:' | head -8

echo "########## HELD-OUT ORACLE (TaskTracker.Oracle) ##########"
dotnet test "$CSPROJ" --filter "FullyQualifiedName~TaskTracker.Oracle" --nologo -v n 2>&1 \
  | grep -E '\[FAIL\]|\[SKIP\]|Passed!|Failed!|error CS|Passed:.*Failed:|Total:' \
  | grep -viE 'Duration' | sed 's/\[xUnit.net [0-9:.]*\] *//' | head -40

# Clean the oracle back out so the published arm diff excludes it.
rm -f "$TESTS/$ORACLE_BASENAME"
echo "########## done: $WT ##########"
