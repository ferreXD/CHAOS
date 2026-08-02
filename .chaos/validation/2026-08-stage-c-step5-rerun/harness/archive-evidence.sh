#!/usr/bin/env bash
# Archive each governed arm's classification evidence out of its worktree and into the kit,
# BEFORE worktree cleanup destroys it (brief section 8.3).
# Usage: archive-evidence.sh <scratch-dir>
set -uo pipefail
SCRATCH="${1:?usage: archive-evidence.sh <scratch-dir>}"
KIT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$KIT/evidence"

declare -A CHANGE=(
  [P1-armA]=require-api-key-auth
  [P2-armA]=soft-delete-tasks
  [P3-armA]=optimistic-concurrency-updates
  [V1-armA]=secure-api-underspecified
)

for arm in "${!CHANGE[@]}"; do
  id="${CHANGE[$arm]}"
  wt="$SCRATCH/wt/$arm"
  dst="$OUT/$arm"
  [ -d "$wt" ] || { echo "SKIP $arm (no worktree)"; continue; }
  mkdir -p "$dst"
  # the classifier's own machine state — the primary fidelity citation
  cp "$wt/.chaos/changes/$id/classification-state.json" "$dst/" 2>/dev/null \
    && echo "  $arm: classification-state.json" || echo "  $arm: NO classification-state.json (finding)"
  # the ledger carries the TRG-* events + the decision entries
  cp "$wt/.chaos/changes/$id/decision-events.md" "$dst/" 2>/dev/null \
    && echo "  $arm: decision-events.md" || echo "  $arm: NO decision-events.md (finding)"
  # rendered artifacts, for the byte inventory + a human read
  cp "$wt/.chaos/changes/$id/change.md" "$dst/" 2>/dev/null
  cp "$wt/.chaos/changes/$id/lifecycle.md" "$dst/" 2>/dev/null
  # records + openspec set, as produced
  if [ -d "$wt/.chaos/changes/$id/records" ]; then
    mkdir -p "$dst/records" && cp "$wt/.chaos/changes/$id/records/"*.json "$dst/records/" 2>/dev/null
  fi
  if [ -d "$wt/openspec/changes/$id" ]; then
    mkdir -p "$dst/openspec" && cp -r "$wt/openspec/changes/$id/." "$dst/openspec/" 2>/dev/null
    echo "  $arm: openspec set archived"
  else
    echo "  $arm: NO openspec artifacts (openspec dimension 0 — record it)"
  fi
  # the classifier scratch payloads: what was actually FED to each checkpoint (instrumentation truth)
  if [ -d "$wt/.tmp" ]; then
    mkdir -p "$dst/tmp-payloads" && cp -r "$wt/.tmp/." "$dst/tmp-payloads/" 2>/dev/null
  fi
  # the source diff, for the implementation column of the attribution
  git -C "$wt" add -N src tests >/dev/null 2>&1
  git -C "$wt" diff d27600f -- src tests > "$dst/implementation.diff" 2>/dev/null
  git -C "$wt" diff --numstat d27600f > "$dst/full-worktree.numstat" 2>/dev/null
  # the byte attribution
  python "$KIT/harness/attribute-arm.py" "$wt" "$id" > "$dst/attribution.json" 2>/dev/null \
    && echo "  $arm: attribution.json" || echo "  $arm: attribution FAILED"
done

echo ""
echo "Evidence archived under $OUT"
