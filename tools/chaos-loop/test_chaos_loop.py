#!/usr/bin/env python3
"""Tests for chaos-loop — above all the ARTIFACT-PARITY GATE (wall-clock option 1).

The composite changes the call surface, never the record: the granular command
sequence (scan k1 / merge / record / render / rescan / k4 / audit) and the composite
pair (frame / frame-commit / close / close-commit) driven with the same inputs must
leave a byte-identical `.chaos/changes/<id>` tree, timestamps excluded. The parity
test drives BOTH paths end-to-end on twin fixture repos and diffs the trees.
"""

import contextlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import loop as L  # noqa: E402

S = L.scan_mod
R = L.record_mod
REN = L.render_mod
A = L.audit_mod

MAP = {
    "classes": {
        "data-store": {"paths": ["src/App/Domain/**"], "surface": "data-store"},
        "secrets": {"paths": ["src/App/Config/**"], "surface": "auth"},
    },
    "m2Classes": ["data-store", "secrets"],
    "x1Thresholds": {"review1": {"files": 8, "loc": 400},
                     "review2": {"files": 20, "loc": 1000}},
    "renameShapeGuard": {"minFiles": 6, "globalAddDeleteRatioTolerance": 0.2,
                         "minFractionFilesWithBothAddsAndDeletes": 0.8},
}

INTENT = "Add a widget summary endpoint."
SCOPE = "scope: src/App/Program.cs + tests/T/Basic.cs"
FIXED_AT = "2026-01-01T00:00:00Z"
# repo-relative, like real runs — an absolute path would differ between the twin
# fixture repos and read as a false parity failure (scan-inputs.json stores the map
# path verbatim; verdict digests embed the change dir verbatim)
MAP_REL = os.path.join(".chaos", "path-class-map.json")
CHANGE_REL = os.path.join(".chaos", "changes", "demo")

LEDGER = """# Decision Events — demo

## RUN-DEC-001 — Approve the frame

- status: ANSWERED (test, 2026-01-01)
- approves-change: true
- answer: A — frame approved as authored.
- folds: 1
"""

CONTRACT_IN = {
    "groups": ["Endpoint", "Non-regression"],
    "statements": [
        {"id": "C-001", "group": "Endpoint",
         "text": "`GET /widgets/summary` returns HTTP 200 with `{ \"total\": <integer> }`."},
        {"id": "C-002", "group": "Non-regression",
         "text": "All existing behaviour is unchanged: the baseline tests still pass."},
    ],
}

FRAME_J = {
    "verdict": "READY_FOR_REVIEW",
    "assessment": {"confidence": "HIGH", "evidenceCoverage": "COMPLETE",
                   "assumptionLoad": "LOW"},
    "verdictRationale": "Intent, scope and contract are complete and testable "
                        "against the green baseline.",
    "commentary": "Zero-trigger K1; vector at floors.",
    "facts": {
        "sourceManifest": [
            {"path": "src/App/Program.cs", "role": "the surface", "knowledge": "FACT"}],
        "risk": {"class": "LOW", "classRationale": "Additive read-only route.",
                 "items": []},
    },
}

DELIVER_J = {
    "verdict": "APPLIED",
    "assessment": {"confidence": "HIGH", "evidenceCoverage": "COMPLETE",
                   "assumptionLoad": "LOW"},
    "verdictRationale": "Both statements delivered and covered; build and tests green; "
                        "the diff never left the approved scope.",
    "commentary": "Coverage enumerates every contract statement exactly once.",
    "coverage": [
        {"statement": "C-001", "covered": True, "evidence": "test",
         "refs": ["tests/T/Basic.cs::Summary_total"]},
        {"statement": "C-002", "covered": True, "evidence": "code",
         "refs": ["src/App/Program.cs — baseline registrations untouched"],
         "whyNotTest": "Non-regression of an untouched surface: the baseline suite "
                       "already asserts it."},
    ],
}

BUILD_LOG = "    0 Warning(s)\n    0 Error(s)\n"
TEST_LOG = "Passed!  - Failed: 0, Passed: 8, Skipped: 0, Total: 8\n"


def _quiet(fn, argv):
    out = io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
        code = fn(argv)
    return code, out.getvalue()


class LoopFixture(unittest.TestCase):
    def setUp(self):
        self.cwd = os.getcwd()
        self.tds = []

    def tearDown(self):
        os.chdir(self.cwd)
        for td in self.tds:
            shutil.rmtree(td, ignore_errors=True)

    def _mk_repo(self):
        td = tempfile.mkdtemp()
        self.tds.append(td)
        os.chdir(td)
        subprocess.run(["git", "init", "-q", "-b", "main"], check=True, capture_output=True)
        subprocess.run(["git", "config", "user.email", "t@t"], check=True)
        subprocess.run(["git", "config", "user.name", "t"], check=True)
        self._write(td, "src/App/Program.cs", "class Program {}\n")
        self._write(td, "tests/T/Basic.cs", "class Basic {}\n")
        self._write(td, MAP_REL, json.dumps(MAP))
        subprocess.run(["git", "add", "."], check=True, capture_output=True)
        subprocess.run(["git", "commit", "-q", "-m", "base"], check=True,
                       capture_output=True)
        return td

    @staticmethod
    def _write(td, rel, content):
        path = os.path.join(td, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        return path

    @staticmethod
    def _change(td):
        return os.path.join(td, ".chaos", "changes", "demo")

    def _work_edit(self, td, rel="src/App/Program.cs",
                   content="class Program {}\n// summary route\n"):
        self._write(td, rel, content)

    def _work_rescan(self, td):
        """The WORK-LOOP rescan (skill step 2): the first K3 over a fresh diff always
        finds new surface paths, so adjudication is due there — granular, by design.
        `loop close`'s own final rescan then only verifies nothing changed since."""
        change = CHANGE_REL
        code, _ = _quiet(S.main, ["rescan", "--change-dir", change, "--run", "RUN-1"])
        self.assertEqual(code, 0)
        _seq, verdict = L._latest_verdict(change)
        if "- adjudication: DUE" in verdict:
            raises = self._write(td, "k3-raises.json", json.dumps({"raises": []}))
            code, _ = _quiet(S.main, ["merge", "--change-dir", change, "--run", "RUN-1",
                                      "--raises", raises])
            self.assertEqual(code, 0)

    def _assert_no_record(self, td, prefix):
        records = os.path.join(self._change(td), "records")
        names = os.listdir(records) if os.path.isdir(records) else []
        self.assertFalse(any(n.startswith(prefix) for n in names))

    def _logs(self, td):
        return (self._write(td, "build.log", BUILD_LOG),
                self._write(td, "test.log", TEST_LOG))

    # -- the composite arm ------------------------------------------------------------

    def _frame_composite(self, td, raises=None, record=None):
        change = CHANGE_REL
        code, out = _quiet(L.main, [
            "frame", "--change-dir", change, "--run", "RUN-1",
            "--intent", INTENT, "--scope", SCOPE,
            "--subject", "src", "--subject", "tests",
            "--map", MAP_REL, "--root", td])
        self.assertEqual(code, 0, out)
        inp = {"contract": CONTRACT_IN, "record": record or FRAME_J}
        if raises is not None:
            inp["raises"] = raises
        p = self._write(td, "frame-input.json", json.dumps(inp))
        code, out = _quiet(L.main, [
            "frame-commit", "--change-dir", change, "--run", "RUN-1",
            "--input", p, "--title", "Widget summary endpoint", "--root", td])
        return code, out

    def _garbage_cmds(self, td):
        """Commands that run fine but emit output no parser can read.

        `record verify` re-runs the checks, so this is what a real run hits whenever the build
        or test tool changes its output format — the counts come back underivable.
        """
        self._write(td, "emit_junk.py", "print('nothing a parser can read here')")
        cmd = '"%s" emit_junk.py' % sys.executable
        return cmd, cmd

    def _echo_cmds(self, td):
        """Build/test commands that replay the fixture logs.

        `record verify` re-RUNS the checks (L4-D4 independence) rather than reading a log, so
        a fixture that owes a verify record needs commands that actually emit parseable
        output. Without them `parse_build`/`parse_tests` leave the integer fields empty and
        the record cannot render — the same shape as the contract-join defect, in a field this
        fix does not touch.
        """
        self._write(td, "emit_build.py", "print(open('build.log').read())")
        self._write(td, "emit_test.py", "print(open('test.log').read())")
        return ('"%s" emit_build.py' % sys.executable, '"%s" emit_test.py' % sys.executable)

    def _close_composite(self, td, self_review="clean", deliver_j=None, verify_j=None,
                         real_checks=False, garbage_checks=False):
        change = CHANGE_REL
        build_log, test_log = self._logs(td)
        argv = ["close", "--change-dir", change, "--run", "RUN-1",
                "--self-review", self_review,
                "--build-log", build_log, "--test-log", test_log, "--root", td]
        if real_checks or garbage_checks:
            # Opt-in ONLY. The recorded command string lands in the record and therefore in
            # change.md, so overriding it here for every caller would make the granular and
            # composite arms diverge and read as a parity failure that isn't one.
            build_cmd, test_cmd = (self._garbage_cmds(td) if garbage_checks
                                   else self._echo_cmds(td))
            argv += ["--build-cmd", build_cmd, "--test-cmd", test_cmd]
        code, out = _quiet(L.main, argv)
        if code != 0:
            return code, out
        payload = {"deliver": deliver_j or DELIVER_J}
        if verify_j is not None:
            payload["verify"] = verify_j
        p = self._write(td, "close-input.json", json.dumps(payload))
        return _quiet(L.main, ["close-commit", "--change-dir", change, "--run", "RUN-1",
                               "--input", p, "--root", td])

    def _drive_composite(self, td):
        code, out = self._frame_composite(td, raises=[])
        self.assertEqual(code, 0, out)
        self._write(td, os.path.join(self._change(td), "decision-events.md"), LEDGER)
        self._work_edit(td)
        self._work_rescan(td)
        code, out = self._close_composite(td)
        self.assertEqual(code, 0, out)

    # -- the granular arm (the skill's current command sequence, mirrored) ------------

    def _drive_granular(self, td):
        change = CHANGE_REL
        code, _ = _quiet(S.main, ["k1", "--change-dir", change, "--run", "RUN-1",
                                  "--intent", INTENT, "--scope", SCOPE,
                                  "--subject", "src", "--subject", "tests",
                                  "--map", MAP_REL])
        self.assertEqual(code, 0)
        raises = self._write(td, "raises.json", json.dumps({"raises": []}))
        code, _ = _quiet(S.main, ["merge", "--change-dir", change, "--run", "RUN-1",
                                  "--raises", raises])
        self.assertEqual(code, 0)

        # contract.json — agent-authored; the canonical envelope the composite writes
        contract = {"schemaVersion": 1, "recordType": "contract", "changeId": "demo",
                    "sourceCommand": "chaos:run", "run": "RUN-1", "recordedAt": FIXED_AT,
                    "groups": CONTRACT_IN["groups"],
                    "statements": CONTRACT_IN["statements"]}
        os.makedirs(os.path.join(change, "records"), exist_ok=True)
        L._dump_record(os.path.join(change, "records", "contract.json"), contract)

        code, out = _quiet(R.main, ["frame", "--change-dir", change, "--run", "RUN-1",
                                    "--title", "Widget summary endpoint"])
        self.assertEqual(code, 0, out)
        rec_path = json.loads(out)["written"]
        rec = json.loads(open(rec_path, encoding="utf-8").read())
        rec["verdict"] = FRAME_J["verdict"]
        rec["assessment"] = dict(FRAME_J["assessment"])
        rec["verdictRationale"] = FRAME_J["verdictRationale"]
        rec["commentary"] = FRAME_J["commentary"]
        for k, v in FRAME_J["facts"].items():
            rec["facts"][k] = v
        L._dump_record(rec_path, rec)
        code, out = _quiet(REN.main, ["demo", "--root", td, "--write"])
        self.assertEqual(code, 0, out)

        self._write(td, os.path.join(change, "decision-events.md"), LEDGER)
        self._work_edit(td)
        self._work_rescan(td)

        # the close-phase final rescan + K4 (T1's measured close sequence)
        code, _ = _quiet(S.main, ["rescan", "--change-dir", change, "--run", "RUN-1"])
        self.assertEqual(code, 0)
        code, _ = _quiet(S.main, ["k4", "--change-dir", change, "--run", "RUN-1",
                                  "--self-review", "clean"])
        self.assertEqual(code, 0)

        build_log, test_log = self._logs(td)
        code, out = _quiet(R.main, ["deliver", "--change-dir", change, "--run", "RUN-1",
                                    "--build-log", build_log, "--test-log", test_log])
        self.assertEqual(code, 0, out)
        rec_path = json.loads(out)["written"]
        rec = json.loads(open(rec_path, encoding="utf-8").read())
        rec["verdict"] = DELIVER_J["verdict"]
        rec["assessment"] = dict(DELIVER_J["assessment"])
        rec["verdictRationale"] = DELIVER_J["verdictRationale"]
        rec["commentary"] = DELIVER_J["commentary"]
        by_id = {c["statement"]: c for c in DELIVER_J["coverage"]}
        for row in rec["facts"]["coverage"]:
            c = by_id[row["statement"]]
            row["covered"] = c["covered"]
            row["evidence"] = c["evidence"]
            row["refs"] = c["refs"]
            if c["evidence"] != "test":
                row["whyNotTest"] = c["whyNotTest"]
        L._dump_record(rec_path, rec)

        result = A.run_audit(os.path.join(change, "classification-state.json"),
                             os.path.join(change, "decision-events.md"), change)
        self.assertTrue(result["pass"], result)
        code, out = _quiet(REN.main, ["demo", "--root", td, "--write"])
        self.assertEqual(code, 0, out)

    # -- parity machinery -------------------------------------------------------------

    def _freeze_and_rerender(self, td):
        """Pin every record timestamp, then re-render so the artifacts embed the
        pinned values. Timestamps are the ONLY sanctioned divergence between arms."""
        records = os.path.join(self._change(td), "records")
        for name in sorted(os.listdir(records)):
            if not name.endswith(".json"):
                continue
            path = os.path.join(records, name)
            data = json.loads(open(path, encoding="utf-8").read())
            for key in ("at", "recordedAt"):
                if key in data:
                    data[key] = FIXED_AT
            L._dump_record(path, data)
        os.chdir(td)
        code, out = _quiet(REN.main, ["demo", "--root", td, "--write"])
        self.assertEqual(code, 0, out)

    @staticmethod
    def _norm_md(text):
        text = re.sub(r'(lastWrittenAt|lastAuditedAt):\s*"[^"]*"', r'\1: "X"', text)
        return text

    def _assert_tree_parity(self, td_a, td_b):
        base_a, base_b = self._change(td_a), self._change(td_b)
        walk = {}
        for label, base in (("granular", base_a), ("composite", base_b)):
            files = []
            for root, _dirs, names in os.walk(base):
                for n in names:
                    # the short-circuit marker is working state of the composite path
                    # itself (like scan-inputs.json, but path-specific) — excluded from
                    # the governance-artifact comparison, asserted separately below
                    if n == "short-circuit.json":
                        continue
                    files.append(os.path.relpath(os.path.join(root, n), base)
                                 .replace("\\", "/"))
            walk[label] = sorted(files)
        self.assertEqual(walk["granular"], walk["composite"],
                         "the two paths left different artifact sets")
        for rel in walk["granular"]:
            with open(os.path.join(base_a, rel), encoding="utf-8") as f:
                a = f.read()
            with open(os.path.join(base_b, rel), encoding="utf-8") as f:
                b = f.read()
            if rel.endswith(".md"):
                a, b = self._norm_md(a), self._norm_md(b)
            self.assertEqual(a, b, "artifact diverges between paths: %s" % rel)


class TestParity(LoopFixture):
    def test_parity_zero_trigger_full_lifecycle(self):
        """THE fidelity gate: same inputs, granular path vs composite path, byte-identical
        .chaos/changes/<id> tree (timestamps pinned to the same value first)."""
        td_a = self._mk_repo()
        self._drive_granular(td_a)
        td_b = self._mk_repo()
        self._drive_composite(td_b)
        self._freeze_and_rerender(td_a)
        self._freeze_and_rerender(td_b)
        self._assert_tree_parity(td_a, td_b)
        # the composite arm short-circuited (zero-trigger): deferral must have
        # materialized by close and STILL produced the identical tree above
        marker = json.loads(open(os.path.join(self._change(td_b), "short-circuit.json"),
                                 encoding="utf-8").read())
        self.assertEqual(marker["status"], "materialized")


class TestFrame(LoopFixture):
    def test_frame_packet_carries_verdict_and_adjudication(self):
        td = self._mk_repo()
        code, out = _quiet(L.main, [
            "frame", "--change-dir", CHANGE_REL, "--run", "RUN-1",
            "--intent", INTENT, "--scope", SCOPE, "--subject", "src",
            "--map", MAP_REL, "--root", td])
        self.assertEqual(code, 0, out)
        self.assertIn("fired: none", out)
        self.assertIn("Adjudication is DUE", out)       # first K1 call is always due
        self.assertIn("frame-commit", out)

    def test_frame_commit_requires_raises_when_due(self):
        td = self._mk_repo()
        code, out = self._frame_composite(td, raises=None)
        self.assertEqual(code, 2, out)
        self.assertFalse(os.path.isfile(
            os.path.join(self._change(td), "records", "contract.json")))

    def test_frame_commit_refuses_empty_judgement(self):
        td = self._mk_repo()
        bad = dict(FRAME_J, verdict="")
        change = CHANGE_REL
        _quiet(L.main, ["frame", "--change-dir", change, "--run", "RUN-1",
                        "--intent", INTENT, "--scope", SCOPE, "--subject", "src",
                        "--map", MAP_REL, "--root", td])
        p = self._write(td, "in.json",
                        json.dumps({"raises": [], "contract": CONTRACT_IN, "record": bad}))
        code, out = _quiet(L.main, ["frame-commit", "--change-dir", change,
                                    "--run", "RUN-1", "--input", p, "--root", td])
        self.assertEqual(code, 2, out)

    def test_frame_commit_never_overwrites_derived_facts(self):
        """The honesty guard, composite edition: derived facts (here: intent) can never
        be replaced by input-file content."""
        td = self._mk_repo()
        change = CHANGE_REL
        _quiet(L.main, ["frame", "--change-dir", change, "--run", "RUN-1",
                        "--intent", INTENT, "--scope", SCOPE, "--subject", "src",
                        "--map", MAP_REL, "--root", td])
        bad = dict(FRAME_J, facts={"intent": ["rewritten history"]})
        p = self._write(td, "in.json",
                        json.dumps({"raises": [], "contract": CONTRACT_IN, "record": bad}))
        code, out = _quiet(L.main, ["frame-commit", "--change-dir", change,
                                    "--run", "RUN-1", "--input", p, "--root", td])
        self.assertEqual(code, 2, out)

    def test_frame_commit_accepts_an_echoed_derived_intent(self):
        """An ECHO is not an overwrite (2026-08-05).

        The frame packet shows the model the derived intent, so copying it back verbatim is
        the natural move — and it used to cost a hard failure plus a round trip. It costs one
        in governed T1 run 3. A byte-identical value now passes; a different one still fails
        (test above), so the honesty guard is unchanged.
        """
        td = self._mk_repo()
        _quiet(L.main, ["frame", "--change-dir", CHANGE_REL, "--run", "RUN-1",
                        "--intent", INTENT, "--scope", SCOPE, "--subject", "src",
                        "--map", MAP_REL, "--root", td])
        echoed = dict(FRAME_J, facts={"intent": INTENT})
        p = self._write(td, "in.json",
                        json.dumps({"raises": [], "contract": CONTRACT_IN, "record": echoed}))
        code, out = _quiet(L.main, ["frame-commit", "--change-dir", CHANGE_REL,
                                    "--run", "RUN-1", "--input", p, "--root", td])
        self.assertEqual(code, 0, out)

    def test_frame_commit_refuses_raises_when_not_due(self):
        td = self._mk_repo()
        code, out = self._frame_composite(td, raises=[])
        self.assertEqual(code, 0, out)
        # a second frame-commit would find adjudication no longer due
        p = self._write(td, "in2.json", json.dumps(
            {"raises": [{"trigger": "M1", "cite": "x"}],
             "contract": CONTRACT_IN, "record": FRAME_J}))
        code, out = _quiet(L.main, ["frame-commit", "--change-dir", CHANGE_REL,
                                    "--run", "RUN-1", "--input", p, "--root", td])
        self.assertEqual(code, 2, out)


class TestClose(LoopFixture):
    def _framed(self):
        td = self._mk_repo()
        code, out = self._frame_composite(td, raises=[])
        self.assertEqual(code, 0, out)
        self._write(td, os.path.join(self._change(td), "decision-events.md"), LEDGER)
        return td

    def test_close_aborts_on_new_firing(self):
        """A K3 firing at close is new evidence: back to the work loop, fail closed —
        no k4, no records emitted."""
        td = self._framed()
        self._work_edit(td, "src/App/Domain/Store.cs", "class Store {}\n")  # M2 surface
        code, out = self._close_composite(td)
        self.assertEqual(code, 3, out)
        self.assertIn("ABORT", out)
        self.assertIn("re-enter the work loop", out)
        self._assert_no_record(td, "deliver.")
        # the k4 scan never ran: last verdict is the aborting K3 (seq 3)
        seq, _ = L._latest_verdict(self._change(td))
        self.assertEqual(seq, 3)

    def test_close_aborts_on_self_review_fail(self):
        """--self-review fail records the honest K4 verdict (X2 fires) and aborts."""
        td = self._framed()
        self._work_edit(td)
        self._work_rescan(td)
        code, out = self._close_composite(td, self_review="fail")
        self.assertEqual(code, 3, out)
        self.assertIn("X2", out)
        state = json.loads(open(os.path.join(self._change(td),
                                             "classification-state.json"),
                                encoding="utf-8").read())
        self.assertIn("X2", {f["trigger"] for f in state["fired"]})
        self._assert_no_record(td, "deliver.")

    def test_close_commit_requires_every_coverage_row(self):
        td = self._framed()
        self._work_edit(td)
        self._work_rescan(td)
        partial = dict(DELIVER_J, coverage=[DELIVER_J["coverage"][0]])  # C-002 missing
        code, out = self._close_composite(td, deliver_j=partial)
        self.assertEqual(code, 2, out)
        self.assertIn("C-002", out)

    def test_close_commit_non_test_evidence_needs_why_not_test(self):
        td = self._framed()
        self._work_edit(td)
        self._work_rescan(td)
        cov = [dict(DELIVER_J["coverage"][0]),
               {k: v for k, v in DELIVER_J["coverage"][1].items() if k != "whyNotTest"}]
        code, out = self._close_composite(td, deliver_j=dict(DELIVER_J, coverage=cov))
        self.assertEqual(code, 2, out)
        self.assertIn("whyNotTest", out)

    def test_close_commit_audit_gate_blocks_on_unanswered_stop(self):
        td = self._framed()
        ledger = LEDGER.replace("- status: ANSWERED (test, 2026-01-01)", "- status: OPEN")
        self._write(td, os.path.join(self._change(td), "decision-events.md"), ledger)
        self._work_edit(td)
        self._work_rescan(td)
        code, out = self._close_composite(td)
        self.assertEqual(code, 1, out)
        self.assertIn("stops.all-answered", out)


class TestVerifyRecordContractJoin(LoopFixture):
    """`close` emits the verify record BEFORE the deliver record, so the derived
    contract-tick join has nothing to read and used to scaffold empty strings into a field
    the schema requires to be integers — a field the model is never asked to author.

    That made close-commit fail at `render --write` for EVERY run owing a verify record.
    Governed T1 run 3 was the first to owe one (M3 by adjudication) and burned two
    consecutive close-commit failures on it (2026-08-04).
    """

    # M2 is the trigger that raises `verify` without dragging in `openspec` (it is not in
    # OPENSPEC_BASE), so it isolates the join under test — and it is the trigger T2 governed
    # is predicted to fire, which is the next run this path has to survive.
    def _verify_owed(self):
        td = self._mk_repo()
        code, out = self._frame_composite(
            td, raises=[{"trigger": "M2", "cite": "the change touches the data store"}],
            record=dict(FRAME_J, commentary="M2 sensitive-surface raised at adjudication."))
        self.assertEqual(code, 0, out)
        self._write(td, os.path.join(self._change(td), "decision-events.md"), LEDGER)
        return td

    def test_a_verify_record_is_actually_owed_by_this_fixture(self):
        """Guards the guard: if M2 stops raising verify, the test below silently stops
        testing anything."""
        td = self._verify_owed()
        self._work_edit(td)
        self._work_rescan(td)
        build_cmd, test_cmd = self._echo_cmds(td)
        code, out = _quiet(L.main, [
            "close", "--change-dir", CHANGE_REL, "--run", "RUN-1", "--self-review", "clean",
            "--build-cmd", build_cmd, "--test-cmd", test_cmd,
            "--build-log", self._logs(td)[0], "--test-log", self._logs(td)[1], "--root", td])
        self.assertEqual(code, 0, out)
        self.assertTrue(L._latest_record(self._change(td), "verify"),
                        "no verify record emitted — fixture no longer exercises the join")

    VERIFY_J = {
        "verdict": "READY",
        "assessment": {"confidence": "HIGH", "evidenceCoverage": "COMPLETE",
                       "assumptionLoad": "LOW"},
        "verdictRationale": "Every contract statement is covered by a passing test.",
        "archiveReadiness": "READY",
        "openspecIsComplete": True,
        "traceability": [],
        "findings": [],
    }

    def test_close_commit_recomputes_the_contract_join_into_integers(self):
        td = self._verify_owed()
        self._work_edit(td)
        self._work_rescan(td)
        code, out = self._close_composite(td, verify_j=self.VERIFY_J, real_checks=True)
        self.assertEqual(code, 0, out)

        with open(L._latest_record(self._change(td), "verify"), encoding="utf-8") as fh:
            vrec = json.load(fh)
        contract = vrec["facts"]["checks"]["contract"]
        self.assertIsInstance(contract["ticked"], int)
        self.assertIsInstance(contract["total"], int)
        # Recomputed against the finalized deliver record, not the empty scaffold.
        with open(L._latest_record(self._change(td), "deliver"), encoding="utf-8") as fh:
            drec = json.load(fh)
        covered = sum(1 for c in drec["facts"]["coverage"] if c.get("covered") is True)
        self.assertEqual(contract["ticked"], covered)
        self.assertNotIn("placeholder", contract.get("note") or "")


class TestUnderivableCounts(LoopFixture):
    """A build/test command whose output cannot be parsed must not block the close.

    L4-D5 forbids guessing a count the emitter did not read. That was implemented as `""`,
    which the phase-facts schema rejects (it requires an integer) — so an unparseable log
    produced a record `render --write` refused to write, naming a field no agent authors.
    `null` keeps the doctrine and is representable. Same defect class as the contract-tick
    join; found while fixing that one, on 2026-08-05.
    """

    def _verify_owed(self):
        td = self._mk_repo()
        code, out = self._frame_composite(
            td, raises=[{"trigger": "M2", "cite": "the change touches the data store"}],
            record=dict(FRAME_J, commentary="M2 sensitive-surface raised at adjudication."))
        self.assertEqual(code, 0, out)
        self._write(td, os.path.join(self._change(td), "decision-events.md"), LEDGER)
        return td

    def test_unparseable_check_output_still_closes(self):
        td = self._verify_owed()
        self._work_edit(td)
        self._work_rescan(td)
        code, out = self._close_composite(
            td, verify_j=TestVerifyRecordContractJoin.VERIFY_J, garbage_checks=True)
        self.assertEqual(code, 0, out)

        with open(L._latest_record(self._change(td), "verify"), encoding="utf-8") as fh:
            checks = json.load(fh)["facts"]["checks"]
        self.assertIsNone(checks["build"]["errors"])
        self.assertIsNone(checks["tests"]["passed"])

    def test_an_underivable_count_renders_as_unknown_not_zero(self):
        """The reader-facing half: `0 err` is a claim, `? err` is an admission."""
        td = self._verify_owed()
        self._work_edit(td)
        self._work_rescan(td)
        code, out = self._close_composite(
            td, verify_j=TestVerifyRecordContractJoin.VERIFY_J, garbage_checks=True)
        self.assertEqual(code, 0, out)

        with open(os.path.join(self._change(td), "change.md"), encoding="utf-8") as fh:
            change_md = fh.read()
        # Only the VERIFY table is affected: deliver parses the loop's own (good) log, verify
        # re-runs the command (L4-D4). Asserting on the whole document would wrongly flag the
        # deliver pass's legitimate `0 warn / 0 err`.
        verification = change_md.split("## Verification", 1)[1]
        self.assertIn("? warn / ? err", verification)
        self.assertIn("output not parseable", verification)
        self.assertNotIn("0 warn / 0 err", verification)
        # And the lifecycle summary must not read as a real count either.
        self.assertIn('tests: "?/?"', change_md)


class TestShortCircuit(LoopFixture):
    """Option 2 — zero-trigger short-circuit. Eligibility is tool-decided; deferral
    moves the frame WRITES, never the validation, the stop, or the artifact set."""

    def test_defers_then_close_materializes(self):
        td = self._mk_repo()
        code, out = self._frame_composite(td, raises=[])
        self.assertEqual(code, 0, out)
        self.assertIn("short-circuit", out)
        self.assertIn("Contract (inline", out)
        marker = json.loads(open(os.path.join(self._change(td), "short-circuit.json"),
                                 encoding="utf-8").read())
        self.assertEqual(marker["status"], "deferred")
        self.assertEqual(marker["decidedBy"], "tool")
        self.assertFalse(os.path.isfile(
            os.path.join(self._change(td), "records", "contract.json")))
        self._assert_no_record(td, "frame.")

        self._write(td, os.path.join(self._change(td), "decision-events.md"), LEDGER)
        self._work_edit(td)
        self._work_rescan(td)
        code, out = self._close_composite(td)
        self.assertEqual(code, 0, out)
        marker = json.loads(open(os.path.join(self._change(td), "short-circuit.json"),
                                 encoding="utf-8").read())
        self.assertEqual(marker["status"], "materialized")
        self.assertTrue(os.path.isfile(
            os.path.join(self._change(td), "records", "contract.json")))
        result = A.run_audit(
            os.path.join(self._change(td), "classification-state.json"),
            os.path.join(self._change(td), "decision-events.md"), self._change(td))
        self.assertTrue(result["pass"], result)
        self.assertIn("shortCircuit.materialized",
                      [c["id"] for c in result["assertions"]])

    def test_ineligible_on_fired_verdict(self):
        """A fired verdict can never short-circuit — the tool decides, and it decides no."""
        td = self._mk_repo()
        code, out = _quiet(L.main, [
            "frame", "--change-dir", CHANGE_REL, "--run", "RUN-1",
            "--intent", INTENT, "--scope", SCOPE, "--subject", "src",
            "--declared", "sensitive-surface:auth", "--map", MAP_REL, "--root", td])
        self.assertEqual(code, 0, out)
        self.assertNotIn("provisionally eligible", out)
        p = self._write(td, "in.json", json.dumps(
            {"raises": [], "contract": CONTRACT_IN, "record": FRAME_J}))
        code, out = _quiet(L.main, ["frame-commit", "--change-dir", CHANGE_REL,
                                    "--run", "RUN-1", "--input", p,
                                    "--title", "T", "--root", td])
        self.assertEqual(code, 0, out)
        self.assertFalse(os.path.isfile(
            os.path.join(self._change(td), "short-circuit.json")))
        self.assertTrue(os.path.isfile(
            os.path.join(self._change(td), "records", "contract.json")))

    def test_ineligible_under_preset(self):
        """Preset floors mean the caller asked for rigor — never short-circuit it."""
        td = self._mk_repo()
        code, out = _quiet(L.main, [
            "frame", "--change-dir", CHANGE_REL, "--run", "RUN-1",
            "--intent", INTENT, "--scope", SCOPE, "--subject", "src",
            "--mode", "strict", "--map", MAP_REL, "--root", td])
        self.assertEqual(code, 0, out)
        self.assertNotIn("provisionally eligible", out)
        # strict floors openspec to 2, so the frame record owes an openspec claim
        record = dict(FRAME_J, openspec={
            "status": "INVOKED",
            "invocationPath": "openspec/changes/demo — full set authored before S1",
            "confidenceImpact": "None."})
        p = self._write(td, "in.json", json.dumps(
            {"raises": [], "contract": CONTRACT_IN, "record": record}))
        code, out = _quiet(L.main, ["frame-commit", "--change-dir", CHANGE_REL,
                                    "--run", "RUN-1", "--input", p,
                                    "--title", "T", "--root", td])
        self.assertEqual(code, 0, out)
        self.assertFalse(os.path.isfile(
            os.path.join(self._change(td), "short-circuit.json")))

    def test_no_short_circuit_flag_opts_out(self):
        td = self._mk_repo()
        code, out = _quiet(L.main, [
            "frame", "--change-dir", CHANGE_REL, "--run", "RUN-1",
            "--intent", INTENT, "--scope", SCOPE, "--subject", "src",
            "--map", MAP_REL, "--root", td])
        self.assertEqual(code, 0, out)
        p = self._write(td, "in.json", json.dumps(
            {"raises": [], "contract": CONTRACT_IN, "record": FRAME_J}))
        code, out = _quiet(L.main, ["frame-commit", "--change-dir", CHANGE_REL,
                                    "--run", "RUN-1", "--input", p, "--title", "T",
                                    "--no-short-circuit", "--root", td])
        self.assertEqual(code, 0, out)
        self.assertFalse(os.path.isfile(
            os.path.join(self._change(td), "short-circuit.json")))
        self.assertTrue(os.path.isfile(
            os.path.join(self._change(td), "records", "contract.json")))

    def test_fired_while_deferred_aborts_close_and_materialize_recovers(self):
        """The timing rule, fail closed: artifacts were owed at the firing. Close refuses
        to proceed on a fired-while-deferred run; materialize recovers."""
        td = self._mk_repo()
        code, out = self._frame_composite(td, raises=[])
        self.assertEqual(code, 0, out)
        # a decision whose title reads on the auth surface, so MR-3 satisfies the M2 stop
        ledger = LEDGER.replace("Approve the frame", "Approve the frame and the auth surface")
        self._write(td, os.path.join(self._change(td), "decision-events.md"), ledger)
        self._work_edit(td, "src/App/Config/Keys.cs", "class Keys {}\n")  # fires M2 (auth)
        self._work_rescan(td)  # the firing happens HERE — materialize was owed here
        code, out = self._close_composite(td)
        self.assertEqual(code, 3, out)
        self.assertIn("materialize", out)
        self.assertIn("AT THE FIRING", out)
        self._assert_no_record(td, "deliver.")

        code, out = _quiet(L.main, ["materialize", "--change-dir", CHANGE_REL,
                                    "--run", "RUN-1", "--root", td])
        self.assertEqual(code, 0, out)
        marker = json.loads(open(os.path.join(self._change(td), "short-circuit.json"),
                                 encoding="utf-8").read())
        self.assertEqual(marker["status"], "materialized")
        build_log, test_log = self._logs(td)
        code, out = _quiet(L.main, [
            "close", "--change-dir", CHANGE_REL, "--run", "RUN-1",
            "--self-review", "clean",
            "--build-log", build_log, "--test-log", test_log, "--root", td])
        self.assertEqual(code, 0, out)
        self.assertIn("Verify record emitted", out)  # M2 raised verify to 1

    def test_audit_blocks_a_still_deferred_close(self):
        """close-commit's audit gate: a hand-reverted (or skipped) materialization can
        never close."""
        td = self._mk_repo()
        code, out = self._frame_composite(td, raises=[])
        self.assertEqual(code, 0, out)
        self._write(td, os.path.join(self._change(td), "decision-events.md"), LEDGER)
        self._work_edit(td)
        self._work_rescan(td)
        code, out = self._close_composite(td)
        self.assertEqual(code, 0, out)
        marker_path = os.path.join(self._change(td), "short-circuit.json")
        marker = json.loads(open(marker_path, encoding="utf-8").read())
        marker["status"] = "deferred"
        L._dump_record(marker_path, marker)
        result = A.run_audit(
            os.path.join(self._change(td), "classification-state.json"),
            os.path.join(self._change(td), "decision-events.md"), self._change(td))
        self.assertFalse(result["pass"])
        failing = [c["id"] for c in result["assertions"] if not c["pass"]]
        self.assertIn("shortCircuit.materialized", failing)


if __name__ == "__main__":
    unittest.main()
