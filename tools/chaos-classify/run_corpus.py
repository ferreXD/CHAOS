#!/usr/bin/env python3
"""Corpus harness for chaos-classify — scores the classifier against the pre-registered
fidelity corpus (.chaos/validation/2026-08-stage-c-classifier/), both error directions,
acceptance bar A1-A8 + property tests P1-P6 (see the corpus acceptance.md).

Modes:
  default        full scoring; expects --adjudication for the model layer's raises
  --scan-only    deterministic side only: checks all scan/declared expectations and that the
                 scan never over-fires; checkpoints with expected adjudication raises have
                 their dims/confidence/newStops deferred (reported as pending)
  --emit-packets DIR   write sanitized adjudication packets (K1/K3, per C-12) — the blind
                 inputs for the model layer; packets NEVER contain Expected sections
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import classify as C  # noqa: E402

DEFAULT_CORPUS = os.path.normpath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..",
    ".chaos", "validation", "2026-08-stage-c-classifier"))


def fire_key(entry):
    return (entry.get("trigger"), entry.get("by"), entry.get("surface"))


def run_seed(path, map_data, adj_all):
    sections = C.load_seed(path)
    seed_id = os.path.splitext(os.path.basename(path))[0]
    expected = json.loads(sections.get("expected", "{}"))
    cps = sorted(expected.get("checkpoints", {}), key=C.CHECKPOINT_ORDER.index)
    state, verdicts = None, {}
    for cp in cps:
        adj = adj_all.get(seed_id, {}).get(cp)
        verdict, state = C.classify(sections, cp, state, adj, map_data)
        verdicts[cp] = verdict
    return seed_id, sections, expected, verdicts, state


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--corpus", default=DEFAULT_CORPUS)
    ap.add_argument("--adjudication", default=None)
    ap.add_argument("--scan-only", action="store_true")
    ap.add_argument("--emit-packets", default=None, metavar="DIR")
    ap.add_argument("--report", default=None)
    args = ap.parse_args(argv)

    # Full mode scores the SEMANTIC layer too, which only exists if the model's raises are
    # supplied. Without them every adjudication-expected firing reads as a materiality
    # UNDER-detection and the report looks exactly like a classifier regression — five FAIL
    # blocks, no hint that an input is missing. That misreading has already cost one wrong
    # bug report, so this fails closed rather than scoring against a corpus half-supplied.
    # Same rule as D4/D5: an input that changes the verdict is never allowed to default
    # silently.
    if not args.scan_only and not args.emit_packets and not args.adjudication:
        default_adj = os.path.join(args.corpus, "evidence-adjudication-results.json")
        hint = ("\n  full  : run_corpus.py --adjudication %s"
                % default_adj) if os.path.isfile(default_adj) else ""
        sys.stderr.write(
            "error: full mode scores adjudication raises and none were supplied.\n"
            "Pick the mode you actually mean:%s\n"
            "  scan  : run_corpus.py --scan-only   (deterministic layer only)\n" % hint)
        return 2

    seeds_dir = os.path.join(args.corpus, "seeds")
    map_data = json.load(open(os.path.join(args.corpus, "assets", "path-class-map.json"),
                              encoding="utf-8"))
    adj_all = {}
    if args.adjudication:
        adj_all = json.load(open(args.adjudication, encoding="utf-8"))

    seed_files = sorted(os.path.join(seeds_dir, f) for f in os.listdir(seeds_dir)
                        if f.endswith(".md"))

    # ---- packet emission mode -------------------------------------------------------------
    if args.emit_packets:
        os.makedirs(args.emit_packets, exist_ok=True)
        count = 0
        for path in seed_files:
            sections = C.load_seed(path)
            seed_id = os.path.splitext(os.path.basename(path))[0]
            expected = json.loads(sections.get("expected", "{}"))
            cps = sorted(expected.get("checkpoints", {}), key=C.CHECKPOINT_ORDER.index)
            state = None
            for cp in cps:
                verdict, state = C.classify(sections, cp, state, None, map_data)
                if cp in ("K1", "K3"):  # C-12 cadence
                    pkt = C.sanitized_packet(seed_id, cp, sections, verdict, state)
                    out = os.path.join(args.emit_packets, "%s.%s.json" % (seed_id, cp))
                    json.dump(pkt, open(out, "w", encoding="utf-8"), indent=2)
                    count += 1
        print("wrote %d sanitized packets to %s" % (count, args.emit_packets))
        return 0

    # ---- scoring --------------------------------------------------------------------------
    lines = []
    under = {"materiality": [], "mechanical": []}
    over = {"materiality": [], "mechanical": []}
    stop_over, stop_under = [], []
    dim_over, dim_under, conf_bad, echo_bad = [], [], [], []
    pending = []
    semantic = []          # (where, expected-entry, hit?)
    prop_fail = {p: [] for p in ("P1", "P2", "P3", "P4", "P5", "P6")}
    determinism_bad = []

    for path in seed_files:
        seed_id, sections, expected, verdicts, state = run_seed(path, map_data, adj_all)
        # determinism (A7): re-run, compare
        _, _, _, verdicts2, _ = run_seed(path, map_data, adj_all)
        if json.dumps(verdicts, sort_keys=True) != json.dumps(verdicts2, sort_keys=True):
            determinism_bad.append(seed_id)

        prev_dims = None
        adj_pending_seed = False  # scan-only: a missing earlier raise contaminates later state
        for cp, exp in sorted(expected.get("checkpoints", {}).items(),
                              key=lambda kv: C.CHECKPOINT_ORDER.index(kv[0])):
            got = verdicts[cp]
            where = "%s@%s" % (seed_id, cp)
            exp_fires = exp.get("newlyFired", [])
            adj_expected_here = any(e.get("by") == "adjudication" for e in exp_fires)
            defer = args.scan_only and (adj_expected_here or adj_pending_seed)
            adj_pending_seed = adj_pending_seed or adj_expected_here
            got_keys = {fire_key(e) for e in got["newlyFired"]}
            exp_keys = {fire_key(e) for e in exp_fires}

            for e in exp_fires:
                k = fire_key(e)
                is_sem = e.get("by") == "adjudication"
                if is_sem:
                    semantic.append((where, e["trigger"], k in got_keys))
                if k not in got_keys:
                    if args.scan_only and is_sem:
                        pending.append("%s %s" % (where, e["trigger"]))
                    else:
                        bucket = "materiality" if e["trigger"] in C.MATERIALITY else "mechanical"
                        under[bucket].append("%s %s(by %s)" % (where, e["trigger"], e.get("by")))
                elif "breaking" in e:
                    ge = next(g for g in got["newlyFired"] if fire_key(g) == k)
                    if ge.get("breaking") != e["breaking"]:
                        under["materiality"].append("%s %s breaking-flag mismatch" % (where, e["trigger"]))

            for g in got["newlyFired"]:
                if fire_key(g) not in exp_keys and not defer:
                    bucket = "materiality" if g["trigger"] in C.MATERIALITY else "mechanical"
                    over[bucket].append("%s %s(by %s)" % (where, g["trigger"], g.get("by")))
                if g.get("by") == "adjudication" and not g.get("cite"):
                    prop_fail["P5"].append(where)

            if not defer and "scanEcho" in exp and sorted(exp["scanEcho"]) != sorted(got["scanEcho"]):
                echo_bad.append("%s expected %s got %s" % (where, exp["scanEcho"], got["scanEcho"]))

            if not defer:
                if got["newStops"] > exp.get("newStops", 0):
                    stop_over.append(where)
                elif got["newStops"] < exp.get("newStops", 0):
                    stop_under.append(where)
                for k in C.DIM_KEYS:
                    e_v, g_v = exp.get("dimensions", {}).get(k), got["dimensions"][k]
                    if e_v is None:
                        continue
                    if g_v > e_v:
                        dim_over.append("%s %s %d>%d" % (where, k, g_v, e_v))
                    elif g_v < e_v:
                        dim_under.append("%s %s %d<%d" % (where, k, g_v, e_v))
                if exp.get("confidence") and got["confidence"] != exp["confidence"]:
                    conf_bad.append("%s expected %s got %s" % (where, exp["confidence"], got["confidence"]))
            else:
                pending.append("%s dims/confidence/newStops (adjudication pending)" % where)

            # P6: <=1 trigger-created stop per checkpoint; 0 at K1
            if got["newStops"] > 1 or (cp == "K1" and got["newStops"] != 0):
                prop_fail["P6"].append(where)
            # P3/P4 monotone
            if prev_dims:
                for k in C.DIM_KEYS:
                    if got["dimensions"][k] < prev_dims[k]:
                        prop_fail["P3"].append("%s %s decreased" % (where, k))
                        prop_fail["P4"].append(where)
            prev_dims = got["dimensions"]

        # P1/P2 from the tool's own final state
        ids = {f["trigger"] for f in state["fired"]}
        floors = state["floors"]
        last = verdicts[max(verdicts, key=C.CHECKPOINT_ORDER.index)]["dimensions"]
        if ids and ids <= C.MECHANICAL:
            for k in ("adr", "openspec", "evidence.targeted"):
                if last[k] > floors[k]:
                    prop_fail["P1"].append("%s %s above floor" % (seed_id, k))
            if last["stops"] > floors["stops"]:
                prop_fail["P1"].append("%s stops above floor" % seed_id)
        if ids and ids <= C.MATERIALITY:
            if last["review"] > max(1, floors["review"]):
                prop_fail["P2"].append("%s review > 1" % seed_id)
            if last["evidence.breadth"] > floors["evidence.breadth"]:
                prop_fail["P2"].append("%s evidence.breadth moved" % seed_id)

    # ---- acceptance evaluation --------------------------------------------------------------
    over_mat_seeds = {x.split("@")[0] for x in over["materiality"]}
    results = {
        "A1 materiality under-detection = 0": not under["materiality"] and not stop_under,
        "A2 stop over-detection = 0": not stop_over,
        "A3 non-stop materiality over-detection <= 2 seeds": len(over_mat_seeds) <= 2 and not dim_over,
        "A4 mechanical mis-detection <= 1/direction": len(over["mechanical"]) <= 1 and len(under["mechanical"]) <= 1,
        "A5 properties P1-P6 = 100%": not any(prop_fail.values()),
        "A6 citations on every raise": not prop_fail["P5"],
        "A7 scan determinism": not determinism_bad,
        "A8 confidence honesty": not conf_bad,
        "dims/echo exact": not dim_under and not echo_bad,
    }
    ok = all(results.values())

    lines.append("# chaos-classify corpus run — %s mode" % ("scan-only" if args.scan_only else "full"))
    lines.append("")
    for name, passed in results.items():
        lines.append("- [%s] %s" % ("PASS" if passed else "FAIL", name))
    lines.append("")
    sem_hits = sum(1 for _, _, hit in semantic if hit)
    sem_scored = [s for s in semantic if not args.scan_only]
    lines.append("Semantic subset (adjudication-only firings): %d/%d hit%s" % (
        sem_hits, len(semantic),
        " (scored in full mode only)" if args.scan_only else ""))
    if pending:
        lines.append("Pending adjudication: %d checks deferred" % len(pending))
    for label, items in (
            ("materiality UNDER", under["materiality"]), ("stop UNDER", stop_under),
            ("stop OVER", stop_over), ("materiality OVER", over["materiality"]),
            ("mechanical UNDER", under["mechanical"]), ("mechanical OVER", over["mechanical"]),
            ("dims OVER", dim_over), ("dims UNDER", dim_under),
            ("confidence", conf_bad), ("scanEcho", echo_bad),
            ("determinism", determinism_bad)):
        for item in items:
            lines.append("  ! %s: %s" % (label, item))
    for p, items in prop_fail.items():
        for item in items:
            lines.append("  ! %s: %s" % (p, item))

    report = "\n".join(lines)
    print(report)
    if args.report:
        open(args.report, "w", encoding="utf-8").write(report + "\n")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
