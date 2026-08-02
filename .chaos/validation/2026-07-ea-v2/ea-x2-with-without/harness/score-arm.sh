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
# NOTE (2026-08-02): the summary line format is SDK/verbosity dependent — .NET 10 at `-v n`
# prints "Test Run Successful." / "Total tests: N" where earlier SDKs printed "Passed!  - Failed:
# N, Passed: N". The old grep matched neither and printed NOTHING, which reads as "no failures"
# but proves the oracle never ran. Always emit an explicit verdict line; never fail silent.
ORACLE_OUT="$(dotnet test "$CSPROJ" --filter "FullyQualifiedName~TaskTracker.Oracle" --nologo 2>&1)"
echo "$ORACLE_OUT" | grep -E '\[FAIL\]|error CS' | sed 's/\[xUnit.net [0-9:.]*\] *//' | head -40
SUMMARY="$(echo "$ORACLE_OUT" | grep -E 'Passed!|Failed!|Test Run Successful|Test Run Failed|No test (is available|matches)' | head -1 | sed 's/  */ /g')"
if [ -z "$SUMMARY" ]; then
  echo "ORACLE VERDICT: UNKNOWN — could not parse a summary line. DO NOT record this as clean."
  echo "$ORACLE_OUT" | tail -15
else
  echo "ORACLE VERDICT: $SUMMARY"
fi

# Clean the oracle back out so the published arm diff excludes it.
rm -f "$TESTS/$ORACLE_BASENAME"
echo "########## done: $WT ##########"
