#!/usr/bin/env python3
"""Unit tests for the Stage-D obligation audit (stdlib unittest, tmpdir fixtures)."""

import json
import os
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audit as A  # noqa: E402
from classify import FLOORS  # noqa: E402

ANSWERED = "## RUN-DEC-001 — approve as framed?\n\n- status: ANSWERED (m, d)\n- approves-change: true\n"


def make_state(fired=None, stops_placed=None, mode=None):
    return {"fired": fired or [], "stopsPlaced": stops_placed or ["K1:floor-approval"],
            "floors": dict(FLOORS[mode]), "mode": mode, "x1Level": 0,
            "checkpointsRun": ["K1"], "seenPaths": [], "scanCount": 3}


class TestAudit(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.mkdtemp()
        self.change = os.path.join(self.td, "changes", "demo")
        os.makedirs(os.path.join(self.change, "records"))
        self.state_path = os.path.join(self.change, "classification-state.json")
        self.ledger_path = os.path.join(self.change, "decision-events.md")

    def tearDown(self):
        shutil.rmtree(self.td, ignore_errors=True)

    def _write(self, rel, content):
        path = os.path.join(self.td, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return path

    def _prime(self, state, ledger=ANSWERED, records=("frame", "deliver")):
        with open(self.state_path, "w", encoding="utf-8") as f:
            json.dump(state, f)
        with open(self.ledger_path, "w", encoding="utf-8") as f:
            f.write(ledger)
        for phase in records:
            self._write("changes/demo/records/%s.pass-01.facts.json" % phase, "{}")

    def _ids(self, result, ok=None):
        return {c["id"] for c in result["assertions"] if ok is None or c["pass"] == ok}

    def test_zero_trigger_close_passes(self):
        self._prime(make_state())
        r = A.run_audit(self.state_path, self.ledger_path, self.change)
        self.assertTrue(r["pass"], r)
        self.assertEqual(r["dimensions"]["openspec"], 0)
        # nothing owed => no adr/openspec/verify assertions at all
        self.assertFalse({"adr.file-exists", "openspec.delta-spec", "verify.record-exists"}
                         & self._ids(r))

    def test_unanswered_stop_blocks_close(self):
        self._prime(make_state(), ledger=ANSWERED + "\n## RUN-DEC-002 — spill\n\n- status: PENDING\n")
        r = A.run_audit(self.state_path, self.ledger_path, self.change)
        self.assertFalse(r["pass"])
        self.assertIn("stops.all-answered", self._ids(r, ok=False))
        self.assertIn("RUN-DEC-002", [c for c in r["assertions"]
                                      if c["id"] == "stops.all-answered"][0]["detail"])

    def test_terminal_statuses_pass_stop_gate(self):
        """RESOLVED-IN-ARM and RECORDED entries are resolved, not unanswered (Stage-D
        results section 5 — all six arms tripped the ANSWERED-only match at close)."""
        ledger = ("## RUN-DEC-001 — approve as framed?\n\n- status: RESOLVED-IN-ARM\n"
                  "- approves-change: true\n\n"
                  "## RUN-DEC-002 — spill accepted\n\n- status: RECORDED (2026-08-03)\n")
        self._prime(make_state(), ledger=ledger)
        r = A.run_audit(self.state_path, self.ledger_path, self.change)
        self.assertTrue(r["pass"], r)
        self.assertIn("stops.all-answered", self._ids(r, ok=True))

    def test_placed_stop_without_entry_blocks(self):
        """A stop the classifier placed but the loop never surfaced is a compliance hole."""
        self._prime(make_state(stops_placed=["K1:floor-approval", "K3:trigger-fold"]))
        r = A.run_audit(self.state_path, self.ledger_path, self.change)
        self.assertFalse(r["pass"])
        self.assertIn("stops.placed-have-entries", self._ids(r, ok=False))

    def test_owed_adr_missing_then_found(self):
        fired = [{"trigger": "M1", "by": "adjudication", "surface": "auth", "cite": "c",
                  "checkpoint": "K1"}]
        self._prime(make_state(fired=fired))
        r = A.run_audit(self.state_path, self.ledger_path, self.change)
        self.assertFalse(r["pass"])
        self.assertIn("adr.file-exists", self._ids(r, ok=False))
        self._write("changes/demo/adr/ADR-001-x.md", "# ADR-001\n")
        # M1 also owes openspec 1 — satisfy it so only the ADR flips the verdict
        os_dir = os.path.join(self.td, "openspec", "demo")
        self._write("openspec/demo/specs/tasks/spec.md", "# delta\n")
        r2 = A.run_audit(self.state_path, self.ledger_path, self.change, openspec_dir=os_dir)
        self.assertTrue(r2["pass"], r2)

    def test_owed_openspec_depths(self):
        fired = [{"trigger": "M3", "by": "scan", "surface": "contract-dependency",
                  "cite": "c", "checkpoint": "K3", "breaking": True}]
        state = make_state(fired=fired)
        self._prime(state)
        self._write("changes/demo/adr/ADR-001-x.md", "# ADR-001\n")   # breaking M3 owes adr 2
        self._write("changes/demo/records/verify.pass-01.facts.json", "{}")  # and verify 1
        # breaking => openspec 2: delta alone is not enough
        os_dir = os.path.join(self.td, "openspec", "demo")
        self._write("openspec/demo/specs/tasks/spec.md", "# delta\n")
        r = A.run_audit(self.state_path, self.ledger_path, self.change, openspec_dir=os_dir)
        self.assertFalse(r["pass"])
        self.assertIn("openspec.full-set", self._ids(r, ok=False))
        self._write("openspec/demo/proposal.md", "# proposal\n")
        r2 = A.run_audit(self.state_path, self.ledger_path, self.change, openspec_dir=os_dir)
        self.assertTrue(r2["pass"], r2)
        # owed but the loop never told the audit where openspec lives
        r3 = A.run_audit(self.state_path, self.ledger_path, self.change)
        self.assertIn("openspec.dir-provided", self._ids(r3, ok=False))

    def test_owed_verify_record(self):
        fired = [{"trigger": "M2", "by": "scan", "surface": "auth", "cite": "c",
                  "checkpoint": "K3"}]
        self._prime(make_state(fired=fired))
        r = A.run_audit(self.state_path, self.ledger_path, self.change)
        self.assertFalse(r["pass"])
        self.assertIn("verify.record-exists", self._ids(r, ok=False))
        self._write("changes/demo/records/verify.pass-01.facts.json", "{}")
        r2 = A.run_audit(self.state_path, self.ledger_path, self.change)
        self.assertTrue(r2["pass"], r2)

    def test_missing_deliver_record_blocks(self):
        self._prime(make_state(), records=("frame",))
        r = A.run_audit(self.state_path, self.ledger_path, self.change)
        self.assertFalse(r["pass"])
        self.assertIn("records.deliver-exists", self._ids(r, ok=False))

    def test_cli_exit_codes(self):
        import subprocess
        self._prime(make_state())
        here = os.path.dirname(os.path.abspath(__file__))
        cmd = [sys.executable, os.path.join(here, "audit.py"), "--state", self.state_path,
               "--ledger", self.ledger_path, "--change-dir", self.change]
        ok = subprocess.run(cmd, capture_output=True, text=True)
        self.assertEqual(ok.returncode, 0, ok.stdout)
        self.assertTrue(json.loads(ok.stdout)["pass"])
        bad = subprocess.run(cmd[:3] + [os.path.join(self.td, "nope.json")] + cmd[4:],
                             capture_output=True, text=True)
        self.assertEqual(bad.returncode, 2)


if __name__ == "__main__":
    unittest.main()
