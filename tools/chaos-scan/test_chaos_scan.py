#!/usr/bin/env python3
"""Unit tests for chaos-scan (stdlib unittest, real tmpdir git repo fixtures)."""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scan as S  # noqa: E402

MAP = {
    "classes": {
        "data-store": {"paths": ["src/App/Domain/**"], "surface": "data-store"},
        "secrets": {"paths": ["src/App/Config/**"], "surface": "auth"},
        "contract-artifacts": {"paths": ["contracts/**"]},
    },
    "m2Classes": ["data-store", "secrets"],
    "x1Thresholds": {"review1": {"files": 8, "loc": 400},
                     "review2": {"files": 20, "loc": 1000}},
    "renameShapeGuard": {"minFiles": 6, "globalAddDeleteRatioTolerance": 0.2,
                         "minFractionFilesWithBothAddsAndDeletes": 0.8},
}


class TestScan(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.mkdtemp()
        self.cwd = os.getcwd()
        os.chdir(self.td)
        subprocess.run(["git", "init", "-q"], check=True, capture_output=True)
        subprocess.run(["git", "config", "user.email", "t@t"], check=True)
        subprocess.run(["git", "config", "user.name", "t"], check=True)
        self._write("src/App/Program.cs", "class Program {}\n")
        self._write("tests/T/Basic.cs", "class Basic {}\n")
        subprocess.run(["git", "add", "."], check=True, capture_output=True)
        subprocess.run(["git", "commit", "-q", "-m", "base"], check=True, capture_output=True)
        self.change = os.path.join(self.td, ".chaos", "changes", "demo")
        self.map_path = self._write("map.json", json.dumps(MAP))

    def tearDown(self):
        os.chdir(self.cwd)
        shutil.rmtree(self.td, ignore_errors=True)

    def _write(self, rel, content):
        path = os.path.join(self.td, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        return path

    def _k1(self, scope="scope: src/", declared="", mode=None):
        args = ["k1", "--change-dir", self.change, "--intent", "Tidy things.",
                "--scope", scope, "--subject", "src", "--subject", "tests",
                "--map", self.map_path]
        if declared:
            args += ["--declared", declared]
        if mode:
            args += ["--mode", mode]
        return S.main(args)

    def _digest(self, seq):
        with open(os.path.join(self.change, "scan", "verdict-%d.md" % seq),
                  encoding="utf-8") as f:
            return f.read()

    def _ledger(self):
        p = os.path.join(self.change, "decision-events.md")
        if not os.path.isfile(p):
            return ""
        with open(p, encoding="utf-8") as f:
            return f.read()

    def test_k1_zero_trigger(self):
        self.assertEqual(self._k1(), 0)
        d = self._digest(1)
        self.assertIn("fired: none", d)
        self.assertIn("adjudication: DUE", d)          # first K1 call is always due
        self.assertIn("stops: none demanded", d)
        self.assertTrue(os.path.isfile(os.path.join(self.change, "scan", "packet-1.json")))
        self.assertTrue(os.path.isfile(os.path.join(self.change, "classification-state.json")))
        self.assertEqual(self._ledger(), "")           # nothing fired => no TRG, no ledger

    def test_declared_trigger_fires_and_trg_appended(self):
        self.assertEqual(self._k1(declared="sensitive-surface:auth"), 0)
        d = self._digest(1)
        self.assertIn("FIRED M2 (by declared, surface auth) [TRG-001]", d)
        ledger = self._ledger()
        self.assertIn("## TRG-001 — trigger fired: M2 sensitive-surface", ledger)
        self.assertIn("- status: RECORDED (", ledger)
        self.assertIn("- cite: frontmatter declaredTriggers: [sensitive-surface:auth]", ledger)
        self.assertIn("- dimensions-after: stops 1", ledger)

    def test_merge_fails_closed_without_cite(self):
        self._k1()
        raises = self._write("raises.json",
                             json.dumps({"raises": [{"trigger": "M1", "surface": "auth",
                                                     "cite": "  "}]}))
        self.assertEqual(S.main(["merge", "--change-dir", self.change,
                                 "--raises", raises]), 2)
        bad = self._write("bad.json",
                          json.dumps({"raises": [{"trigger": "X1", "cite": "c"}]}))
        self.assertEqual(S.main(["merge", "--change-dir", self.change, "--raises", bad]), 2)

    def test_merge_applies_valid_raise(self):
        self._k1()
        raises = self._write("raises.json", json.dumps(
            {"raises": [{"trigger": "M1", "surface": "data-store",
                         "cite": "intent line 1: crosses retention posture"}]}))
        self.assertEqual(S.main(["merge", "--change-dir", self.change,
                                 "--raises", raises]), 0)
        d = self._digest(2)
        self.assertIn("FIRED M1 (by adjudication, surface data-store)", d)
        self.assertIn("cite: intent line 1: crosses retention posture", d)
        self.assertIn("## TRG-001 — trigger fired: M1 posture-crossing", self._ledger())

    def test_rescan_fires_dedupes_and_echoes(self):
        self._k1()
        self._write("src/App/Domain/Store.cs", "class Store {}\n")   # untracked, needs -N
        self.assertEqual(S.main(["rescan", "--change-dir", self.change]), 0)
        d = self._digest(2)
        self.assertIn("FIRED M2 (by scan, surface data-store)", d)
        self.assertIn("stops: +1 placed", d)
        self.assertIn("new surface paths: src/App/Domain/Store.cs", d)
        self.assertIn("adjudication: DUE", d)
        self.assertIn("## TRG-001 — trigger fired: M2 sensitive-surface", self._ledger())
        # same diff again: dedupe, echo, nothing due
        self.assertEqual(S.main(["rescan", "--change-dir", self.change]), 0)
        d3 = self._digest(3)
        self.assertIn("fired: none", d3)
        self.assertIn("echo (already fired, re-detected): M2", d3)
        self.assertIn("adjudication: not due", d3)
        self.assertIn("stops: none demanded", d3)
        self.assertNotIn("TRG-002", self._ledger())

    def test_spill_absorbed_by_pending_stop(self):
        self._k1()
        self._write(os.path.join(self.change.replace(self.td + os.sep, ""), "x"), "")  # noop
        ledger = ("## RUN-DEC-001 — approve as framed?\n\n- status: OPEN\n"
                  "- approves-change: true\n")
        self._write(".chaos/changes/demo/decision-events.md", ledger)
        self._write("tests/T/Basic.cs", "class Basic { int x; }\n")  # outside scope: src/
        self.assertEqual(S.main(["rescan", "--change-dir", self.change]), 0)
        d = self._digest(2)
        self.assertIn("FIRED M5", d)
        self.assertIn("stops: ABSORBED by pending RUN-DEC-001", d)
        self.assertIn("increment `folds:`", d)

    def test_k2_counts_questions(self):
        self._k1()
        self._write(".chaos/changes/demo/decision-events.md",
                    "## RUN-DEC-001 — a\n\n- status: ANSWERED (m, d)\n\n"
                    "## RUN-DEC-002 — b\n\n- status: RESOLVED-IN-ARM\n")
        self.assertEqual(S.main(["k2", "--change-dir", self.change]), 0)
        self.assertIn("FIRED M4", self._digest(2))

    def test_k4_self_review(self):
        self._k1()
        self.assertEqual(S.main(["k4", "--change-dir", self.change,
                                 "--self-review", "issues-found"]), 0)
        d = self._digest(2)
        self.assertIn("FIRED X2", d)
        self.assertIn("adjudication: not due", d)      # K4 never sets it

    def test_update_scope_requires_decision(self):
        self._k1()
        self.assertEqual(S.main(["update-scope", "--change-dir", self.change,
                                 "--scope", "scope: src/, tests/", "--decision", " "]), 2)
        self.assertEqual(S.main(["update-scope", "--change-dir", self.change,
                                 "--scope", "scope: src/, tests/",
                                 "--decision", "RUN-DEC-002"]), 0)
        with open(os.path.join(self.change, "scan-inputs.json"), encoding="utf-8") as f:
            inputs = json.load(f)
        self.assertEqual(inputs["scopeUpdatedBy"], "RUN-DEC-002")
        self.assertEqual(inputs["scope"], "scope: src/, tests/")

    def test_rescan_without_k1_fails_cleanly(self):
        self.assertEqual(S.main(["rescan", "--change-dir", self.change]), 2)

    def test_run_id_stamped_on_trg(self):
        self.assertEqual(S.main(["k1", "--change-dir", self.change, "--intent", "x",
                                 "--scope", "scope: src/", "--subject", "src",
                                 "--map", self.map_path,
                                 "--declared", "sensitive-surface:auth",
                                 "--run", "RUN-2026-08-03-demo-abc"]), 0)
        self.assertIn("· run: RUN-2026-08-03-demo-abc", self._ledger())


if __name__ == "__main__":
    unittest.main()
