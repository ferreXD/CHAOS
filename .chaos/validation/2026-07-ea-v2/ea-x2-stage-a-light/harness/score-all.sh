#!/usr/bin/env bash
# Stage-A light measurement — score every cost arm against its held-out oracle.
# Usage: score-all.sh <scratch-stage-a-dir>   (the dir containing wt/)
# Reuses the frozen EA-X2 oracles for cost run A and the new Stage-A oracles for cost run B.
# Never commits; drops each oracle in, runs, removes it (see ../../ea-x2-with-without/harness/score-arm.sh).
set -uo pipefail
SCRATCH="${1:?usage: score-all.sh <scratch-stage-a-dir>}"
WT="$SCRATCH/wt"
HERE="$(cd "$(dirname "$0")" && pwd)"
X2_ORACLES="$HERE/../../ea-x2-with-without/oracles"
B_ORACLES="$HERE/../oracles"
SCORE="$HERE/../../ea-x2-with-without/harness/score-arm.sh"

# pair-dir-prefix  oracle-path
declare -a MAP=(
  "A1 $X2_ORACLES/AuthOracleTests.cs"
  "A2 $X2_ORACLES/SoftDeleteOracleTests.cs"
  "A3 $X2_ORACLES/ConcurrencyOracleTests.cs"
  "B1 $B_ORACLES/CountOracleTests.cs"
  "B2 $B_ORACLES/StatusFilterOracleTests.cs"
  "B3 $B_ORACLES/TitleLengthOracleTests.cs"
)

for entry in "${MAP[@]}"; do
  set -- $entry; PREFIX="$1"; ORACLE="$2"
  for arm in armA armB; do
    echo ""
    echo "==================== $PREFIX-$arm  ($(basename "$ORACLE")) ===================="
    bash "$SCORE" "$WT/$PREFIX-$arm" "$ORACLE"
  done
done
echo ""
echo "Scoring complete. Expect the light (armA) and plain (armB) arms to both pass their oracle"
echo "unless a real regression appears. Record pass/fail per arm in results.md."
