#!/usr/bin/env python3
"""Per-model invocation + token accounting from the workflow transcripts (creator requirement,
kit README §5).

WHY: L1 (model tiering) is invisible to the output-token bar — it changes price per token, not
token count. The only way to score it is to count what each model was actually asked to do. Two
independent sources exist; this is the authoritative one, and the arms' self-reported
`modelInvocations` is checked against it. Disagreement is itself a finding (it means the loop
did not know what it spent).

An "invocation" = one agent run on one model: the arm agent itself, plus every subagent it
spawned (floor mechanical-executor at haiku, mid implementation at sonnet).

Usage:
    python count-invocations.py <workflow-transcript-dir> [--json]

Reads agent-*.jsonl transcripts; the model is taken from each assistant message's `model`
field (authoritative), tokens from `usage.output_tokens`. Prices are supplied at report time,
not hardcoded here — a stale price table silently corrupts a blended-cost number.
"""

import argparse
import collections
import json
import os
import sys

TIER_OF = [("haiku", "floor"), ("sonnet", "mid"), ("opus", "ceiling"), ("fable", "ceiling")]


def tier_for(model):
    m = (model or "").lower()
    for needle, tier in TIER_OF:
        if needle in m:
            return tier
    return "unknown"


def read_transcript(path):
    """-> {model: [invocation_count_contribution, output_tokens]} for one agent file."""
    per_model = collections.defaultdict(lambda: [0, 0])
    seen_models = set()
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                rec = json.loads(line)
            except ValueError:
                continue
            msg = rec.get("message") if isinstance(rec.get("message"), dict) else rec
            if msg.get("role") != "assistant":
                continue
            model = msg.get("model") or rec.get("model") or "unknown"
            usage = msg.get("usage") or {}
            per_model[model][1] += usage.get("output_tokens", 0) or 0
            seen_models.add(model)
    # one invocation per distinct model within a transcript file (a subagent gets its own file)
    for m in seen_models:
        per_model[m][0] = 1
    return per_model


def main(argv=None):
    ap = argparse.ArgumentParser(description="per-model invocation + token accounting (L1)")
    ap.add_argument("transcript_dir")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    files = sorted(f for f in os.listdir(args.transcript_dir)
                   if f.startswith("agent-") and f.endswith(".jsonl"))
    if not files:
        sys.exit("no agent-*.jsonl transcripts under %s" % args.transcript_dir)

    rows, totals = [], collections.defaultdict(lambda: [0, 0])
    for name in files:
        per_model = read_transcript(os.path.join(args.transcript_dir, name))
        row = {"transcript": name, "models": {}}
        for model, (invocations, tokens) in sorted(per_model.items()):
            row["models"][model] = {"tier": tier_for(model), "invocations": invocations,
                                    "outputTokens": tokens}
            totals[model][0] += invocations
            totals[model][1] += tokens
        rows.append(row)

    by_tier = collections.defaultdict(lambda: [0, 0])
    for model, (inv, tok) in totals.items():
        by_tier[tier_for(model)][0] += inv
        by_tier[tier_for(model)][1] += tok
    grand = sum(t[1] for t in totals.values()) or 1

    report = {
        "transcripts": rows,
        "byModel": {m: {"tier": tier_for(m), "invocations": v[0], "outputTokens": v[1],
                        "sharePct": round(100.0 * v[1] / grand, 1)}
                    for m, v in sorted(totals.items())},
        "byTier": {t: {"invocations": v[0], "outputTokens": v[1],
                       "sharePct": round(100.0 * v[1] / grand, 1)}
                   for t, v in sorted(by_tier.items())},
        "totalOutputTokens": grand,
        "note": "authoritative counts; compare against each arm's self-reported "
                "modelInvocations — disagreement is a finding, not a rounding issue. "
                "Blended cost is computed at report time with the run-date price table.",
    }
    if args.json:
        json.dump(report, sys.stdout, indent=2)
        print()
    else:
        print("%-28s %-8s %10s %12s %7s" % ("model", "tier", "invocations", "out tokens", "share"))
        for m, v in report["byModel"].items():
            print("%-28s %-8s %10d %12d %6.1f%%"
                  % (m[:28], v["tier"], v["invocations"], v["outputTokens"], v["sharePct"]))
        print("-" * 70)
        for t, v in report["byTier"].items():
            print("%-28s %-8s %10d %12d %6.1f%%" % ("TIER TOTAL", t, v["invocations"],
                                                    v["outputTokens"], v["sharePct"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
