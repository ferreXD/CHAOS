#!/usr/bin/env bash
# Stage-D measurement — create the 12 arm worktrees and stage the toolkit under test.
# Usage: setup-stage-d-worktrees.sh <out-dir>       (<out-dir> OUTSIDE the repo, short path)
#
# 6 pairs x {armA governed, armB plain}: P1..P3 (band B, frozen-3) + B1..B3 (B1 band B, B2/B3
# band A). One staging implementation for all governed arms — if the two bands' governed arms
# saw different toolkits their cost rows would not be comparable.
#
# WHY STAGING: the base commit predates Stage B, C and D — no tools/chaos-render, no
# tools/chaos-classify, no path-class map, no chaos-run skill. The governed arm measures the
# CURRENT toolkit, so it is copied in. The plain arm (-armB) is left untouched: it must see
# exactly the repo the frozen baseline's plain arm saw.
set -euo pipefail
OUT="${1:?usage: setup-stage-d-worktrees.sh <out-dir>}"

# PIN THE FROZEN BASE COMMIT. RUNKIT invariant: d27600f (5 baseline tests, no auth, architecture
# non-goals intact). The demo/dotnet tip (df26104) ships JWT auth + 34 tests and would silently
# invalidate task 1 and every held-out oracle. `main` has an empty src/TaskTracker.Api.
BASE_REF="d27600f"
REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"   # <kit>/harness -> kit -> validation -> .chaos -> repo root

PAIRS="P1 P2 P3 B1 B2 B3"
echo "pairs=[$PAIRS]  base=$BASE_REF"

mkdir -p "$OUT/wt"
for p in $PAIRS; do
  for a in armA armB; do
    if [ ! -d "$OUT/wt/$p-$a" ]; then
      git -C "$REPO" worktree add --detach "$OUT/wt/$p-$a" "$BASE_REF" >/dev/null && echo "created $p-$a"
    fi
  done
done

echo ""
echo "Staging the Stage-D toolkit under test into the GOVERNED worktrees only:"
for wt in "$OUT"/wt/*-armA; do
  # 1. Stage-B renderer + schemas
  mkdir -p "$wt/tools/chaos-render"
  cp -r "$REPO/tools/chaos-render/." "$wt/tools/chaos-render/"
  # 2. classifier + the Stage-D obligation audit (audit.py ships inside chaos-classify)
  mkdir -p "$wt/tools/chaos-classify"
  cp -r "$REPO/tools/chaos-classify/." "$wt/tools/chaos-classify/"
  # 3. current skills tree — carries chaos-run (the command under test) and the Stage-C wiring
  mkdir -p "$wt/.claude/skills"
  cp -r "$REPO/.claude/skills/." "$wt/.claude/skills/"
  # 4. metadata hook the renderer reuses for provenance/serialization
  mkdir -p "$wt/.claude/hooks/scripts"
  cp "$REPO/.claude/hooks/scripts/chaos-artifact-metadata-hook.py" "$wt/.claude/hooks/scripts/"
  # 5. the design docs the skills cite as required references (Stage-C AND Stage-D)
  mkdir -p "$wt/docs/design"
  cp "$REPO/docs/design/2026-08-02-stage-c-progressive-rigor.md" "$wt/docs/design/"
  cp "$REPO/docs/design/2026-08-03-cost-bar-and-run-collapse.md" "$wt/docs/design/"
  # 6. the path-class map at the EXACT path the wiring reads. v1 was authored FOR d27600f.
  cp "$REPO/.chaos/validation/2026-08-stage-c-classifier/assets/path-class-map.json" "$wt/.chaos/path-class-map.json"
  echo "  staged: $(basename "$wt")"
done

echo ""
echo "Sanity checks (against P1-armA / P1-armB):"
A="$OUT/wt/P1-armA"; B="$OUT/wt/P1-armB"
test -f "$A/.claude/skills/chaos-run/SKILL.md"      && echo "  chaos-run skill present        OK"
test -f "$A/tools/chaos-classify/classify.py"       && echo "  classifier present             OK"
test -f "$A/tools/chaos-classify/audit.py"          && echo "  obligation audit present       OK"
test -f "$A/tools/chaos-classify/adjudication-prompt.md" && echo "  pinned adjudication contract   OK"
test -f "$A/tools/chaos-render/render.py"           && echo "  renderer present               OK"
test -f "$A/.chaos/path-class-map.json"             && echo "  path-class map at .chaos/      OK"
test -f "$A/docs/design/2026-08-03-cost-bar-and-run-collapse.md" && echo "  Stage-D design doc present     OK"
grep -q "stopAbsorbedBy" "$A/tools/chaos-classify/README.md" && echo "  continuous-mode docs staged    OK"
grep -q "adjudicationDue" "$A/tools/chaos-classify/classify.py" && echo "  continuous classifier staged   OK"
# FROZEN POSTURE: the worktree's own architecture.md at d27600f. Auth must still be a non-goal.
grep -qi "auth" "$A/.chaos/architecture.md"         && echo "  frozen posture intact          OK"
test ! -e "$B/tools/chaos-classify"                 && echo "  plain arm left unstaged        OK"
test ! -e "$B/.claude/skills/chaos-run"             && echo "  plain arm has no chaos-run     OK"
test ! -e "$B/.chaos/path-class-map.json"           && echo "  plain arm has no map           OK"

echo ""
echo "Worktrees ready under $OUT/wt. Feed these paths to stage-d-arms.workflow.js."
