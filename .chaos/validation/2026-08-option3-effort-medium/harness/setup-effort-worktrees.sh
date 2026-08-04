#!/usr/bin/env bash
# Option-3 effort trial — create the 6 arm worktrees (P1, B2, B3 x {armA governed, armB plain})
# and stage the COMPOSITE toolkit (options 1+2). Derived from the lever-run setup script; the
# one staging delta is tools/chaos-loop (the frame/close composites) and the composite-routed
# chaos-run skill that ships with the current skills tree.
# Usage: setup-effort-worktrees.sh <out-dir>       (<out-dir> OUTSIDE the repo, short path)
set -euo pipefail
OUT="${1:?usage: setup-effort-worktrees.sh <out-dir>}"

# PIN THE FROZEN BASE COMMIT. RUNKIT invariant: d27600f (5 baseline tests, no auth, architecture
# non-goals intact). The demo/dotnet tip ships JWT auth + 34 tests and would invalidate the
# tasks and every held-out oracle. `main` has an empty src/TaskTracker.Api.
BASE_REF="d27600f"
REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"

PAIRS="P1 B2 B3"
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
echo "Staging the composite toolkit under test into the GOVERNED worktrees only:"
for wt in "$OUT"/wt/*-armA; do
  mkdir -p "$wt/tools/chaos-render"
  cp -r "$REPO/tools/chaos-render/." "$wt/tools/chaos-render/"
  mkdir -p "$wt/tools/chaos-classify"
  cp -r "$REPO/tools/chaos-classify/." "$wt/tools/chaos-classify/"
  # the lever tools + THE COMPOSITES (option 1+2; loop.py imports its siblings relatively,
  # so the sibling layout must be preserved)
  for t in chaos-digest chaos-scan chaos-record chaos-loop; do
    mkdir -p "$wt/tools/$t"
    cp -r "$REPO/tools/$t/." "$wt/tools/$t/"
  done
  mkdir -p "$wt/.claude/skills"
  cp -r "$REPO/.claude/skills/." "$wt/.claude/skills/"
  mkdir -p "$wt/.claude/agents"
  cp "$REPO/.claude/agents/chaos-mechanical-executor.md" "$wt/.claude/agents/"
  mkdir -p "$wt/.claude/hooks/scripts"
  cp "$REPO/.claude/hooks/scripts/chaos-artifact-metadata-hook.py" "$wt/.claude/hooks/scripts/"
  mkdir -p "$wt/docs/design"
  for d in 2026-08-02-stage-c-progressive-rigor 2026-08-03-cost-bar-and-run-collapse \
           2026-08-03-l1-model-tiering 2026-08-03-l2-corpus-amortization \
           2026-08-03-l3-l4-scan-and-record 2026-08-04-wall-clock-lever-plan; do
    cp "$REPO/docs/design/$d.md" "$wt/docs/design/"
  done
  cp "$REPO/.chaos/validation/2026-08-stage-c-classifier/assets/path-class-map.json" "$wt/.chaos/path-class-map.json"
  echo "  staged: $(basename "$wt")"
done

echo ""
echo "Sanity checks (against P1-armA / P1-armB):"
A="$OUT/wt/P1-armA"; B="$OUT/wt/P1-armB"
fail=0
chk() { if eval "$2"; then echo "  $1  OK"; else echo "  $1  FAIL"; fail=1; fi }

chk "chaos-run skill present       " "test -f '$A/.claude/skills/chaos-run/SKILL.md'"
chk "skill routes the composites   " "grep -q 'chaos-loop/loop.py frame' '$A/.claude/skills/chaos-run/SKILL.md'"
chk "governance digest present     " "test -f '$A/.claude/skills/chaos-shared/reference/governance-digest.md'"
chk "model tier map present        " "test -f '$A/.claude/skills/chaos-shared/reference/model-tier-map.md'"
chk "mechanical executor agent     " "test -f '$A/.claude/agents/chaos-mechanical-executor.md'"
chk "chaos-loop composites present " "test -f '$A/tools/chaos-loop/loop.py'"
chk "chaos-digest tool present     " "test -f '$A/tools/chaos-digest/digest.py'"
chk "chaos-scan tool present       " "test -f '$A/tools/chaos-scan/scan.py'"
chk "chaos-record tool present     " "test -f '$A/tools/chaos-record/record.py'"
chk "record examples present       " "test -f '$A/tools/chaos-render/examples/deliver.facts.example.json'"
chk "classifier + audit present    " "test -f '$A/tools/chaos-classify/classify.py' -a -f '$A/tools/chaos-classify/audit.py'"
chk "audit has shortCircuit assert " "grep -q 'shortCircuit.materialized' '$A/tools/chaos-classify/audit.py'"
chk "pinned adjudication contract  " "test -f '$A/tools/chaos-classify/adjudication-prompt.md'"
chk "renderer present              " "test -f '$A/tools/chaos-render/render.py'"
chk "path-class map at .chaos/     " "test -f '$A/.chaos/path-class-map.json'"
chk "frozen posture intact         " "grep -qi auth '$A/.chaos/architecture.md'"
chk "digest --check exit 0 in wt   " "(cd '$A' && python tools/chaos-digest/digest.py --check >/dev/null 2>&1)"
chk "classifier byte-identical     " "cmp -s '$A/tools/chaos-classify/classify.py' '$REPO/tools/chaos-classify/classify.py'"
chk "loop suite green in worktree  " "(cd '$A' && python -m unittest discover -s tools/chaos-loop -p 'test_*.py' >/dev/null 2>&1)"
chk "plain arm PRISTINE at base    " "test -z \"\$(git -C '$B' status --porcelain)\""
chk "plain arm left unstaged       " "test ! -e '$B/tools/chaos-classify' -a ! -e '$B/tools/chaos-scan' -a ! -e '$B/tools/chaos-loop'"
chk "plain arm has no chaos-run    " "test ! -e '$B/.claude/skills/chaos-run'"
chk "plain arm has no digest/tiermap" "test ! -e '$B/.claude/skills/chaos-shared/reference/governance-digest.md' -a ! -e '$B/.claude/skills/chaos-shared/reference/model-tier-map.md'"
chk "plain arm has no executor agnt" "test ! -e '$B/.claude/agents/chaos-mechanical-executor.md'"
chk "plain arm has no map          " "test ! -e '$B/.chaos/path-class-map.json'"

echo ""
if [ "$fail" -ne 0 ]; then
  echo "SANITY FAILED — do not launch arms until every check is OK."
  exit 1
fi
echo "All sanity checks OK. Worktrees ready under $OUT/wt; feed the paths to effort-arms.workflow.js."
