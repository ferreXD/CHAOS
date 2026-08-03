#!/usr/bin/env bash
# Lever-run measurement — create the 12 arm worktrees and stage the POST-LEVER toolkit.
# Usage: setup-lever-worktrees.sh <out-dir>       (<out-dir> OUTSIDE the repo, short path)
#
# Same 6 pairs x {armA governed, armB plain} as Stage D. One staging implementation for all
# governed arms — if the two bands' governed arms saw different toolkits their cost rows would
# not be comparable.
#
# WHAT CHANGED VS STAGE D: the governed arms now also carry tools/chaos-digest, tools/chaos-scan,
# tools/chaos-record, the governance digest + tier map, and the mechanical-executor agent. The
# plain arm is still left completely untouched: it must see exactly the repo the frozen baseline's
# plain arm saw.
set -euo pipefail
OUT="${1:?usage: setup-lever-worktrees.sh <out-dir>}"

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
echo "Staging the post-lever toolkit under test into the GOVERNED worktrees only:"
for wt in "$OUT"/wt/*-armA; do
  # 1. Stage-B renderer + schemas + the L2 example records
  mkdir -p "$wt/tools/chaos-render"
  cp -r "$REPO/tools/chaos-render/." "$wt/tools/chaos-render/"
  # 2. classifier + obligation audit (unchanged by the levers — asserted below)
  mkdir -p "$wt/tools/chaos-classify"
  cp -r "$REPO/tools/chaos-classify/." "$wt/tools/chaos-classify/"
  # 3. the lever tools: L2 digest gate, L3 scan wrapper, L4 record emitter
  for t in chaos-digest chaos-scan chaos-record; do
    mkdir -p "$wt/tools/$t"
    cp -r "$REPO/tools/$t/." "$wt/tools/$t/"
  done
  # 4. current skills tree — chaos-run (tool-driven loop), the governance digest, the tier map
  mkdir -p "$wt/.claude/skills"
  cp -r "$REPO/.claude/skills/." "$wt/.claude/skills/"
  # 5. the L1 mechanical-executor agent definition (floor tier pinned inside it)
  mkdir -p "$wt/.claude/agents"
  cp "$REPO/.claude/agents/chaos-mechanical-executor.md" "$wt/.claude/agents/"
  # 6. metadata hook the renderer reuses for provenance/serialization
  mkdir -p "$wt/.claude/hooks/scripts"
  cp "$REPO/.claude/hooks/scripts/chaos-artifact-metadata-hook.py" "$wt/.claude/hooks/scripts/"
  # 7. design docs the skills cite as required references
  mkdir -p "$wt/docs/design"
  for d in 2026-08-02-stage-c-progressive-rigor 2026-08-03-cost-bar-and-run-collapse \
           2026-08-03-l1-model-tiering 2026-08-03-l2-corpus-amortization \
           2026-08-03-l3-l4-scan-and-record; do
    cp "$REPO/docs/design/$d.md" "$wt/docs/design/"
  done
  # 8. the path-class map at the EXACT path the wiring reads. v1 was authored FOR d27600f.
  cp "$REPO/.chaos/validation/2026-08-stage-c-classifier/assets/path-class-map.json" "$wt/.chaos/path-class-map.json"
  echo "  staged: $(basename "$wt")"
done

echo ""
echo "Sanity checks (against P1-armA / P1-armB):"
A="$OUT/wt/P1-armA"; B="$OUT/wt/P1-armB"
fail=0
chk() { if eval "$2"; then echo "  $1  OK"; else echo "  $1  FAIL"; fail=1; fi }

chk "chaos-run skill present       " "test -f '$A/.claude/skills/chaos-run/SKILL.md'"
chk "governance digest present     " "test -f '$A/.claude/skills/chaos-shared/reference/governance-digest.md'"
chk "model tier map present        " "test -f '$A/.claude/skills/chaos-shared/reference/model-tier-map.md'"
chk "mechanical executor agent     " "test -f '$A/.claude/agents/chaos-mechanical-executor.md'"
chk "chaos-digest tool present     " "test -f '$A/tools/chaos-digest/digest.py'"
chk "chaos-scan tool present       " "test -f '$A/tools/chaos-scan/scan.py'"
chk "chaos-record tool present     " "test -f '$A/tools/chaos-record/record.py'"
chk "record examples present       " "test -f '$A/tools/chaos-render/examples/deliver.facts.example.json'"
chk "classifier + audit present    " "test -f '$A/tools/chaos-classify/classify.py' -a -f '$A/tools/chaos-classify/audit.py'"
chk "pinned adjudication contract  " "test -f '$A/tools/chaos-classify/adjudication-prompt.md'"
chk "renderer present              " "test -f '$A/tools/chaos-render/render.py'"
chk "path-class map at .chaos/     " "test -f '$A/.chaos/path-class-map.json'"
# FROZEN POSTURE: the worktree's own architecture.md at d27600f. Auth must still be a non-goal.
chk "frozen posture intact         " "grep -qi auth '$A/.chaos/architecture.md'"
# the digest must be FRESH inside the worktree, or every arm silently takes the L2 fallback path
chk "digest --check exit 0 in wt   " "(cd '$A' && python tools/chaos-digest/digest.py --check >/dev/null 2>&1)"
# the levers must not have moved the classifier: compare against the repo copy
chk "classifier byte-identical     " "cmp -s '$A/tools/chaos-classify/classify.py' '$REPO/tools/chaos-classify/classify.py'"
# The plain arm's invariant is PRISTINE AT THE BASE COMMIT — not "has no .claude/". Note that
# `.claude/agents/` and `.claude/skills/chaos-shared/` DO exist at d27600f: they are part of the
# frozen baseline the plain arm is supposed to see. What must be absent is everything the levers
# and Stage C/D added, and the worktree must carry no modifications at all.
chk "plain arm PRISTINE at base    " "test -z \"\$(git -C '$B' status --porcelain)\""
chk "plain arm left unstaged       " "test ! -e '$B/tools/chaos-classify' -a ! -e '$B/tools/chaos-scan' -a ! -e '$B/tools/chaos-record' -a ! -e '$B/tools/chaos-digest'"
chk "plain arm has no chaos-run    " "test ! -e '$B/.claude/skills/chaos-run'"
chk "plain arm has no digest/tiermap" "test ! -e '$B/.claude/skills/chaos-shared/reference/governance-digest.md' -a ! -e '$B/.claude/skills/chaos-shared/reference/model-tier-map.md'"
chk "plain arm has no executor agnt" "test ! -e '$B/.claude/agents/chaos-mechanical-executor.md'"
chk "plain arm has no map          " "test ! -e '$B/.chaos/path-class-map.json'"

echo ""
if [ "$fail" -ne 0 ]; then
  echo "SANITY FAILED — do not launch arms until every check is OK."
  exit 1
fi
echo "All sanity checks OK. Worktrees ready under $OUT/wt; feed the paths to lever-arms.workflow.js."
