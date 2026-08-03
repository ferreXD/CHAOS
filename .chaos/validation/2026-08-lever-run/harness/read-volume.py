#!/usr/bin/env python3
"""Per-arm READ VOLUME and fixed-corpus share — the L2 diagnostic (L2-D4).

WHY: L2 attacks INPUT. The output-token bar cannot see it at all, so the lever is scored by
how much an arm actually reads. Stage D measured ~147,600 chars of fixed governance corpus per
governed arm (93.4% of all read volume); the frozen L2 prediction is <= 40,000.

This reads the transcripts and sums the CONTENT RETURNED by read-shaped tool calls (Read, and
Bash `cat`), attributing each to:
  - fixed corpus  — the governance surface that is identical on every change (the digest, the
    reference docs it replaced, the classifier contracts, the schemas)
  - change-specific — the repo under change: src/, tests/, the change folder, scan/ outputs
  - other         — anything else, reported so nothing is silently bucketed

Usage: python read-volume.py <workflow-transcript-dir> [--names P1-gov,P1-plain,...] [--json]
"""

import argparse
import collections
import json
import os
import sys

DEFAULT_NAMES = [k + s for k in ("P1", "P2", "P3", "B1", "B2", "B3") for s in ("-gov", "-plain")]

FIXED_MARKERS = (
    "governance-digest", "model-tier-map", "model-robustness-policy",
    "interactive-decision-protocol", "change-template", "record-emission",
    "openspec-integration-contract", "change-artifacts-layout", "scope-drift-policy",
    "task-delegation-contract", "csharp-implementation-specialist-contract",
    "resume-capsule-contract", "chaos-classify/readme", "adjudication-prompt",
    "chaos-render/schema", "chaos-render/examples", "skills/chaos-run/skill.md",
    "skills/chaos-shared", "docs/design/", "chaos-scan/readme", "chaos-record/readme",
    "chaos-digest/readme", "agents/chaos-mechanical-executor",
)
CHANGE_MARKERS = ("/src/", "/tests/", "/.chaos/changes/", "/scan/", "/records/",
                  "/openspec/changes/", "path-class-map", "architecture.md",
                  "constitution.md", "rules/index.md", "agents.md")


def bucket(path):
    p = (path or "").replace("\\", "/").lower()
    for m in FIXED_MARKERS:
        if m in p:
            return "fixed"
    for m in CHANGE_MARKERS:
        if m in p:
            return "change"
    return "other"


def read_arm(path):
    """-> (per-bucket chars, per-path chars, distinct file count)."""
    buckets = collections.Counter()
    per_path = collections.Counter()
    pending = {}          # tool_use_id -> path
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                rec = json.loads(line)
            except ValueError:
                continue
            msg = rec.get("message") if isinstance(rec.get("message"), dict) else rec
            content = msg.get("content")
            if not isinstance(content, list):
                continue
            for blk in content:
                if not isinstance(blk, dict):
                    continue
                if blk.get("type") == "tool_use":
                    inp = blk.get("input") or {}
                    target = inp.get("file_path")
                    if not target and blk.get("name") == "Bash":
                        cmd = inp.get("command") or ""
                        if cmd.strip().startswith(("cat ", "head ", "type ")):
                            target = cmd.split(None, 1)[1].strip().strip('"').split()[0]
                    if target:
                        pending[blk.get("id")] = target
                elif blk.get("type") == "tool_result":
                    target = pending.pop(blk.get("tool_use_id"), None)
                    if not target:
                        continue
                    body = blk.get("content")
                    if isinstance(body, list):
                        body = "".join(x.get("text", "") for x in body
                                       if isinstance(x, dict))
                    n = len(body or "")
                    buckets[bucket(target)] += n
                    per_path[target.replace("\\", "/")] += n
    return buckets, per_path


def main(argv=None):
    ap = argparse.ArgumentParser(description="read volume + fixed-corpus share (L2 diagnostic)")
    ap.add_argument("transcript_dir")
    ap.add_argument("--names", default=None)
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--top", type=int, default=8, help="largest reads to list per arm")
    args = ap.parse_args(argv)

    files = sorted(f for f in os.listdir(args.transcript_dir)
                   if f.startswith("agent-") and f.endswith(".jsonl"))
    if not files:
        sys.exit("no agent-*.jsonl transcripts under %s" % args.transcript_dir)
    names = (args.names.split(",") if args.names else DEFAULT_NAMES)[:len(files)]
    names += ["arm-%d" % i for i in range(len(names), len(files))]

    out = []
    for name, fn in zip(names, files):
        buckets, per_path = read_arm(os.path.join(args.transcript_dir, fn))
        total = sum(buckets.values()) or 1
        out.append({
            "arm": name, "transcript": fn,
            "totalReadChars": total,
            "fixedCorpusChars": buckets["fixed"],
            "fixedCorpusSharePct": round(100.0 * buckets["fixed"] / total, 1),
            "changeSpecificChars": buckets["change"],
            "otherChars": buckets["other"],
            "distinctFilesRead": len(per_path),
            "largestReads": [{"path": p, "chars": c}
                             for p, c in per_path.most_common(args.top)],
        })

    report = {"arms": out,
              "prediction": "L2 frozen: fixed-corpus read volume per governed arm "
                            "~147,600 -> <= 40,000 chars",
              "note": "chars of tool-result content attributed by path; a proxy, reported "
                      "with its bucketing so nothing is silently classified."}
    if args.json:
        json.dump(report, sys.stdout, indent=2)
        print()
    else:
        print("%-10s %12s %12s %8s %7s" % ("arm", "total chars", "fixed chars", "fixed%", "files"))
        for r in out:
            print("%-10s %12d %12d %7.1f%% %7d"
                  % (r["arm"], r["totalReadChars"], r["fixedCorpusChars"],
                     r["fixedCorpusSharePct"], r["distinctFilesRead"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
