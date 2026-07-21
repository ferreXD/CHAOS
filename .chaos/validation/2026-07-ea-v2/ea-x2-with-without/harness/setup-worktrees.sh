#!/usr/bin/env bash
# EA-X2 harness — create the 6 isolated arm worktrees off demo/dotnet and emit args.json.
# Usage: setup-worktrees.sh <out-dir>
# <out-dir> should be a scratch/temp path OUTSIDE the repo (worktrees are detached; demo/dotnet
# is never mutated). Prints the args.json path to feed to ea-x2-arms.workflow.js.
set -euo pipefail
OUT="${1:?usage: setup-worktrees.sh <out-dir>}"
BASE_REF="demo/dotnet"   # governed subject + AGENTS.md + .chaos rules + reference lifecycle live here
mkdir -p "$OUT/wt"
for p in p1 p2 p3; do for a in armA armB; do
  git worktree add --detach "$OUT/wt/$p-$a" "$BASE_REF" >/dev/null 2>&1 && echo "created $p-$a"
done; done
git worktree list | grep -E 'p[123]-arm' || true
echo
echo "Now author the 3 held-out oracles + task statements (see ../oracles/), keep them OUT of the"
echo "worktrees, then run the arms workflow with an args.json whose pairs point wtA/wtB at:"
echo "  $OUT/wt/pN-armA  and  $OUT/wt/pN-armB"
echo "(The task statements + changeIds are the same ones published in ../oracles/.)"
