#!/usr/bin/env bash
# Archive each governed arm's classification + loop evidence out of its worktree and into the kit,
# BEFORE worktree cleanup destroys it.
# Usage: archive-evidence.sh <scratch-dir>
set -uo pipefail
SCRATCH="${1:?usage: archive-evidence.sh <scratch-dir>}"
KIT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$KIT/evidence"

declare -A CHANGE=(
  [P1-armA]=require-api-key-auth
  [P2-armA]=soft-delete-tasks
  [P3-armA]=optimistic-concurrency-updates
  [B1-armA]=task-count
  [B2-armA]=filter-tasks-by-status
  [B3-armA]=enforce-title-max-length
)

for arm in P1-armA P2-armA P3-armA B1-armA B2-armA B3-armA; do
  id="${CHANGE[$arm]}"
  wt="$SCRATCH/wt/$arm"
  dst="$OUT/$arm"
  [ -d "$wt" ] || { echo "SKIP $arm (no worktree)"; continue; }
  mkdir -p "$dst"
  # the classifier's own machine state — the primary fidelity citation (carries the Stage-D
  # continuous fields: seenPaths, scanCount, checkpointsRun)
  cp "$wt/.chaos/changes/$id/classification-state.json" "$dst/" 2>/dev/null \
    && echo "  $arm: classification-state.json" || echo "  $arm: NO classification-state.json (finding)"
  # the ledger carries the TRG-* events, the decision entries and their folds: counts
  cp "$wt/.chaos/changes/$id/decision-events.md" "$dst/" 2>/dev/null \
    && echo "  $arm: decision-events.md" || echo "  $arm: NO decision-events.md (finding)"
  cp "$wt/.chaos/changes/$id/change.md" "$dst/" 2>/dev/null
  cp "$wt/.chaos/changes/$id/lifecycle.md" "$dst/" 2>/dev/null
  if [ -d "$wt/.chaos/changes/$id/records" ]; then
    mkdir -p "$dst/records" && cp "$wt/.chaos/changes/$id/records/"*.json "$dst/records/" 2>/dev/null
  fi
  # ADRs wherever the arm put them (attribution finds these via git; archive the common spots)
  for adrdir in "$wt/.chaos/changes/$id/adr" "$wt/docs/adr"; do
    [ -d "$adrdir" ] && { mkdir -p "$dst/adr" && cp "$adrdir/"*.md "$dst/adr/" 2>/dev/null; }
  done
  if [ -d "$wt/openspec/changes/$id" ]; then
    mkdir -p "$dst/openspec" && cp -r "$wt/openspec/changes/$id/." "$dst/openspec/" 2>/dev/null
    echo "  $arm: openspec set archived"
  else
    echo "  $arm: NO openspec artifacts (openspec dimension 0 — record it)"
  fi
  # the scratch payloads: what was actually FED to each scan (instrumentation truth). Under the
  # continuous loop there is one per work unit, so this also reconstructs the scan sequence.
  if [ -d "$wt/.tmp" ]; then
    mkdir -p "$dst/tmp-payloads" && cp -r "$wt/.tmp/." "$dst/tmp-payloads/" 2>/dev/null
  fi
  git -C "$wt" add -N src tests >/dev/null 2>&1
  git -C "$wt" diff d27600f -- src tests > "$dst/implementation.diff" 2>/dev/null
  git -C "$wt" diff --numstat d27600f > "$dst/full-worktree.numstat" 2>/dev/null
  # re-run the obligation audit OUT OF BAND: an independent check that the arm really closed clean
  python "$wt/tools/chaos-classify/audit.py" \
    --state "$wt/.chaos/changes/$id/classification-state.json" \
    --ledger "$wt/.chaos/changes/$id/decision-events.md" \
    --change-dir "$wt/.chaos/changes/$id" \
    --openspec-dir "$wt/openspec/changes/$id" \
    --adr-dir "$wt/.chaos/changes/$id/adr" > "$dst/audit-replay.json" 2>&1
  echo "  $arm: audit replay exit=$?"
  python "$KIT/harness/attribute-arm.py" "$wt" "$id" > "$dst/attribution.json" 2>/dev/null \
    && echo "  $arm: attribution.json" || echo "  $arm: attribution FAILED"
done

echo ""
echo "Evidence archived under $OUT"
