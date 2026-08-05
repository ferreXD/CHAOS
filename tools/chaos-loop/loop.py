#!/usr/bin/env python3
"""chaos-loop — the frame/close composites (wall-clock option 1).

Design of record: docs/design/2026-08-04-wall-clock-lever-plan.md §Option 1.

The measured chaos:run loop issued 22 governance-CLI invocations per band-A change
(product-conditions T1), three of them `--help`. This composer collapses the two dense
clusters — the 8-invocation frame chain and the 7-invocation close chain — into two
call pairs, each shaped as: ONE tool call that returns a consolidated packet, ONE model
deliberation that authors a single input file, ONE tool call that commits it.

    loop frame  ........ digest-check + scan k1  ->  frame packet
    loop frame-commit .. merge raises + contract.json + frame record (judgement filled
                         from the input file) + render --write  ->  S1 presentation
    loop close  ........ final rescan (K3) + k4 + verify record (when owed, with the
                         independent re-run) + deliver record + advisory audit
                         ->  close packet.  ABORTS fail-closed if the rescan fires,
                         demands a stop, or finds new surface (back to the work loop).
    loop close-commit .. judgement filled from the input file + obligation audit
                         (hard gate) + render --write  ->  close summary

WHAT THIS TOOL CHANGES — the call surface only. It imports the existing tools and runs
their own entry points in-process (scan.main / record.main / render.main, digest.check,
audit.run_audit); it re-implements none of their logic, so the artifact set is
byte-identical to the granular path (enforced by test_chaos_loop.py's parity test).
Every internal step still persists its own scan/verdict-<seq>.md, packet-<seq>.json,
TRG-* ledger events, records/*.facts.json — nothing is skipped, folded, or summarized
away in the artifacts.

WHAT THIS TOOL NEVER DOES — author judgement (the L4-D5 honesty guard, inherited).
Contract statements, raises, verdicts, assessments, rationale, coverage, findings all
arrive agent-authored in the input file; the tool only moves those bytes into the
records (the digest --stamp principle) and FAILS CLOSED when a required judgement
field is missing or empty. What stays agent work outside any input file: the runtime
decision + ledger RUN-DEC-* entry, the resume capsule, OpenSpec/ADR artifacts owed at
a firing, and the implementation itself.

ZERO-TRIGGER SHORT-CIRCUIT (wall-clock option 2; creator sign-off on the S1 authoring
amendment given 2026-08-04, in-session). When — and only when — the TOOL decides the
post-merge frame is zero-trigger (nothing fired, every dimension at its floor, no preset,
path-class map present), `frame-commit` defers the artifact WRITES (contract.json, frame
record, renders) to the close and presents the contract inline at S1 instead. Nothing
about the stop changes: S1 still fires unconditionally (C-11) and still owes its runtime
decision, ledger entry and capsule. The deferred content is validated fail-closed at
frame-commit exactly as on the normal path and persisted verbatim in
`<change-dir>/short-circuit.json` (working state, like scan-inputs.json). If any trigger
fires later, the artifacts are owed AT THE FIRING: `loop materialize` authors them then;
`loop close` aborts fail-closed on a fired-while-still-deferred run, and the obligation
audit asserts a short-circuited change is materialized before it can close. Eligibility is
never agent-requested — there is no opt-in surface, only a conservative `--no-short-circuit`
opt-out.

Exit codes: 0 ok · 1 close-commit audit gate failed · 2 misuse/broken inputs ·
3 close aborted back to the work loop (fail closed on new evidence).
"""

import argparse
import contextlib
import datetime
import io
import json
import os
import re
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
for _sib in ("chaos-scan", "chaos-record", "chaos-render", "chaos-digest",
             "chaos-classify"):
    sys.path.insert(0, os.path.join(_HERE, "..", _sib))
import audit as audit_mod        # noqa: E402
import digest as digest_mod      # noqa: E402
import record as record_mod      # noqa: E402
import render as render_mod      # noqa: E402
import scan as scan_mod          # noqa: E402
from classify import DIM_KEYS, compute_dimensions  # noqa: E402

STATEMENT_ID_RE = re.compile(r"^C-\d{3}$")


class LoopError(Exception):
    pass


class LoopAbort(Exception):
    """Close must not proceed — new evidence sends the run back to the work loop."""


def _read(path):
    with open(path, encoding="utf-8-sig") as f:
        return f.read()


def _load_json(path):
    return json.loads(_read(path))


def _dump_record(path, data):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def _now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _call(main_fn, argv):
    """Run a sibling tool's own main() in-process, capturing its report."""
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = main_fn(argv)
    return code, out.getvalue(), err.getvalue()


def _require(cond, msg):
    if not cond:
        raise LoopError(msg)


def _latest_verdict(change_dir):
    scan_dir = os.path.join(change_dir, "scan")
    seqs = [int(m.group(1)) for n in (os.listdir(scan_dir) if os.path.isdir(scan_dir) else [])
            for m in [re.match(r"verdict-(\d+)\.md$", n)] if m]
    _require(seqs, "no scan verdict under %s" % scan_dir)
    seq = max(seqs)
    return seq, _read(os.path.join(scan_dir, "verdict-%d.md" % seq))


def _latest_record(change_dir, phase):
    records = os.path.join(change_dir, "records")
    names = sorted(n for n in (os.listdir(records) if os.path.isdir(records) else [])
                   if re.match(r"%s\.pass-\d+\.facts\.json$" % phase, n))
    return os.path.join(records, names[-1]) if names else None


def _load_state_dims(change_dir):
    state = _load_json(os.path.join(change_dir, "classification-state.json"))
    return state, compute_dimensions(state)


def _validate_envelope_judgement(judgement, where):
    _require((judgement.get("verdict") or "").strip(),
             "%s: judgement 'verdict' is missing/empty" % where)
    assessment = judgement.get("assessment") or {}
    for k in ("confidence", "evidenceCoverage", "assumptionLoad"):
        _require((assessment.get(k) or "").strip(),
                 "%s: assessment.%s is missing/empty" % (where, k))
    _require((judgement.get("verdictRationale") or "").strip(),
             "%s: verdictRationale is missing/empty" % where)


def _fill_envelope(rec, judgement, where):
    """Move agent-authored envelope judgement into a facts record. Fails closed on
    anything empty; never touches derived fields."""
    _validate_envelope_judgement(judgement, where)
    assessment = judgement.get("assessment") or {}
    rec["verdict"] = judgement["verdict"]
    rec["assessment"] = {k: assessment[k]
                         for k in ("confidence", "evidenceCoverage", "assumptionLoad")}
    rec["verdictRationale"] = judgement["verdictRationale"]
    if judgement.get("commentary") is not None:
        rec["commentary"] = judgement["commentary"]
    if judgement.get("confidenceLimiters") is not None:
        rec["confidenceLimiters"] = judgement["confidenceLimiters"]


# --- frame ---------------------------------------------------------------------------------


def cmd_frame(args):
    lines = []

    code, report = digest_mod.check(args.digest, args.root)
    if code == 0:
        digest_note = ("FRESH — read %s now, once, in one step; do NOT open the source "
                       "references" % args.digest)
    else:
        digest_note = ("STALE/MISSING (exit %d) — never read it for content; fall back to "
                       "the skill's source list, record the degradation in the frame "
                       "judgement, recommend chaos:sync at close" % code)

    k1 = ["k1", "--change-dir", args.change_dir,
          "--intent", args.intent, "--scope", args.scope]
    for s in args.subject or []:
        k1 += ["--subject", s]
    if args.run:
        k1 += ["--run", args.run]
    if args.declared:
        k1 += ["--declared", args.declared]
    if args.mode:
        k1 += ["--mode", args.mode]
    if args.no_map:
        k1 += ["--no-map"]
    else:
        k1 += ["--map", args.map]
    for p in args.posture or []:
        k1 += ["--posture", p]
    code, out, err = _call(scan_mod.main, k1)
    _require(code == 0, "scan k1 failed (exit %d): %s" % (code, err.strip() or out.strip()))

    seq, verdict = _latest_verdict(args.change_dir)
    _, dims = _load_state_dims(args.change_dir)
    due = "- adjudication: DUE" in verdict
    packet = os.path.join(args.change_dir, "scan", "packet-%d.json" % seq)

    lines += ["# Frame packet — %s" % os.path.basename(os.path.abspath(args.change_dir)),
              "",
              "## Governance digest: %s" % digest_note,
              "",
              "## K1 verdict (scan/verdict-%d.md)" % seq, "",
              verdict.rstrip(), ""]
    if due:
        lines += ["## Adjudication is DUE",
                  "Judge %s at ceiling per tools/chaos-classify/adjudication-prompt.md "
                  "(raise-only, cites mandatory). Your raises go in the input file below — "
                  "an empty list records that you judged and raised nothing." % packet, ""]
    owed = []
    if dims["openspec"] >= 1:
        owed.append("openspec depth %d — author the %s NOW, before S1 (artifacts owed by a "
                    "classification are authored when the obligation fires)"
                    % (dims["openspec"],
                       "delta spec" if dims["openspec"] == 1 else "full set (hard gate)"))
    if dims["adr"] >= 2:
        owed.append("adr 2 — an ADR file is owed; author it before S1")
    if owed:
        lines += ["## Owed before S1"] + ["- %s" % o for o in owed] + [""]
    if ("- fired: none" in verdict and args.mode is None and not args.no_map):
        lines += ["## Short-circuit: provisionally eligible (tool-decided at frame-commit)",
                  "If your raises leave this frame zero-trigger, frame-commit defers the "
                  "artifact writes to close and presents the contract inline at S1. The "
                  "stop itself is unchanged. `--no-short-circuit` opts out.", ""]
    lines += [
        "## Next: ONE deliberation, then frame-commit",
        "Author a single input file (JSON) and run:",
        "  python tools/chaos-loop/loop.py frame-commit --change-dir %s --run <runId> \\"
        % args.change_dir,
        "      --input <file> --title \"<change title>\"",
        "",
        "Input file shape:",
        "  {",
        '   "raises": [%s],' % ("{...}  // judged at ceiling; [] = nothing to raise"
                                if due else "  // omit — adjudication is NOT due"),
        '   "contract": {"groups": ["..."], "statements": [{"id": "C-001", "group": "...", '
        '"text": "..."}]},',
        '   "record": {"verdict": "...", "assessment": {"confidence": "...", '
        '"evidenceCoverage": "...", "assumptionLoad": "..."},',
        '              "verdictRationale": "...", "commentary": null, '
        '"confidenceLimiters": [...],',
        '              "facts": {... sourceManifest / risk / framingTraceability%s ...}}'
        % (" / openspec status+invocationPath+confidenceImpact" if dims["openspec"] >= 1
           else ""),
        "  }",
        "",
        "frame-commit merges raises, writes records/contract.json, emits + fills the frame "
        "record, renders, and prints the S1 stop presentation. The runtime decision, the "
        "RUN-DEC-* ledger entry, and the resume capsule stay YOURS at the stop.",
    ]
    print("\n".join(lines))
    return 0


def _merge_raises(change_dir, raises, run_id):
    """The merge step of scan's two-call pattern, in-process (same code path scan.main
    uses: validate, then re-run the last checkpoint with the adjudication applied)."""
    scan_mod.validate_raises(raises)
    inputs = scan_mod.load_inputs(change_dir)
    last = inputs.get("lastCheckpoint")
    _require(last, "nothing to merge into — no prior scan call")
    return scan_mod.run_checkpoint(change_dir, last, inputs,
                                   adjudication={"raises": raises}, run_id=run_id)


def _validate_contract(contract_in):
    statements = (contract_in or {}).get("statements") or []
    _require(statements, "contract.statements is empty — the contract is the frame's core "
                         "judgement; there is nothing to commit without it")
    seen = set()
    for s in statements:
        sid = s.get("id") or ""
        _require(STATEMENT_ID_RE.match(sid), "contract statement id %r is not C-NNN" % sid)
        _require(sid not in seen, "duplicate contract statement id %s" % sid)
        seen.add(sid)
        _require((s.get("text") or "").strip(), "contract statement %s has empty text" % sid)
    return statements


def _write_contract(change_dir, contract_in, run_id, source_command):
    statements = _validate_contract(contract_in)
    contract = {
        "schemaVersion": 1,
        "recordType": "contract",
        "changeId": os.path.basename(os.path.abspath(change_dir)),
        "sourceCommand": source_command,
        "run": run_id,
        "recordedAt": _now(),
    }
    if contract_in.get("groups"):
        contract["groups"] = contract_in["groups"]
    contract["statements"] = statements
    path = os.path.join(change_dir, "records", "contract.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    _dump_record(path, contract)
    return path


def _author_frame_artifacts(change_dir, run, source_command, mode, title,
                            contract_in, judgement, root):
    """The frame's artifact WRITES: contract.json + frame record (judgement filled from
    agent-authored content) + render. Shared verbatim by the normal frame-commit path and
    by materialization of a short-circuited frame — that is what keeps the two paths'
    artifacts identical."""
    _write_contract(change_dir, contract_in, run, source_command)

    emit = ["frame", "--change-dir", change_dir, "--run", run,
            "--source-command", source_command]
    if mode:
        emit += ["--mode", mode]
    if title:
        emit += ["--title", title]
    code, out, err = _call(record_mod.main, emit)
    _require(code == 0, "record frame failed (exit %d): %s" % (code, err.strip()))
    rec_path = json.loads(out)["written"]

    rec = _load_json(rec_path)
    _fill_envelope(rec, judgement, "frame record")
    facts_in = dict(judgement.get("facts") or {})
    facts_openspec = facts_in.pop("openspec", None)   # always popped: openspec is filled
    openspec_in = judgement.get("openspec") or facts_openspec  # field-wise, never merged
    if openspec_in:
        derived = rec["facts"]["openspec"]
        _require(derived.get("depth", 0) >= 1,
                 "openspec judgement supplied but the classified depth is 0 — the derived "
                 "NOT_INVOKED facts are the record; nothing to fill")
        for k in ("status", "invocationPath", "confidenceImpact"):
            if (openspec_in.get(k) or "").strip():
                derived[k] = openspec_in[k]
    for k, v in facts_in.items():
        _require(not rec["facts"].get(k),
                 "facts.%s is derived and non-empty — the input file must not overwrite "
                 "derived facts" % k)
        rec["facts"][k] = v
    _dump_record(rec_path, rec)

    change_id = os.path.basename(os.path.abspath(change_dir))
    code, out, err = _call(render_mod.main, [change_id, "--root", root, "--write"])
    _require(code == 0, "render --write failed (exit %d): %s"
             % (code, (err or out).strip()))
    return rec_path


# --- zero-trigger short-circuit (option 2) -------------------------------------------------


def _marker_path(change_dir):
    return os.path.join(change_dir, "short-circuit.json")


def _load_marker(change_dir):
    p = _marker_path(change_dir)
    return _load_json(p) if os.path.isfile(p) else None


def _short_circuit_eligible(change_dir):
    """TOOL-decided, never agent-requested. Eligible only when the post-merge frame is
    zero-trigger in the strict sense: nothing fired, every dimension sitting exactly on
    its floor, no preset floors, and a path-class map present (a --no-map run can never
    short-circuit: M2 was structurally blind, so 'fired: none' is not evidence of an
    immaterial change — the D4/D5 lesson)."""
    inputs = scan_mod.load_inputs(change_dir)
    state, dims = _load_state_dims(change_dir)
    floors = state.get("floors", {})
    return (inputs.get("mode") is None
            and not inputs.get("noMap")
            and not state.get("fired")
            and all(dims[k] == floors.get(k, 0) for k in DIM_KEYS))


def cmd_frame_commit(args):
    inp = _load_json(args.input)
    _, verdict_before = _latest_verdict(args.change_dir)
    due = "- adjudication: DUE" in verdict_before

    raises = inp.get("raises")
    if due:
        _require(raises is not None,
                 "adjudication is DUE but the input file has no 'raises' key — judge the "
                 "packet at ceiling first ([] records that you raised nothing)")
        _merge_raises(args.change_dir, raises, args.run)
    else:
        _require(not raises,
                 "input carries raises but adjudication is NOT due — raises outside the "
                 "two-call pattern are refused (C-12)")

    inputs = scan_mod.load_inputs(args.change_dir)
    mode = args.mode or inputs.get("mode")
    judgement = inp.get("record") or {}

    # Fail closed NOW on both paths: deferral moves the writes, never the validation.
    _validate_contract(inp.get("contract"))
    _validate_envelope_judgement(judgement, "frame record")
    facts_in = judgement.get("facts") or {}
    # An ECHO is not an overwrite. The frame packet shows the model the derived intent, so
    # copying it back verbatim is the natural thing to do and used to cost a hard failure and
    # a round trip. Only a value that actually DIFFERS is an attempt to overwrite a derived
    # fact, and that still fails closed. Same doctrine, one less way to trip over it.
    if "intent" in facts_in:
        _require(facts_in["intent"] == inputs.get("intent"),
                 "facts.intent is derived (verbatim from scan-inputs) and the input file "
                 "supplies a DIFFERENT value — derived facts must not be overwritten.\n"
                 "  derived: %r\n  supplied: %r\n"
                 "Drop the key (it is filled for you), or make it byte-identical."
                 % (inputs.get("intent"), facts_in["intent"]))
        facts_in.pop("intent")
    if args.title and "title" in facts_in:
        _require(facts_in["title"] == args.title,
                 "facts.title conflicts with --title — the argument is the derived source.\n"
                 "  --title: %r\n  supplied: %r" % (args.title, facts_in["title"]))
        facts_in.pop("title")

    if _short_circuit_eligible(args.change_dir) and not args.no_short_circuit:
        marker = {"status": "deferred", "decidedBy": "tool",
                  "run": args.run, "mode": mode, "title": args.title,
                  "sourceCommand": args.source_command,
                  "contract": inp["contract"], "record": judgement}
        _write_marker = _marker_path(args.change_dir)
        _dump_record(_write_marker, marker)
        seq, verdict = _latest_verdict(args.change_dir)
        statements = inp["contract"]["statements"]
        lines = ["# S1 — frame approval stop (short-circuit: artifact writes deferred)", "",
                 "The TOOL decided this frame is zero-trigger (nothing fired, vector at "
                 "floors, no preset): contract.json, the frame record and the renders are "
                 "deferred to close (%s). The stop itself is UNCHANGED — present the "
                 "contract inline below, surface the decision, write the ledger entry and "
                 "the capsule, STOP." % os.path.basename(_write_marker), "",
                 "## Verdict of record (scan/verdict-%d.md)" % seq, "", verdict.rstrip(), "",
                 "## Contract (inline — present verbatim in the decision text)"]
        lines += ["- %s: %s" % (s["id"], s["text"]) for s in statements]
        lines += ["",
                  "## Present to the human now",
                  "- intent (verbatim): %s" % inputs.get("intent", ""),
                  "- the verdict + the inline contract above",
                  "- surface exactly ONE runtime decision with approves-change: true "
                  "(`folds: <n>` on the ledger entry)",
                  "- write the RUN-DEC-* ledger entry and the resume capsule AT stop "
                  "creation, then STOP (mustStop)",
                  "",
                  "If ANY trigger fires at a later scan: run "
                  "`python tools/chaos-loop/loop.py materialize --change-dir %s --run %s` "
                  "AT THE FIRING, before that surface is implemented further. Otherwise "
                  "`loop close` materializes automatically." % (args.change_dir, args.run)]
        print("\n".join(lines))
        return 0

    rec_path = _author_frame_artifacts(args.change_dir, args.run, args.source_command,
                                       mode, args.title, inp.get("contract"), judgement,
                                       args.root)

    seq, verdict = _latest_verdict(args.change_dir)
    _, dims = _load_state_dims(args.change_dir)
    lines = ["# S1 — frame approval stop (the run's one unconditional stop, C-11)", "",
             "Committed: records/contract.json (%d statement(s)) · %s · render --write ok"
             % (len(inp["contract"]["statements"]), os.path.basename(rec_path)), "",
             "## Verdict of record (scan/verdict-%d.md)" % seq, "", verdict.rstrip(), ""]
    owed = []
    if dims["openspec"] >= 1:
        owed.append("openspec depth %d — the %s must exist BEFORE this stop is presented "
                    "(authored at the firing, approved together with the contract)"
                    % (dims["openspec"],
                       "delta spec" if dims["openspec"] == 1 else "full OpenSpec set"))
    if dims["adr"] >= 2:
        owed.append("adr 2 — the ADR file must exist BEFORE this stop is presented")
    if owed:
        lines += ["## Owed at this stop (post-merge vector)"] \
            + ["- %s" % o for o in owed] + [""]
    lines += [
             "## Present to the human now",
             "- intent (verbatim): %s" % inputs.get("intent", ""),
             "- the classification verdict above + the contract statements",
             "- surface exactly ONE runtime decision with approves-change: true, folding "
             "every K1-fired question (`folds: <n>` on the ledger entry)",
             "- write the RUN-DEC-* ledger entry and the resume capsule AT stop creation",
             "- then STOP (mustStop). Never proceed on an unanswered recommendation."]
    print("\n".join(lines))
    return 0


def _materialize(change_dir, run, root):
    """Author the deferred frame artifacts from the marker — the same writer the normal
    path uses, so the artifact bytes cannot differ. Facts derive from live state (L4):
    if a trigger fired before materialization, the record shows the then-current vector
    and the TRG ledger carries the timeline."""
    marker = _load_marker(change_dir)
    _require(marker, "no short-circuit.json in %s — nothing to materialize" % change_dir)
    _require(marker.get("status") == "deferred",
             "short-circuit marker is %r — already materialized" % marker.get("status"))
    rec_path = _author_frame_artifacts(
        change_dir, run or marker.get("run"), marker.get("sourceCommand", "chaos:run"),
        marker.get("mode"), marker.get("title"),
        marker.get("contract"), marker.get("record") or {}, root)
    state, _dims = _load_state_dims(change_dir)
    marker["status"] = "materialized"
    marker["materializedAt"] = _now()
    marker["materializedAtScanSeq"] = state.get("scanCount", 0)
    _dump_record(_marker_path(change_dir), marker)
    return rec_path


def cmd_materialize(args):
    rec_path = _materialize(args.change_dir, args.run, args.root)
    print("materialized deferred frame artifacts: records/contract.json · %s · rendered.\n"
          "If a trigger firing prompted this, author the artifacts IT owes (openspec/ADR) "
          "now as well, before implementing that surface further."
          % os.path.basename(rec_path))
    return 0


# --- close ---------------------------------------------------------------------------------


def _scan_or_abort(change_dir, argv, label):
    code, out, err = _call(scan_mod.main, argv)
    _require(code == 0, "scan %s failed (exit %d): %s" % (label, code, err.strip()))
    seq, verdict = _latest_verdict(change_dir)
    problems = []
    if re.search(r"^- FIRED ", verdict, re.MULTILINE):
        problems.append("a trigger fired")
    if "- stops: +" in verdict:
        problems.append("a stop is demanded")
    if "- stops: ABSORBED" in verdict:
        problems.append("a pending stop absorbed new questions")
    if "- adjudication: DUE" in verdict:
        problems.append("adjudication is due (new surface)")
    if problems:
        raise LoopAbort(
            "close aborted at %s — %s. This is new evidence: re-enter the work loop "
            "(author owed artifacts at the firing, surface the stop, adjudicate via the "
            "granular scan commands), then run `loop close` again.\n\n%s"
            % (label, "; ".join(problems), verdict.rstrip()))
    return seq, verdict


def cmd_close(args):
    k3_seq, k3 = _scan_or_abort(
        args.change_dir,
        ["rescan", "--change-dir", args.change_dir] + (["--run", args.run] if args.run else []),
        "the final rescan (K3)")

    if args.self_review == "fail":
        # Record the honest verdict, then abort: a run whose self-review found issues is
        # not ready to close — X2's raised obligations route it back through the loop.
        code, _out, err = _call(scan_mod.main, ["k4", "--change-dir", args.change_dir,
                                                "--self-review", "fail"]
                                + (["--run", args.run] if args.run else []))
        _require(code == 0, "scan k4 failed (exit %d): %s" % (code, err.strip()))
        _, verdict = _latest_verdict(args.change_dir)
        raise LoopAbort("close aborted — self-review verdict is 'fail', so X2 fired and "
                        "raised review/verify mechanically (C-3). Route to the independent "
                        "review pass, repair, rescan, then run `loop close` again with "
                        "--self-review clean.\n\n%s" % verdict.rstrip())

    k4_seq, k4 = _scan_or_abort(
        args.change_dir,
        ["k4", "--change-dir", args.change_dir, "--self-review", "clean"]
        + (["--run", args.run] if args.run else []),
        "the self-review checkpoint (K4)")

    state, dims = _load_state_dims(args.change_dir)
    inputs = scan_mod.load_inputs(args.change_dir)
    mode = args.mode or inputs.get("mode")

    materialized_here = False
    marker = _load_marker(args.change_dir)
    if marker and marker.get("status") == "deferred":
        if state.get("fired"):
            raise LoopAbort(
                "a trigger fired while the frame artifacts were still deferred "
                "(short-circuit) — they were owed AT THE FIRING, before that surface was "
                "implemented further. Run `loop materialize --change-dir %s --run %s` NOW, "
                "author whatever the firing itself owes (openspec/ADR), record the timing "
                "deviation with a RUN-DEC-* ref in the deliver judgement, then run "
                "`loop close` again." % (args.change_dir, args.run))
        # zero-trigger happy path: the deferred writes reappear here, inside the close
        _materialize(args.change_dir, args.run, args.root)
        materialized_here = True

    verify_path = None
    if dims["verify"] >= 1:
        emit = ["verify", "--change-dir", args.change_dir, "--run", args.run,
                "--source-command", args.source_command, "--run-checks",
                "--build-cmd", args.build_cmd, "--test-cmd", args.test_cmd]
        if mode:
            emit += ["--mode", mode]
        if args.openspec_validate_cmd:
            emit += ["--openspec-validate-cmd", args.openspec_validate_cmd]
        for r in args.rule or []:
            emit += ["--rule", r]
        code, out, err = _call(record_mod.main, emit)
        _require(code == 0, "record verify failed (exit %d): %s" % (code, err.strip()))
        verify_path = json.loads(out)["written"]

    emit = ["deliver", "--change-dir", args.change_dir, "--run", args.run,
            "--source-command", args.source_command,
            "--build-cmd", args.build_cmd, "--test-cmd", args.test_cmd]
    if mode:
        emit += ["--mode", mode]
    if args.build_log:
        emit += ["--build-log", args.build_log]
    if args.test_log:
        emit += ["--test-log", args.test_log]
    for r in args.rule or []:
        emit += ["--rule", r]
    code, out, err = _call(record_mod.main, emit)
    _require(code == 0, "record deliver failed (exit %d): %s" % (code, err.strip()))
    deliver_path = json.loads(out)["written"]
    deliver = _load_json(deliver_path)

    advisory = audit_mod.run_audit(
        os.path.join(args.change_dir, "classification-state.json"),
        os.path.join(args.change_dir, "decision-events.md"),
        args.change_dir, args.openspec_dir, args.adr_dir)
    failures = [c for c in advisory["assertions"] if not c["pass"]]

    coverage_ids = [c["statement"] for c in deliver["facts"]["coverage"]]
    scope_drift_open = not deliver["facts"]["scopeDrift"].get("status")
    verify_rec = _load_json(verify_path) if verify_path else None

    lines = ["# Close packet — %s" % os.path.basename(os.path.abspath(args.change_dir)), "",
             "## Final rescan (K3, scan/verdict-%d.md): clean — no new firing, no stop "
             "demanded" % k3_seq,
             "## Self-review (K4, scan/verdict-%d.md): clean" % k4_seq,
             "## Dimensions: " + " · ".join("%s %d" % (k, dims[k]) for k in DIM_KEYS), ""]
    if materialized_here:
        lines += ["## Short-circuit: deferred frame artifacts materialized now "
                  "(contract.json + frame record + render) — zero-trigger held end to end",
                  ""]
    if verify_path:
        checks = verify_rec["facts"]["checks"]
        lines += ["## Verify record emitted (%s) — independent re-run (L4-D4)"
                  % os.path.basename(verify_path),
                  "- build: %s · tests: %s"
                  % (json.dumps(checks.get("build", {})), json.dumps(checks.get("tests", {}))),
                  ""]
    lines += ["## Deliver record emitted (%s)" % os.path.basename(deliver_path),
              "- build: %s" % json.dumps(deliver["facts"]["build"]),
              "- tests: %s" % json.dumps(deliver["facts"]["tests"]),
              "- files: %d touched · coverage rows scaffolded: %s"
              % (len(deliver["facts"]["files"]), ", ".join(coverage_ids) or "none"),
              "- rules scaffolded: %s"
              % (", ".join(r["id"] for r in deliver["facts"]["rules"]) or "none"), ""]
    if scope_drift_open:
        lines += ["## Scope drift happened (M5 fired) — the story is judgement: fill "
                  "deliver.scopeDrift status/risk/note in the input file", ""]
    if failures:
        lines += ["## Advisory audit: %d failure(s) — repair BEFORE close-commit "
                  "(it is the hard gate there)" % len(failures)]
        lines += ["- %s: %s" % (c["id"], c["detail"]) for c in failures] + [""]
    else:
        lines += ["## Advisory audit: PASS (%d assertions)" % len(advisory["assertions"]), ""]
    lines += [
        "## Next: ONE deliberation, then close-commit",
        "Author a single input file (JSON) and run:",
        "  python tools/chaos-loop/loop.py close-commit --change-dir %s --run <runId> "
        "--input <file>" % args.change_dir,
        "",
        "Input file shape:",
        "  {",
        '   "deliver": {"verdict": "...", "assessment": {...}, "verdictRationale": "...",',
        '               "coverage": [{"statement": "C-001", "covered": true, '
        '"evidence": "test", "refs": [...], "whyNotTest": "..."}, ... ALL of: %s],'
        % (", ".join(coverage_ids) or "—"),
        '               "rules": [{"id": "...", "status": "...", "evidence": "..."}],'
        '  // fill every scaffolded rule',
        '               "deviations": [{"summary": "...", "decision": "RUN-DEC-..."}]%s},'
        % (', "scopeDrift": {"status","risk","note"}' if scope_drift_open else ""),
    ]
    if verify_path:
        lines += ['   "verify": {"verdict": "...", "assessment": {...}, "verdictRationale": '
                  '"...", "archiveReadiness": "...",',
                  '              "traceability": [...], "findings": [...], '
                  '"openspecIsComplete": true|false}']
    lines += ["  }",
              "",
              "Rules moved by close-commit: every coverage row filled (covered boolean; "
              "non-test evidence carries whyNotTest); derived facts never overwritten; the "
              "obligation audit is the hard gate; render --write closes."]
    print("\n".join(lines))
    return 0


def _fill_coverage(rec, coverage_in, where):
    rows = rec["facts"]["coverage"]
    by_id = {c.get("statement"): c for c in coverage_in or []}
    unknown = set(by_id) - {r["statement"] for r in rows}
    _require(not unknown, "%s: coverage names unknown statement(s): %s"
             % (where, ", ".join(sorted(unknown))))
    for row in rows:
        c = by_id.get(row["statement"])
        _require(c is not None, "%s: coverage row %s is missing — every contract statement "
                                "is enumerated exactly once" % (where, row["statement"]))
        _require(isinstance(c.get("covered"), bool),
                 "%s: coverage %s 'covered' must be true or false"
                 % (where, row["statement"]))
        row["covered"] = c["covered"]
        if c["covered"]:
            evidence = (c.get("evidence") or "").strip()
            _require(evidence, "%s: coverage %s covered but 'evidence' is empty"
                     % (where, row["statement"]))
            row["evidence"] = evidence
            if c.get("refs"):
                row["refs"] = c["refs"]
            if evidence != "test":
                _require((c.get("whyNotTest") or "").strip(),
                         "%s: coverage %s has non-test evidence — whyNotTest is mandatory "
                         "(that is what keeps weak evidence visible)"
                         % (where, row["statement"]))
                row["whyNotTest"] = c["whyNotTest"]
        else:
            row["evidence"] = (c.get("evidence") or "").strip()
            if c.get("whyNotTest"):
                row["whyNotTest"] = c["whyNotTest"]


def _fill_rules(rec, rules_in, where):
    rows = rec["facts"].get("rules") or []
    if not rows:
        return
    by_id = {r.get("id"): r for r in rules_in or []}
    for row in rows:
        r = by_id.get(row["id"])
        _require(r is not None, "%s: rule %s scaffolded but not filled" % (where, row["id"]))
        for k in ("status", "evidence"):
            _require((r.get(k) or "").strip(),
                     "%s: rule %s '%s' is empty" % (where, row["id"], k))
            row[k] = r[k]


def cmd_close_commit(args):
    inp = _load_json(args.input)

    deliver_path = _latest_record(args.change_dir, "deliver")
    _require(deliver_path, "no deliver record — run `loop close` first")
    rec = _load_json(deliver_path)
    dj = inp.get("deliver") or {}
    _fill_envelope(rec, dj, "deliver record")
    _fill_coverage(rec, dj.get("coverage"), "deliver record")
    _fill_rules(rec, dj.get("rules"), "deliver record")
    if dj.get("deviations"):
        rec["facts"]["deviations"] = dj["deviations"]
    drift = rec["facts"]["scopeDrift"]
    if not drift.get("status"):
        dr = dj.get("scopeDrift") or {}
        for k in ("status", "risk", "note"):
            _require((dr.get(k) or "").strip(),
                     "deliver record: scope drift happened (M5) — scopeDrift.%s is owed "
                     "judgement" % k)
            drift[k] = dr[k]
    else:
        _require(not dj.get("scopeDrift"),
                 "deliver record: scopeDrift was derived (NO_DRIFT) — the input file must "
                 "not overwrite derived facts")
    _dump_record(deliver_path, rec)

    verify_path = _latest_record(args.change_dir, "verify")
    if verify_path:
        vrec = _load_json(verify_path)
        vj = inp.get("verify")
        _require(vj, "a verify record exists — the input file must carry its judgement "
                     "('verify': verdict/assessment/verdictRationale/archiveReadiness/"
                     "traceability/findings)")
        _fill_envelope(vrec, vj, "verify record")
        _require((vj.get("archiveReadiness") or "").strip(),
                 "verify record: archiveReadiness is missing/empty")
        vrec["facts"]["archiveReadiness"] = vj["archiveReadiness"]
        vrec["facts"]["traceability"] = vj.get("traceability") or []
        vrec["facts"]["findings"] = vj.get("findings") or []
        # checks.contract is a DERIVED join over the latest deliver record's coverage. It was
        # scaffolded before that record existed, so it is a placeholder here; recompute it now
        # that the deliver record above is final. Without this the placeholder reaches the
        # renderer and fails schema validation on a field the model was never asked to author
        # (measured: two consecutive close-commit failures, governed T1 run 3).
        vrec["facts"]["checks"]["contract"] = record_mod.contract_tick_join(args.change_dir)
        openspec_check = vrec["facts"]["checks"].get("openspec")
        if openspec_check and openspec_check.get("isComplete") is None \
                and vj.get("openspecIsComplete") is not None:
            openspec_check["isComplete"] = vj["openspecIsComplete"]
        checks_rules = vrec["facts"]["checks"].get("rules") or []
        if checks_rules:
            by_id = {r.get("id"): r for r in vj.get("rules") or []}
            for row in checks_rules:
                r = by_id.get(row["id"])
                _require(r is not None, "verify record: rule %s scaffolded but not filled"
                         % row["id"])
                for k in ("status", "evidence"):
                    _require((r.get(k) or "").strip(),
                             "verify record: rule %s '%s' is empty" % (row["id"], k))
                    row[k] = r[k]
        _dump_record(verify_path, vrec)
    else:
        _require(not inp.get("verify"),
                 "input carries verify judgement but no verify record exists")

    result = audit_mod.run_audit(
        os.path.join(args.change_dir, "classification-state.json"),
        os.path.join(args.change_dir, "decision-events.md"),
        args.change_dir, args.openspec_dir, args.adr_dir)
    if not result["pass"]:
        failures = [c for c in result["assertions"] if not c["pass"]]
        print("# Close BLOCKED — obligation audit failed (%d)" % len(failures))
        for c in failures:
            print("- %s: %s" % (c["id"], c["detail"]))
        print("\nRepair the owed artifact(s) (a failure naming a stop is governance and "
              "stays yours), then run close-commit again. The audit asserts; it never "
              "authors.")
        return 1

    change_id = os.path.basename(os.path.abspath(args.change_dir))
    code, out, err = _call(render_mod.main, [change_id, "--root", args.root, "--write"])
    _require(code == 0, "render --write failed (exit %d): %s"
             % (code, (err or out).strip()))

    state, dims = _load_state_dims(args.change_dir)
    lines = ["# Close committed — %s" % change_id,
             "- obligation audit: PASS (%d assertions)" % len(result["assertions"]),
             "- dimensions: " + " · ".join("%s %d" % (k, dims[k]) for k in DIM_KEYS),
             "- rendered: " + ", ".join(
                 line.split(":")[0] for line in out.splitlines() if ":" in line)]
    if state.get("floors", {}).get("stops", 0) >= 2:
        lines += ["- S4 — verify sign-off is owed (stops floor >= 2): surface the sign-off "
                  "decision BEFORE terminalizing"]
    lines += ["- finish: chaos_complete_command; recommend chaos:verify only as the "
              "optional extra pass; chaos:archive when ready"]
    print("\n".join(lines))
    return 0


# --- CLI -----------------------------------------------------------------------------------


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(
        description="chaos-loop — frame/close composites over the granular tools")
    sub = ap.add_subparsers(dest="cmd", required=True)

    def common(sp, run_required=True):
        sp.add_argument("--change-dir", required=True, help=".chaos/changes/<change-id>")
        sp.add_argument("--run", required=run_required, default=None,
                        help="commandRunId (stamped on TRG events and records)")
        sp.add_argument("--root", default=".", help="repo root (render/digest/audit)")
        sp.add_argument("--source-command", default="chaos:run")

    fr = sub.add_parser("frame", help="digest-check + k1 -> one frame packet")
    common(fr, run_required=False)
    fr.add_argument("--intent", required=True, help="the change intent, verbatim")
    fr.add_argument("--scope", required=True, help="predicted scope line")
    fr.add_argument("--subject", action="append", required=True,
                    help="C-15 subject path root (repeatable)")
    fr.add_argument("--declared", default="", help="comma list of declaredTriggers")
    fr.add_argument("--mode", default=None, choices=["light", "standard", "strict"])
    fr.add_argument("--map", default=os.path.join(".chaos", "path-class-map.json"))
    fr.add_argument("--no-map", action="store_true")
    fr.add_argument("--posture", action="append", default=[])
    fr.add_argument("--digest", default=digest_mod.DEFAULT_DIGEST)

    fc = sub.add_parser("frame-commit",
                        help="merge + contract + frame record + render -> S1 presentation "
                             "(zero-trigger frames defer the writes to close)")
    common(fc)
    fc.add_argument("--input", required=True, help="the single deliberation file (JSON)")
    fc.add_argument("--title", default=None, help="change title for the frame record")
    fc.add_argument("--mode", default=None, help="override; defaults to the k1 preset")
    fc.add_argument("--no-short-circuit", action="store_true",
                    help="author the frame artifacts before S1 even on a zero-trigger "
                         "frame (conservative opt-out; there is no opt-in)")

    mz = sub.add_parser("materialize",
                        help="author the deferred frame artifacts of a short-circuited "
                             "run NOW (owed at any trigger firing)")
    common(mz)

    cl = sub.add_parser("close",
                        help="final rescan + k4 + verify/deliver records -> one close packet")
    common(cl)
    cl.add_argument("--self-review", required=True, dest="self_review",
                    choices=["clean", "fail"],
                    help="clean = nothing found; fail = issues found (X2 fires, close aborts)")
    cl.add_argument("--build-log", default=None)
    cl.add_argument("--test-log", default=None)
    cl.add_argument("--build-cmd", default="dotnet build")
    cl.add_argument("--test-cmd", default="dotnet test")
    cl.add_argument("--rule", action="append", default=None)
    cl.add_argument("--mode", default=None, help="override; defaults to the k1 preset")
    cl.add_argument("--openspec-dir", default=None)
    cl.add_argument("--adr-dir", action="append", default=None)
    cl.add_argument("--openspec-validate-cmd", default=None)

    cc = sub.add_parser("close-commit",
                        help="fill judgement + obligation audit (hard gate) + render")
    common(cc)
    cc.add_argument("--input", required=True, help="the single deliberation file (JSON)")
    cc.add_argument("--openspec-dir", default=None)
    cc.add_argument("--adr-dir", action="append", default=None)

    args = ap.parse_args(argv)
    try:
        return {"frame": cmd_frame, "frame-commit": cmd_frame_commit,
                "materialize": cmd_materialize,
                "close": cmd_close, "close-commit": cmd_close_commit}[args.cmd](args)
    except LoopAbort as e:
        print("chaos-loop ABORT: %s" % e)
        return 3
    except (LoopError, scan_mod.ScanError, record_mod.RecordError, OSError, ValueError,
            KeyError) as e:
        print("chaos-loop error: %s" % e, file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
