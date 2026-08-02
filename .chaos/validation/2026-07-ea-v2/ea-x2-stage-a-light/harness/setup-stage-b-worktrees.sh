#!/usr/bin/env bash
# Stage-B measurement — create the 7 arm worktrees off demo/dotnet and stage the toolkit under test.
# Usage: setup-stage-b-worktrees.sh <out-dir>          (<out-dir> must be OUTSIDE the repo, short path)
#
# Worktree names match score-all.sh's expectations: A1..A3 / B1..B3, each -armA (governed) and
# -armB (plain), plus V1-armA for the FRAME-only valve seed.
#
# WHY STAGING IS NEEDED: `demo/dotnet` (df26104) predates Stage B — it has no
# `tools/chaos-render/`, no `record-emission.md`, and a `change-template.md` without the §5
# machine layer. The governed arm is measuring the CURRENT toolkit, so the current skills +
# renderer are copied into every governed worktree. The plain arm (-armB) is left untouched:
# it must see exactly the same repo the frozen baseline's plain arm saw.
set -euo pipefail
OUT="${1:?usage: setup-stage-b-worktrees.sh <out-dir>}"
# PIN THE FROZEN BASE COMMIT, not the demo/dotnet branch tip. The RUNKIT invariant names d27600f
# ("Base all worktrees on demo/dotnet, commit d27600f at freeze"): 5 baseline tests, no auth,
# architecture non-goals intact. The branch tip has since moved to df26104 (the golden
# secure-task-api lifecycle), which already ships JWT auth + 34 tests — basing arms there would
# silently invalidate task 1 (adding auth to an API that already has it) and every held-out oracle.
BASE_REF="d27600f"
REPO="$(cd "$(dirname "$0")/../../../../.." && pwd)"   # <kit>/harness -> kit -> 2026-07-ea-v2 -> validation -> .chaos -> repo root

mkdir -p "$OUT/wt"
for p in A1 A2 A3 B1 B2 B3; do
  for a in armA armB; do
    if [ ! -d "$OUT/wt/$p-$a" ]; then
      git -C "$REPO" worktree add --detach "$OUT/wt/$p-$a" "$BASE_REF" >/dev/null && echo "created $p-$a"
    fi
  done
done
if [ ! -d "$OUT/wt/V1-armA" ]; then
  git -C "$REPO" worktree add --detach "$OUT/wt/V1-armA" "$BASE_REF" >/dev/null && echo "created V1-armA"
fi

echo ""
echo "Staging the Stage-B toolkit under test into the GOVERNED worktrees only:"
for wt in "$OUT"/wt/*-armA; do
  # 1. the renderer + its schemas (absent from demo/dotnet entirely)
  mkdir -p "$wt/tools/chaos-render"
  cp -r "$REPO/tools/chaos-render/." "$wt/tools/chaos-render/"
  # 2. the current skills tree (demo/dotnet's is behind main: no §5, no record-emission.md)
  mkdir -p "$wt/.claude/skills"
  cp -r "$REPO/.claude/skills/." "$wt/.claude/skills/"
  # 3. the metadata hook the renderer reuses for provenance/serialization
  mkdir -p "$wt/.claude/hooks/scripts"
  cp "$REPO/.claude/hooks/scripts/chaos-artifact-metadata-hook.py" "$wt/.claude/hooks/scripts/"
  echo "  staged: $(basename "$wt")"
done

echo ""
echo "Sanity check (governed arm A1-armA):"
test -f "$OUT/wt/A1-armA/tools/chaos-render/render.py" && echo "  renderer present  OK"
test -f "$OUT/wt/A1-armA/.claude/skills/chaos-shared/reference/record-emission.md" && echo "  record-emission.md present  OK"
grep -q "Stage-B record schemas" "$OUT/wt/A1-armA/.claude/skills/chaos-shared/reference/change-template.md" \
  && echo "  change-template.md §5 present  OK"
test ! -e "$OUT/wt/A1-armB/tools/chaos-render" && echo "  plain arm left unstaged  OK"

echo ""
echo "Worktrees ready under $OUT/wt. Feed these paths to stage-b-arms.workflow.js."
