#!/usr/bin/env python3
"""Unit tests for chaos-auto-resume.py (Python 3 stdlib only).

Run:  py -3 -m unittest chaos-auto-resume  (from this dir), or
      py -3 .claude/hooks/scripts/test_chaos_auto_resume.py
"""

from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import os
import sys
import tempfile
import unittest

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def _load_hook():
    spec = importlib.util.spec_from_file_location(
        "chaos_auto_resume_under_test", os.path.join(_SCRIPT_DIR, "chaos-auto-resume.py")
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


hook = _load_hook()


def _write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


def _write_json(path, obj):
    _write(path, json.dumps(obj))


def make_repo(tmp, *, enabled=True, in_session=True, active_change="change-1"):
    cfg = (
        "policies:\n"
        "  interactionRuntime:\n"
        "    autoResume:\n"
        "      # comment inside block\n"
        f"      enabled: {'true' if enabled else 'false'}\n"
        "      adapter: none\n"
        f"      inSessionResume: {'true' if in_session else 'false'}\n"
        "    diagnostics:\n"
        "      enabled: true\n"
    )
    _write(os.path.join(tmp, ".chaos", "config.yaml"), cfg)
    ac = {"command": "chaos:propose"}
    if active_change is not None:
        ac["changeId"] = active_change
    _write_json(os.path.join(tmp, ".chaos", "runtime", "active-command.json"), ac)


def seed_decision(tmp, *, decision_id="DEC-1", change_id="change-1", state="waiting",
                  run_id="RUN-1", response=None, active_state="waiting-for-user-decision"):
    idir = os.path.join(tmp, ".chaos", "interactions")
    ddir = os.path.join(idir, "decisions", decision_id)
    _write_json(os.path.join(ddir, "decision.json"), {
        "schemaVersion": 1, "decisionId": decision_id, "commandRunId": run_id,
        "changeId": change_id, "sourceCommand": "chaos:propose", "state": state,
        "title": "T", "context": "c",
        "options": [{"id": "proceed", "label": "Proceed"}, {"id": "stop", "label": "Stop"}],
    })
    if response is not None:
        _write_json(os.path.join(ddir, "response.json"), response)
    _write_json(os.path.join(idir, "active.json"), {
        "schemaVersion": 1, "state": active_state,
        "activeDecisionId": decision_id if active_state != "ready" else None,
        "activeCommandRunId": run_id, "activeChangeId": change_id,
        "pendingDecisionIds": [decision_id],
    })


def run_main(tmp, extra_argv=(), payload=None, run_id_env=None):
    old_argv, old_stdin = sys.argv, hook.common.load_json_stdin
    old_env = os.environ.get("CHAOS_COMMAND_RUN_ID")
    if run_id_env is None:
        os.environ.pop("CHAOS_COMMAND_RUN_ID", None)
    else:
        os.environ["CHAOS_COMMAND_RUN_ID"] = run_id_env
    sys.argv = ["prog", "--event", "stop", "--repo-root", tmp, *extra_argv]
    hook.common.load_json_stdin = lambda: (payload or {})
    out, err = io.StringIO(), io.StringIO()
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = hook.main()
    finally:
        sys.argv, hook.common.load_json_stdin = old_argv, old_stdin
        if old_env is None:
            os.environ.pop("CHAOS_COMMAND_RUN_ID", None)
        else:
            os.environ["CHAOS_COMMAND_RUN_ID"] = old_env
    return code, out.getvalue(), err.getvalue()


class GateParsing(unittest.TestCase):
    def test_enabled_in_session(self):
        g = hook.parse_autoresume_gate(
            "policies:\n  interactionRuntime:\n    autoResume:\n"
            "      enabled: true\n      adapter: none\n      inSessionResume: true\n"
        )
        self.assertTrue(g["enabled"] and g["inSessionResume"] and g["present"])

    def test_disabled_and_no_sibling_leak(self):
        g = hook.parse_autoresume_gate(
            "policies:\n  interactionRuntime:\n    autoResume:\n"
            "      enabled: false\n      inSessionResume: false\n"
            "    diagnostics:\n      enabled: true\n"
        )
        self.assertFalse(g["enabled"])
        self.assertFalse(g["inSessionResume"])

    def test_missing_block(self):
        g = hook.parse_autoresume_gate("policies:\n  interactionRuntime:\n    diagnostics:\n      enabled: true\n")
        self.assertFalse(g["present"])
        self.assertFalse(g["enabled"])


class GateAllows(unittest.TestCase):
    def test_on_when_flags_up_and_not_runner(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp, enabled=True, in_session=True)
            os.environ.pop("CHAOS_COMMAND_RUN_ID", None)
            self.assertTrue(hook.gate_allows_in_session_resume(tmp))

    def test_off_when_in_session_false(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp, enabled=True, in_session=False)
            os.environ.pop("CHAOS_COMMAND_RUN_ID", None)
            self.assertFalse(hook.gate_allows_in_session_resume(tmp))

    def test_off_when_runner_driven(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp, enabled=True, in_session=True)
            os.environ["CHAOS_COMMAND_RUN_ID"] = "RUN-x"
            try:
                self.assertFalse(hook.gate_allows_in_session_resume(tmp))
            finally:
                os.environ.pop("CHAOS_COMMAND_RUN_ID", None)


class FindPending(unittest.TestCase):
    def test_matches_waiting_decision(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp, active_change="change-1")
            seed_decision(tmp, state="waiting", change_id="change-1")
            p = hook.find_pending_decision(tmp, hook.common.load_active_command(tmp))
            self.assertIsNotNone(p)
            self.assertEqual(p["decisionId"], "DEC-1")

    def test_change_mismatch_is_ignored(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp, active_change="other-change")
            seed_decision(tmp, state="waiting", change_id="change-1")
            self.assertIsNone(hook.find_pending_decision(tmp, hook.common.load_active_command(tmp)))

    def test_no_active_change_accepts_single(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp, active_change=None)
            seed_decision(tmp, state="waiting", change_id="change-1")
            self.assertIsNotNone(hook.find_pending_decision(tmp, hook.common.load_active_command(tmp)))

    def test_consumed_decision_is_not_pending(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp)
            seed_decision(tmp, state="consumed", active_state="ready")
            self.assertIsNone(hook.find_pending_decision(tmp, hook.common.load_active_command(tmp)))


class ClassifyAndReason(unittest.TestCase):
    def test_classify(self):
        self.assertEqual(hook.classify_outcome("answered", {"selectedOptionId": "proceed"}), "answered")
        self.assertEqual(hook.classify_outcome("answered", None), "pending")  # no response yet
        self.assertEqual(hook.classify_outcome("consumed", None), "closed")
        self.assertEqual(hook.classify_outcome("cancelled", None), "closed")
        self.assertEqual(hook.classify_outcome("waiting", None), "pending")

    def test_reason_contains_key_fields(self):
        pending = {"decisionId": "DEC-1", "changeId": "change-1", "sourceCommand": "chaos:propose",
                   "commandRunId": "RUN-1", "options": [{"id": "proceed", "label": "Proceed now"}]}
        reason = hook.build_resume_reason(pending, {"selectedOptionId": "proceed", "rationale": "because"})
        self.assertIn("DEC-1", reason)
        self.assertIn("proceed", reason)
        self.assertIn("Proceed now", reason)
        self.assertIn("because", reason)
        self.assertIn("do NOT restart", reason)


class MainSmoke(unittest.TestCase):
    def test_gate_off_is_noop(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp, enabled=False, in_session=True)
            seed_decision(tmp, state="waiting")
            code, out, _ = run_main(tmp)
            self.assertEqual(code, 0)
            self.assertEqual(out, "")

    def test_runner_driven_is_noop(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp)
            seed_decision(tmp, state="waiting")
            code, out, _ = run_main(tmp, run_id_env="RUN-runner")
            self.assertEqual(code, 0)
            self.assertEqual(out, "")

    def test_no_pending_allows_stop(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp)
            seed_decision(tmp, state="consumed", active_state="ready")
            code, out, _ = run_main(tmp)
            self.assertEqual(code, 0)
            self.assertEqual(out, "")

    def test_answered_emits_block(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp)
            seed_decision(tmp, state="waiting")
            saved = hook.read_decision_outcome
            hook.read_decision_outcome = lambda repo, did: ("answered", {"selectedOptionId": "proceed", "rationale": "ok"})
            try:
                code, out, _ = run_main(tmp, extra_argv=["--poll-interval-seconds", "0.01"])
            finally:
                hook.read_decision_outcome = saved
            self.assertEqual(code, 0)
            payload = json.loads(out)
            self.assertEqual(payload["decision"], "block")
            self.assertIn("DEC-1", payload["reason"])

    def test_timeout_allows_stop(self):
        with tempfile.TemporaryDirectory() as tmp:
            make_repo(tmp)
            seed_decision(tmp, state="waiting")
            saved = hook.read_decision_outcome
            hook.read_decision_outcome = lambda repo, did: ("waiting", None)
            try:
                code, out, err = run_main(tmp, extra_argv=["--max-wait-seconds", "0", "--poll-interval-seconds", "0.01"])
            finally:
                hook.read_decision_outcome = saved
            self.assertEqual(code, 0)
            self.assertEqual(out, "")
            self.assertIn("still waiting", err)


if __name__ == "__main__":
    unittest.main(verbosity=2)
