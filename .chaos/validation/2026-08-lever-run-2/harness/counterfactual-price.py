#!/usr/bin/env python3
"""Counterfactual blended cost — what L1 WOULD have saved on the measured workload.

WHY THIS EXISTS: run 2 produced correct tier verdicts (5 T0 units) but could not act on
them — a Workflow-spawned agent has no Agent tool, so every banded unit executed at ceiling
(results.md §3). L1's price effect is therefore unmeasured. This prices the counterfactual
from the run's own transcripts instead of spending another 2-hour run on it.

METHOD: attribute each governed arm's output tokens to implementation work (deliberation
bursts whose next action is writing code/tests, plus the visible tokens of the Write/Edit
calls themselves) versus everything else, then reprice the implementation share at the floor
rate. Deliberation bursts carry no tool call of their own, so each is attributed to the NEXT
action taken — the same rule decompose-output.py uses.

STATED LIMITATIONS, not hidden:
  1. Assumes a floor-tier model emits comparable token volume for the same unit.
  2. Bounds the PRICE effect only. It says nothing about whether floor-tier output is
     CORRECT — only a run where T0 units actually execute at floor can answer that.
  3. Only arms whose units the band actually put at T0/T1 are repriced; T2 arms are
     reported at ceiling, unchanged.

Prices are supplied on the command line, never hardcoded — a stale table silently corrupts
a blended-cost number.

Usage:
    python counterfactual-price.py <transcript-dir> \
        --ceiling-rate 25 --mid-rate 15 --floor-rate 5 \
        --t0-arms B1,B2,B3 [--cpt 3.5]
"""

import argparse
import json
import os
import sys

DEFAULT_NAMES = [k + s for k in ("P1", "P2", "P3", "B1", "B2", "B3") for s in ("-gov", "-plain")]
IMPL_ACTION = "write code/tests"


def ordered_transcripts(transcript_dir):
    """Arm order is the journal's agent-START order (arms run sequentially), NOT sorted
    filenames — transcript files are named by hash, so sorting shuffles the arms."""
    journal = os.path.join(transcript_dir, "journal.jsonl")
    order = []
    if os.path.isfile(journal):
        with open(journal, encoding="utf-8", errors="replace") as f:
            for line in f:
                try:
                    rec = json.loads(line)
                except ValueError:
                    continue
                if rec.get("type") == "started":
                    aid = rec.get("agentId") or rec.get("id")
                    if aid and aid not in order:
                        order.append(aid)
    files = [n for n in os.listdir(transcript_dir)
             if n.startswith("agent-") and n.endswith(".jsonl")]
    by_id = {n[len("agent-"):-len(".jsonl")]: n for n in files}
    ordered = [by_id[a] for a in order if a in by_id]
    return ordered + sorted(n for n in files if n not in ordered)


def action_of(block):
    """What a tool_use block DOES (None for non-tool blocks). Mirrors decompose-output.py."""
    if block.get("type") != "tool_use":
        return None
    name = block.get("name")
    inp = block.get("input") or {}
    path = (inp.get("file_path") or "").replace("\\", "/").lower()
    if name in ("Write", "Edit", "MultiEdit"):
        if "/src/" in path or "/tests/" in path:
            return IMPL_ACTION
        return "author other"
    if name == "Bash":
        return "bash"
    return str(name)


def split_arm(path, cpt):
    """-> (total output tokens, tokens attributable to implementation work)."""
    msgs = []
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                rec = json.loads(line)
            except ValueError:
                continue
            m = rec.get("message") if isinstance(rec.get("message"), dict) else rec
            if m.get("role") != "assistant":
                continue
            content = m.get("content") if isinstance(m.get("content"), list) else []
            actions = [a for a in (action_of(b) for b in content) if a]
            visible = sum(len(json.dumps(b.get("input", ""))) for b in content
                          if b.get("type") == "tool_use")
            visible += sum(len(b.get("text", "")) for b in content
                           if b.get("type") == "text")
            msgs.append({"out": (m.get("usage") or {}).get("output_tokens", 0) or 0,
                         "actions": actions, "visible": visible})

    total = sum(m["out"] for m in msgs)
    impl = 0
    for i, m in enumerate(msgs):
        if IMPL_ACTION in m["actions"]:
            impl += m["out"]
        elif not m["actions"]:
            # a pure deliberation burst is attributed to the NEXT action taken
            for nxt in msgs[i + 1:i + 4]:
                if nxt["actions"]:
                    if IMPL_ACTION in nxt["actions"]:
                        impl += m["out"]
                    break
    return total, impl


def main(argv=None):
    ap = argparse.ArgumentParser(description="counterfactual blended cost for L1")
    ap.add_argument("transcript_dir")
    ap.add_argument("--ceiling-rate", type=float, required=True, help="$/MTok output, ceiling")
    ap.add_argument("--floor-rate", type=float, required=True, help="$/MTok output, floor")
    ap.add_argument("--mid-rate", type=float, default=None, help="$/MTok output, mid")
    ap.add_argument("--t0-arms", default="", help="comma list of arms whose impl units banded T0")
    ap.add_argument("--t1-arms", default="", help="comma list of arms whose impl units banded T1")
    ap.add_argument("--names", default=None)
    ap.add_argument("--cpt", type=float, default=3.5)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    files = ordered_transcripts(args.transcript_dir)
    names = (args.names.split(",") if args.names else DEFAULT_NAMES)[:len(files)]
    t0 = {a.strip() for a in args.t0_arms.split(",") if a.strip()}
    t1 = {a.strip() for a in args.t1_arms.split(",") if a.strip()}

    rows, act_total, cf_total = [], 0.0, 0.0
    for name, fn in zip(names, files):
        if not name.endswith("-gov"):
            continue
        arm = name[:-4]
        total, impl = split_arm(os.path.join(args.transcript_dir, fn), args.cpt)
        rate = args.floor_rate if arm in t0 else (
            args.mid_rate if (arm in t1 and args.mid_rate) else args.ceiling_rate)
        actual = total * args.ceiling_rate / 1e6
        counter = ((total - impl) * args.ceiling_rate + impl * rate) / 1e6
        act_total += actual
        cf_total += counter
        rows.append({"arm": arm, "outputTokens": total, "implTokens": impl,
                     "implSharePct": round(100.0 * impl / total, 1) if total else 0.0,
                     "implTier": "T0" if arm in t0 else ("T1" if arm in t1 else "T2"),
                     "actualUSD": round(actual, 4), "counterfactualUSD": round(counter, 4),
                     "savingPct": round(100.0 * (actual - counter) / actual, 1) if actual else 0.0})

    report = {
        "arms": rows,
        "totalActualUSD": round(act_total, 4),
        "totalCounterfactualUSD": round(cf_total, 4),
        "totalSavingPct": round(100.0 * (act_total - cf_total) / act_total, 1) if act_total else 0,
        "rates": {"ceiling": args.ceiling_rate, "mid": args.mid_rate, "floor": args.floor_rate},
        "limitation": "assumes comparable token volume at the cheaper tier; bounds PRICE only, "
                      "says nothing about floor-tier correctness",
    }
    if args.json:
        json.dump(report, sys.stdout, indent=2)
        print()
    else:
        print("%-4s %-4s %10s %10s %7s %10s %10s %8s"
              % ("arm", "tier", "outTok", "implTok", "impl%", "actual $", "cf $", "saving"))
        for r in rows:
            print("%-4s %-4s %10d %10d %6.1f%% %10.4f %10.4f %7.1f%%"
                  % (r["arm"], r["implTier"], r["outputTokens"], r["implTokens"],
                     r["implSharePct"], r["actualUSD"], r["counterfactualUSD"], r["savingPct"]))
        print("-" * 70)
        print("TOTAL actual $%.4f -> counterfactual $%.4f  = %.1f%% saving"
              % (act_total, cf_total, report["totalSavingPct"]))
        print("LIMIT: %s" % report["limitation"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
