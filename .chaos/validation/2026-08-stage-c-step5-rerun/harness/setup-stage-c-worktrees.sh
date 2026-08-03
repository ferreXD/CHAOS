#!/usr/bin/env bash
# Stage-C step-5 measurement — create the arm worktrees and stage the toolkit under test.
# Usage: setup-stage-c-worktrees.sh <out-dir> [tier]   (<out-dir> OUTSIDE the repo, short path)
#
#   tier=core      (default) P1..P3 x {armA governed, armB plain} + V1-armA (FRAME-only seed)
#   tier=extended  B1..B3 x {armA governed, armB plain}  — the light-eligible band
#
# Both tiers share ONE staging implementation on purpose: if the governed arms of the two tiers
# saw different toolkits, their cost rows would not be comparable.
#
# WHY STAGING: the base commit predates Stage B AND Stage C — it has no tools/chaos-render,
# no tools/chaos-classify, no path-class map, and a skills tree without the classifier wiring.
# The governed arm is measuring the CURRENT toolkit, so it is copied in. The plain arm (-armB)
# is left untouched: it must see exactly the repo the frozen baseline's plain arm saw.
set -euo pipefail
OUT="${1:?usage: setup-stage-c-worktrees.sh <out-dir> [core|extended]}"
TIER="${2:-core}"

# PIN THE FROZEN BASE COMMIT. RUNKIT invariant: d27600f (5 baseline tests, no auth, architecture
# non-goals intact). The demo/dotnet tip (df26104) ships JWT auth + 34 tests and would silently
# invalidate task 1 and every held-out oracle. `main` has an empty src/TaskTracker.Api.
BASE_REF="d27600f"
REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"   # <kit>/harness -> kit -> validation -> .chaos -> repo root

case "$TIER" in
  core)     PAIRS="P1 P2 P3"; SEEDS="V1-armA" ;;
  extended) PAIRS="B1 B2 B3"; SEEDS="" ;;
  *) echo "unknown tier '$TIER' (want core|extended)" >&2; exit 2 ;;
esac
echo "tier=$TIER  pairs=[$PAIRS]  seeds=[${SEEDS:-none}]"

mkdir -p "$OUT/wt"
for p in $PAIRS; do
  for a in armA armB; do
    if [ ! -d "$OUT/wt/$p-$a" ]; then
      git -C "$REPO" worktree add --detach "$OUT/wt/$p-$a" "$BASE_REF" >/dev/null && echo "created $p-$a"
    fi
  done
done
for s in $SEEDS; do
  if [ ! -d "$OUT/wt/$s" ]; then
    git -C "$REPO" worktree add --detach "$OUT/wt/$s" "$BASE_REF" >/dev/null && echo "created $s"
  fi
done
# Sanity-check target: the first governed arm of whichever tier is being set up.
FIRST_A="$(set -- $PAIRS; echo "$1")-armA"
FIRST_B="$(set -- $PAIRS; echo "$1")-armB"

echo ""
echo "Staging the Stage-C toolkit under test into the GOVERNED worktrees only:"
for wt in "$OUT"/wt/*-armA; do
  # 1. Stage-B renderer + schemas
  mkdir -p "$wt/tools/chaos-render"
  cp -r "$REPO/tools/chaos-render/." "$wt/tools/chaos-render/"
  # 2. Stage-C classifier (core + README + pinned adjudication contract)
  mkdir -p "$wt/tools/chaos-classify"
  cp -r "$REPO/tools/chaos-classify/." "$wt/tools/chaos-classify/"
  # 3. current skills tree (carries the Stage-C wiring in all 6 commands)
  mkdir -p "$wt/.claude/skills"
  cp -r "$REPO/.claude/skills/." "$wt/.claude/skills/"
  # 4. metadata hook the renderer reuses for provenance/serialization
  mkdir -p "$wt/.claude/hooks/scripts"
  cp "$REPO/.claude/hooks/scripts/chaos-artifact-metadata-hook.py" "$wt/.claude/hooks/scripts/"
  # 5. the Stage-C design doc (the skills cite it as a required reference)
  mkdir -p "$wt/docs/design"
  cp "$REPO/docs/design/2026-08-02-stage-c-progressive-rigor.md" "$wt/docs/design/"
  # 6. the path-class map at the EXACT path the propose wiring reads. v1 was authored FOR d27600f.
  cp "$REPO/.chaos/validation/2026-08-stage-c-classifier/assets/path-class-map.json" "$wt/.chaos/path-class-map.json"
  echo "  staged: $(basename "$wt")"
done

echo ""
echo "Sanity checks (against $FIRST_A / $FIRST_B):"
test -f "$OUT/wt/$FIRST_A/tools/chaos-classify/classify.py"        && echo "  classifier present            OK"
test -f "$OUT/wt/$FIRST_A/tools/chaos-classify/adjudication-prompt.md" && echo "  pinned adjudication contract  OK"
test -f "$OUT/wt/$FIRST_A/tools/chaos-render/render.py"            && echo "  renderer present              OK"
test -f "$OUT/wt/$FIRST_A/.chaos/path-class-map.json"              && echo "  path-class map at .chaos/     OK"
test -f "$OUT/wt/$FIRST_A/docs/design/2026-08-02-stage-c-progressive-rigor.md" && echo "  design doc present            OK"
grep -q "chaos-classify" "$OUT/wt/$FIRST_A/.claude/skills/chaos-propose/SKILL.md" && echo "  propose skill Stage-C wired   OK"
# FROZEN POSTURE: the worktree's own architecture.md at d27600f. Auth must still be a non-goal.
grep -qi "auth" "$OUT/wt/$FIRST_A/.chaos/architecture.md"          && echo "  frozen posture intact         OK"
test ! -e "$OUT/wt/$FIRST_B/tools/chaos-classify"                  && echo "  plain arm left unstaged       OK"
test ! -e "$OUT/wt/$FIRST_B/.chaos/path-class-map.json"            && echo "  plain arm has no map          OK"

echo ""
echo "Worktrees ready under $OUT/wt. Feed these paths to stage-c-arms.workflow.js."
