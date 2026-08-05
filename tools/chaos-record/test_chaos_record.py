#!/usr/bin/env python3
"""Unit tests for chaos-record (stdlib unittest, tmpdir git fixtures).

The load-bearing one is the honesty guard (L4-D5): the emitter must never fill a
judgement field — guessing is the defect class this lever must never ship."""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "..", "chaos-classify"))
import record as R  # noqa: E402
from classify import FLOORS  # noqa: E402

BUILD_LOG = "  Determining projects...\n    3 Warning(s)\n    0 Error(s)\n"
TEST_LOG = "Passed!  - Failed:     0, Passed:     8, Skipped:     0, Total:     8\n"
PY = sys.executable


def make_state(fired=None, scan_count=3):
    return {"fired": fired or [], "stopsPlaced": ["K1:floor-approval"],
            "floors": dict(FLOORS[None]), "mode": None, "x1Level": 0,
            "checkpointsRun": ["K1"], "seenPaths": [], "scanCount": scan_count}


class TestRecord(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.mkdtemp()
        self.cwd = os.getcwd()
        os.chdir(self.td)
        subprocess.run(["git", "init", "-q"], check=True, capture_output=True)
        subprocess.run(["git", "config", "user.email", "t@t"], check=True)
        subprocess.run(["git", "config", "user.name", "t"], check=True)
        self._write("src/App/Program.cs", "class Program {}\n")
        subprocess.run(["git", "add", "."], check=True, capture_output=True)
        subprocess.run(["git", "commit", "-q", "-m", "base"], check=True,
                       capture_output=True)
        self.change = os.path.join(self.td, ".chaos", "changes", "demo")
        self._state(make_state())
        self._json("scan-inputs.json", {"intent": "Add a summary endpoint.",
                                        "scope": "scope: src/",
                                        "subjectPaths": ["src"]})
        self._json("records/contract.json", {
            "schemaVersion": 1, "recordType": "contract", "changeId": "demo",
            "sourceCommand": "chaos:run", "run": "RUN-x", "recordedAt": "2026-01-01T00:00:00Z",
            "statements": [{"id": "C-001", "text": "a"}, {"id": "C-002", "text": "b"},
                           {"id": "C-003", "text": "c"}]})

    def tearDown(self):
        os.chdir(self.cwd)
        shutil.rmtree(self.td, ignore_errors=True)

    def _write(self, rel, content):
        path = os.path.join(self.td, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        return path

    def _json(self, rel, data):
        return self._write(os.path.join(".chaos", "changes", "demo", rel),
                           json.dumps(data, indent=1))

    def _state(self, state):
        self._json("classification-state.json", state)

    def _emit(self, phase, *extra):
        rc = R.main([phase, "--change-dir", self.change, "--run", "RUN-t", *extra])
        self.assertEqual(rc, 0)
        records = os.path.join(self.change, "records")
        latest = sorted(n for n in os.listdir(records)
                        if n.startswith(phase + ".pass-"))[-1]
        with open(os.path.join(records, latest), encoding="utf-8") as f:
            return json.load(f)

    def assert_judgement_empty(self, rec):
        """L4-D5: no judgement field is ever non-empty in emitter output."""
        self.assertEqual(rec["verdict"], "")
        self.assertEqual(set(rec["assessment"].values()), {""})
        self.assertIsNone(rec["verdictRationale"])
        self.assertIsNone(rec["commentary"])
        facts = rec["facts"]
        for row in facts.get("coverage", []):
            self.assertIsNone(row["covered"])
            self.assertEqual((row["evidence"], row["refs"]), ("", []))
        self.assertEqual(facts.get("deviations", []), [])
        for row in (facts.get("rules") or facts.get("checks", {}).get("rules", [])):
            self.assertEqual((row["status"], row["evidence"]), ("", ""))
        self.assertEqual(facts.get("findings", []), [])
        self.assertEqual(facts.get("traceability", []), [])
        if "archiveReadiness" in facts:
            self.assertEqual(facts["archiveReadiness"], "")

    def test_frame_depth0_openspec_derived(self):
        rec = self._emit("frame", "--title", "Summary endpoint")
        self.assertEqual(rec["phase"], "frame")
        self.assertEqual(rec["pass"], 1)
        self.assertEqual(rec["facts"]["openspec"]["status"], "NOT_INVOKED")
        self.assertEqual(rec["facts"]["openspec"]["depth"], 0)
        self.assertEqual(rec["facts"]["intent"], ["Add a summary endpoint."])
        self.assert_judgement_empty(rec)

    def test_frame_owed_depth_left_to_agent(self):
        self._state(make_state(fired=[{"trigger": "M1", "by": "adjudication",
                                       "surface": "auth", "cite": "c",
                                       "checkpoint": "K1"}]))
        rec = self._emit("frame")
        self.assertEqual(rec["facts"]["openspec"]["depth"], 1)
        self.assertEqual(rec["facts"]["openspec"]["status"], "")   # the claim is the agent's

    def test_deliver_derivations(self):
        self._write("src/App/Endpoints.cs", "class E {}\n")            # untracked => added
        self._write("src/App/Program.cs", "class Program { int x; }\n")  # modified
        rec = self._emit("deliver",
                         "--build-log", self._write("b.log", BUILD_LOG),
                         "--test-log", self._write("t.log", TEST_LOG),
                         "--rule", "R-003", "--rule", "R-004")
        f = rec["facts"]
        self.assertEqual((f["build"]["warnings"], f["build"]["errors"]), (3, 0))
        self.assertEqual((f["tests"]["passed"], f["tests"]["total"]), (8, 8))
        self.assertEqual([c["statement"] for c in f["coverage"]],
                         ["C-001", "C-002", "C-003"])
        self.assertEqual([r["id"] for r in f["rules"]], ["R-003", "R-004"])
        by_path = {x["path"]: x["change"] for x in f["files"]}
        self.assertEqual(by_path.get("src/App/Endpoints.cs"), "added")
        self.assertEqual(by_path.get("src/App/Program.cs"), "modified")
        self.assertEqual(f["scopeDrift"]["status"], "NO_DRIFT")
        self.assertIn("M5 never fired", f["scopeDrift"]["note"])
        self.assert_judgement_empty(rec)

    def test_unparseable_log_is_null_never_guessed(self):
        """L4-D5, in the type the schema can actually carry.

        This used to assert `""`, which is neither a number nor a null. The phase-facts schema
        requires an integer here, so an unparseable log produced a record that could not be
        rendered at all — failing on a field no agent authors. `None` keeps the doctrine (still
        never guessed) and is representable.
        """
        rec = self._emit("deliver", "--build-log", self._write("b.log", "garbage\n"))
        self.assertIsNone(rec["facts"]["build"]["warnings"])
        self.assertIsNone(rec["facts"]["build"]["errors"])
        self.assertIsNone(rec["facts"]["tests"]["passed"])
        self.assertIsNone(rec["facts"]["tests"]["total"])
        # The distinction that matters: unknown must never be reported as zero.
        self.assertNotEqual(rec["facts"]["build"]["errors"], 0)

    def test_m5_fired_leaves_drift_story_to_agent(self):
        self._state(make_state(fired=[{"trigger": "M5", "by": "scan", "surface": None,
                                       "cite": "spill", "checkpoint": "K3"}]))
        rec = self._emit("deliver")
        self.assertEqual(rec["facts"]["scopeDrift"], {"status": "", "risk": "", "note": ""})

    def test_pass_number_increments(self):
        self._emit("deliver")
        rec2 = self._emit("deliver")
        self.assertEqual(rec2["pass"], 2)

    def test_verify_reruns_checks_and_joins_contract(self):
        # a deliver pass with 2/3 covered feeds the tick join
        deliver = self._emit("deliver")
        for row, covered in zip(deliver["facts"]["coverage"], (True, True, False)):
            row["covered"] = covered
            row["evidence"] = "test"
        self._json("records/deliver.pass-01.facts.json", deliver)
        build_cmd = '%s -c "print(\'    0 Warning(s)\'); print(\'    1 Error(s)\')"' % PY
        test_cmd = '%s -c "print(\'Failed:     1, Passed:     7, Total:     8\')"' % PY
        rec = self._emit("verify", "--run-checks",
                         "--build-cmd", build_cmd, "--test-cmd", test_cmd,
                         "--rule", "R-003")
        checks = rec["facts"]["checks"]
        self.assertEqual((checks["build"]["warnings"], checks["build"]["errors"]), (0, 1))
        self.assertEqual((checks["tests"]["passed"], checks["tests"]["total"]), (7, 8))
        self.assertIn("independent re-run", checks["build"]["note"])
        self.assertEqual((checks["contract"]["ticked"], checks["contract"]["total"]), (2, 3))
        self.assertEqual(checks["scopeDrift"]["status"], "NO_DRIFT")
        self.assert_judgement_empty(rec)

    def test_missing_state_fails_cleanly(self):
        os.remove(os.path.join(self.change, "classification-state.json"))
        self.assertEqual(R.main(["frame", "--change-dir", self.change,
                                 "--run", "RUN-t"]), 2)


if __name__ == "__main__":
    unittest.main()
