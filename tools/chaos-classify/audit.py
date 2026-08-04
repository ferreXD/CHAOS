#!/usr/bin/env python3
"""chaos-audit — the Stage-D obligation audit (deterministic close gate for chaos:run).

Design of record: docs/design/2026-08-03-cost-bar-and-run-collapse.md section 4.1 — "the
obligation audit becomes a deterministic in-loop assertion... A checklist, not a model pass."
It replaces the model-driven checklist in chaos-verify's Stage-C enforcement section as the
CLOSE gate; chaos:verify remains the human's opt-in extra pass.

Boundary note: classify.py's hard constraint (never read records/*.json) is about
CLASSIFICATION INPUTS — records must not influence what fires. The audit is not a classifier:
it asserts that the artifacts the classification OWES actually exist. It recomputes the owed
vector with classify.compute_dimensions from the persisted state, so the gate can never
disagree with the classifier about what is owed. It never authors anything.

Exit 0 = every assertion passed (the run may close). Exit 1 = failures; each failure names
the owed artifact. Exit 2 = the audit itself could not run (missing/unparseable inputs).
"""

import argparse
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from classify import DIM_KEYS, compute_dimensions, parse_ledger  # noqa: E402


def _read(path):
    with open(path, encoding="utf-8-sig") as f:
        return f.read()


def _has_files(pattern):
    return sorted(p for p in glob.glob(pattern, recursive=True) if os.path.isfile(p))


def run_audit(state_path, ledger_path, change_dir, openspec_dir=None, adr_dirs=None):
    checks = []

    def check(cid, ok, detail):
        checks.append({"id": cid, "pass": bool(ok), "detail": detail})

    state = json.loads(_read(state_path))
    dims = compute_dimensions(state)
    ledger = parse_ledger(_read(ledger_path)) if os.path.exists(ledger_path) else None

    # -- stops: every surfaced decision answered; every placed stop has its ledger entry
    if ledger is None:
        check("stops.ledger-exists", False, "ledger file missing: %s" % ledger_path)
    else:
        unanswered = [e["id"] for e in ledger if not e["answered"]]
        check("stops.all-answered", not unanswered,
              "unanswered: %s" % ", ".join(unanswered) if unanswered
              else "%d entr%s, all resolved" % (len(ledger), "y" if len(ledger) == 1 else "ies"))
        placed = state.get("stopsPlaced", [])
        check("stops.placed-have-entries", len(ledger) >= len(placed),
              "%d ledger entr%s vs %d placed stop(s)%s"
              % (len(ledger), "y" if len(ledger) == 1 else "ies", len(placed),
                 "" if len(ledger) >= len(placed) else " — a placed stop was never surfaced"))

    # -- adr: 2 = ADR file owed; 1 = decision-log entry owed (lives in the ledger)
    if dims["adr"] >= 2:
        dirs = adr_dirs or [os.path.join(change_dir, "adr")]
        found = [f for d in dirs for f in _has_files(os.path.join(d, "*.md"))]
        check("adr.file-exists", bool(found),
              ("found %s" % found[0]) if found
              else "adr 2 owed but no ADR .md under: %s" % ", ".join(dirs))
    elif dims["adr"] == 1:
        check("adr.ledger-entry", bool(ledger),
              "adr 1: decision-log entry owed in the ledger"
              + ("" if ledger else " — ledger missing"))

    # -- openspec: depth 1 = delta spec; depth 2 = proposal + specs
    if dims["openspec"] >= 1:
        if not openspec_dir:
            check("openspec.dir-provided", False,
                  "openspec %d owed but no --openspec-dir given" % dims["openspec"])
        else:
            specs = _has_files(os.path.join(openspec_dir, "specs", "**", "*.md"))
            check("openspec.delta-spec", bool(specs),
                  ("found %d spec file(s)" % len(specs)) if specs
                  else "openspec %d owed but no specs/**.md under %s"
                       % (dims["openspec"], openspec_dir))
            if dims["openspec"] >= 2:
                proposal = os.path.join(openspec_dir, "proposal.md")
                check("openspec.full-set", os.path.isfile(proposal),
                      "proposal.md present" if os.path.isfile(proposal)
                      else "openspec 2 owed but %s missing" % proposal)

    # -- verify: owed => a verify pass record exists (the loop ran it before close)
    if dims["verify"] >= 1:
        recs = _has_files(os.path.join(change_dir, "records", "verify.pass-*.facts.json"))
        check("verify.record-exists", bool(recs),
              ("found %s" % os.path.basename(recs[-1])) if recs
              else "verify %d owed but no records/verify.pass-*.facts.json" % dims["verify"])

    # -- base records: a close always has a frame and a deliver record
    for phase in ("frame", "deliver"):
        recs = _has_files(os.path.join(change_dir, "records", "%s.pass-*.facts.json" % phase))
        check("records.%s-exists" % phase, bool(recs),
              ("found %s" % os.path.basename(recs[-1])) if recs
              else "no records/%s.pass-*.facts.json — the run cannot close without it" % phase)

    # -- structural sanity: the vector never sits below its floors (monotonicity is by
    #    construction; a state file edited by hand shows up here)
    floors = state.get("floors", {})
    below = ["%s %d<%d" % (k, dims[k], floors.get(k, 0))
             for k in DIM_KEYS if dims[k] < floors.get(k, 0)]
    check("dims.at-or-above-floor", not below,
          "; ".join(below) if below else "vector >= floors on all 7 dimensions")

    return {
        "pass": all(c["pass"] for c in checks),
        "dimensions": {k: dims[k] for k in DIM_KEYS},
        "scanCount": state.get("scanCount", 0),
        "assertions": checks,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="Stage-D obligation audit (deterministic close gate)")
    ap.add_argument("--state", required=True, help="classification-state.json")
    ap.add_argument("--ledger", required=True, help="decision-events.md")
    ap.add_argument("--change-dir", required=True, help=".chaos/changes/<change-id>")
    ap.add_argument("--openspec-dir", default=None, help="openspec/changes/<change-id>")
    ap.add_argument("--adr-dir", action="append", default=None,
                    help="where owed ADRs may live (repeatable; default <change-dir>/adr)")
    args = ap.parse_args(argv)

    try:
        result = run_audit(args.state, args.ledger, args.change_dir,
                           args.openspec_dir, args.adr_dir)
    except (OSError, ValueError, KeyError) as e:
        json.dump({"pass": False, "error": "audit could not run: %s" % e}, sys.stdout, indent=2)
        print()
        return 2
    json.dump(result, sys.stdout, indent=2)
    print()
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
