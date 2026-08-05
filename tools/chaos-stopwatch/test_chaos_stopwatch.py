#!/usr/bin/env python3
"""Unit tests for the independent wall-clock instrument (stdlib unittest, tmpdir fixtures)."""

import datetime
import json
import os
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stopwatch as S  # noqa: E402

T0 = datetime.datetime(2026, 8, 4, 7, 0, 0, tzinfo=datetime.timezone.utc)


def at(seconds):
    return (T0 + datetime.timedelta(seconds=seconds)).isoformat().replace("+00:00", "Z")


def assistant(seconds, text="working"):
    return {"type": "assistant", "timestamp": at(seconds),
            "message": {"role": "assistant", "content": [{"type": "text", "text": text}]}}


def prompt(seconds, text="do the thing"):
    return {"type": "user", "timestamp": at(seconds),
            "message": {"role": "user", "content": [{"type": "text", "text": text}]}}


def tool_result(seconds):
    return {"type": "user", "timestamp": at(seconds), "toolUseResult": {"ok": True},
            "message": {"role": "user",
                        "content": [{"type": "tool_result", "content": "done"}]}}


def write_jsonl(path, records):
    with open(path, "w", encoding="utf-8") as handle:
        for rec in records:
            handle.write(json.dumps(rec) + "\n")


class TestRealPromptDetection(unittest.TestCase):
    """The segment boundary. Over-detecting DELETES machine time, so it must be strict."""

    def test_plain_user_prompt_is_real(self):
        self.assertTrue(S.is_real_prompt(prompt(0, "build the stopwatch")))

    def test_tool_result_is_not_a_prompt(self):
        self.assertFalse(S.is_real_prompt(tool_result(0)))

    def test_meta_record_is_not_a_prompt(self):
        rec = prompt(0, "some injected note")
        rec["isMeta"] = True
        self.assertFalse(S.is_real_prompt(rec))

    def test_sidechain_record_is_not_a_prompt(self):
        rec = prompt(0)
        rec["isSidechain"] = True
        self.assertFalse(S.is_real_prompt(rec))

    def test_runtime_wrappers_are_not_prompts(self):
        for wrapper in ("<local-command-stdout>Set model</local-command-stdout>",
                        "<ide_opened_file>a.cs</ide_opened_file>",
                        "<system-reminder>note</system-reminder>"):
            self.assertFalse(S.is_real_prompt(prompt(0, wrapper)), wrapper)

    def test_a_slash_command_IS_a_user_turn(self):
        """`/chaos-run "..."` is how the product is actually invoked. If it does not open a
        segment, the human's thinking time before it is charged to the tool."""
        rec = prompt(0, '<command-name>/chaos-run</command-name>\n'
                        '<command-message>chaos-run</command-message>\n'
                        '<command-args>"Add a ?priority= filter to GET /tasks"</command-args>')
        self.assertTrue(S.is_real_prompt(rec))

    def test_slash_invocation_excludes_the_human_wait_before_it(self):
        """The regression this guards: 20 min of the user deciding, then a 2 min run."""
        recs = [(S.parse_ts(r["timestamp"]), r) for r in [
            prompt(0, "some earlier question"), assistant(60),
            prompt(1260, '<command-name>/chaos-run</command-name>'
                         '<command-args>"add a filter"</command-args>'),
            assistant(1380)]]
        m = S.measure(recs)
        self.assertEqual(m["machine"], 180.0)      # 60 + 120, NOT 1380
        self.assertEqual(m["humanWait"], 1200.0)

    def test_window_matches_text_inside_a_slash_invocation(self):
        recs = [(S.parse_ts(r["timestamp"]), r) for r in [
            prompt(0, "chatter"), assistant(10),
            prompt(100, '<command-name>/chaos-run</command-name>'
                        '<command-args>"Add an optional ?priority= query filter"</command-args>'),
            assistant(400)]]
        got = S.window(recs, from_match=r"\?priority= query filter")
        self.assertEqual(S.measure(got)["machine"], 300.0)

    def test_real_text_alongside_an_injected_wrapper_still_counts(self):
        """A genuine prompt often arrives in the same record as injected IDE context."""
        rec = {"type": "user", "timestamp": at(0), "message": {"role": "user", "content": [
            {"type": "text", "text": "<ide_opened_file>a.cs</ide_opened_file>"},
            {"type": "text", "text": "now run chaos:run"}]}}
        self.assertTrue(S.is_real_prompt(rec))

    def test_assistant_record_is_not_a_prompt(self):
        self.assertFalse(S.is_real_prompt(assistant(0)))


class TestMeasure(unittest.TestCase):
    def test_workflow_shape_has_no_human_wait(self):
        """An arm gets one task and runs: machine == elapsed."""
        recs = [(S.parse_ts(r["timestamp"]), r)
                for r in [prompt(0), assistant(10), assistant(120)]]
        m = S.measure(recs)
        self.assertEqual(m["elapsed"], 120.0)
        self.assertEqual(m["machine"], 120.0)
        self.assertEqual(m["humanWait"], 0.0)

    def test_human_thinking_time_is_excluded_from_the_gated_number(self):
        """Turn 1: 0->60s. Human thinks 0:60->0:300. Turn 2: 300->360s."""
        recs = [(S.parse_ts(r["timestamp"]), r) for r in
                [prompt(0), assistant(30), assistant(60), prompt(300), assistant(360)]]
        m = S.measure(recs)
        self.assertEqual(m["elapsed"], 360.0)
        self.assertEqual(m["machine"], 120.0)   # 60 + 60
        self.assertEqual(m["humanWait"], 240.0)
        self.assertEqual(m["turns"], 2)

    def test_first_token_latency_counts_as_machine_time(self):
        """The gap from the prompt to the first assistant record is real waiting."""
        recs = [(S.parse_ts(r["timestamp"]), r) for r in [prompt(0), assistant(45)]]
        self.assertEqual(S.measure(recs)["machine"], 45.0)

    def test_transcript_with_no_leading_prompt_still_measures(self):
        recs = [(S.parse_ts(r["timestamp"]), r) for r in [assistant(0), assistant(90)]]
        m = S.measure(recs)
        self.assertEqual(m["machine"], 90.0)

    def test_empty_input_fails_closed(self):
        with self.assertRaises(S.DataError):
            S.measure([])


def ask_question(seconds, tool_id="tu_1"):
    return {"type": "assistant", "timestamp": at(seconds),
            "message": {"role": "assistant", "content": [
                {"type": "tool_use", "id": tool_id, "name": "AskUserQuestion",
                 "input": {"questions": []}}]}}


def question_answer(seconds, tool_id="tu_1"):
    return {"type": "user", "timestamp": at(seconds), "toolUseResult": {"ok": True},
            "message": {"role": "user", "content": [
                {"type": "tool_result", "tool_use_id": tool_id, "content": "answered"}]}}


def decision_center_hook(seconds):
    """The runtime's isMeta record when a CHAOS stop is answered outside the chat."""
    rec = prompt(seconds, "Stop hook feedback:\nThe pending CHAOS decision was answered in the "
                          "Decision Center. Continue this command in-session.")
    rec["isMeta"] = True
    return rec


class TestHumanGatesInsideATurn(unittest.TestCase):
    """Both leaks that charged a person's thinking time to the gated number (2026-08-05).

    Direction matters: this is the only code path that SUBTRACTS from `machine`, so a false
    positive flatters CHAOS. Detection must fire on the two runtime mechanisms and nothing else.
    """

    def test_ask_user_question_wait_is_not_machine_time(self):
        records = S.window([(S.parse_ts(r["timestamp"]), r) for r in [
            prompt(0), assistant(5), ask_question(10), question_answer(70), assistant(80)]])
        result = S.measure(records)
        # 80 s wall, 60 s of it spent waiting on the person.
        self.assertEqual(result["elapsed"], 80.0)
        self.assertEqual(result["humanGateSeconds"], 60.0)
        self.assertEqual(result["machine"], 20.0)
        self.assertEqual(result["humanWait"], 60.0)
        self.assertEqual(result["turns"], 1)

    def test_decision_center_answer_is_not_machine_time(self):
        records = [(S.parse_ts(r["timestamp"]), r) for r in [
            prompt(0), assistant(30, "S1 — stopped, waiting on your answer"),
            decision_center_hook(630), assistant(650, "resuming")]]
        result = S.measure(records)
        self.assertEqual(result["humanGateSeconds"], 600.0)
        self.assertEqual(result["machine"], 50.0)
        # The hook is isMeta, so it must not also open a turn.
        self.assertEqual(result["turns"], 1)

    def test_both_gates_in_one_run_are_both_removed(self):
        records = [(S.parse_ts(r["timestamp"]), r) for r in [
            prompt(0), ask_question(10), question_answer(40),
            assistant(50, "stopped"), decision_center_hook(350), assistant(360)]]
        result = S.measure(records)
        self.assertEqual(result["humanGateSeconds"], 330.0)
        self.assertEqual(result["machine"], 30.0)
        self.assertEqual([g["kind"] for g in result["humanGates"]],
                         ["askUserQuestion", "decisionCenter"])

    def test_ordinary_model_thinking_is_never_treated_as_a_gate(self):
        records = [(S.parse_ts(r["timestamp"]), r) for r in [
            prompt(0), assistant(5), assistant(400, "long deliberation"), assistant(500)]]
        result = S.measure(records)
        self.assertEqual(result["humanGateSeconds"], 0.0)
        self.assertEqual(result["machine"], 500.0)

    def test_a_lookalike_sentence_from_the_model_is_not_a_gate(self):
        """Only the runtime's isMeta hook counts — an assistant saying it is not enough."""
        records = [(S.parse_ts(r["timestamp"]), r) for r in [
            prompt(0),
            assistant(300, "Stop hook feedback: The pending CHAOS decision was answered"),
            assistant(310)]]
        self.assertEqual(S.measure(records)["humanGateSeconds"], 0.0)

    def test_a_non_meta_user_turn_quoting_the_hook_is_a_turn_not_a_gate(self):
        """A human pasting the sentence takes a turn; the wait before it is already excluded."""
        records = [(S.parse_ts(r["timestamp"]), r) for r in [
            prompt(0), assistant(20),
            prompt(300, "Stop hook feedback:\nThe pending CHAOS decision was answered"),
            assistant(320)]]
        result = S.measure(records)
        self.assertEqual(result["humanGateSeconds"], 0.0)
        self.assertEqual(result["turns"], 2)
        self.assertEqual(result["machine"], 40.0)

    def test_an_unanswered_question_is_not_a_gate(self):
        """No tool_result means the run was killed mid-question; nothing to subtract."""
        records = [(S.parse_ts(r["timestamp"]), r) for r in [
            prompt(0), ask_question(10), assistant(600, "never answered")]]
        self.assertEqual(S.measure(records)["humanGateSeconds"], 0.0)

    def test_a_gate_can_never_drive_machine_negative(self):
        records = [(S.parse_ts(r["timestamp"]), r) for r in [
            ask_question(0), question_answer(100), prompt(100, "go")]]
        self.assertGreaterEqual(S.measure(records)["machine"], 0.0)


def bookkeeping(seconds, rectype="queue-operation"):
    return {"type": rectype, "timestamp": at(seconds)}


class TestBookkeepingNeverClosesATurn(unittest.TestCase):
    """queue-operation / attachment / file-history records are stamped at the HUMAN's submit
    time when they accompany the next prompt, so letting one close the previous segment
    charges the whole between-turn wait to `machine`. Measured: 2.8 min (T5 plain, trailing
    queue-operations) and 8.4 hours (governed T2, overnight S1 stop resumed next morning)."""

    def test_queue_operation_never_reaches_the_timeline(self):
        write_jsonl(self._path, [prompt(0), assistant(30, "S1 stop, waiting"),
                                 bookkeeping(30300), bookkeeping(30300),
                                 prompt(30310, "chaos:resume --change x"),
                                 assistant(30340, "resumed")])
        result = S.measure(S.read_records(self._path))
        # 8.4 h of overnight wait lands in humanWait, not machine.
        self.assertEqual(result["machine"], 60.0)
        self.assertEqual(result["turns"], 2)
        self.assertEqual(result["humanWait"], 30280.0)

    def setUp(self):
        self._dir = tempfile.mkdtemp()
        self._path = os.path.join(self._dir, "t.jsonl")

    def tearDown(self):
        shutil.rmtree(self._dir, ignore_errors=True)

    def test_prompt_submission_attachments_do_not_close_the_previous_turn(self):
        """The T5-plain shape: attachments stamped with the next prompt's submission."""
        recs = [prompt(0), assistant(30, "done"),
                bookkeeping(170, "attachment"), bookkeeping(170, "file-history-snapshot"),
                prompt(171, "next task"), assistant(200)]
        result = S.measure([(S.parse_ts(r["timestamp"]), r) for r in recs])
        # turn 1 must close at the assistant record (30 s), not the attachment (170 s)
        self.assertEqual(result["machine"], 59.0)  # 30 + (200-171)
        self.assertEqual(result["turns"], 2)

    def test_mid_activity_bookkeeping_changes_nothing(self):
        recs = [prompt(0), bookkeeping(5, "file-history-delta"), assistant(6),
                bookkeeping(10, "attachment"), assistant(40, "done")]
        result = S.measure([(S.parse_ts(r["timestamp"]), r) for r in recs])
        self.assertEqual(result["machine"], 40.0)


class TestReadRecords(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.dir, ignore_errors=True)

    def test_malformed_lines_and_untimestamped_records_are_skipped(self):
        path = os.path.join(self.dir, "t.jsonl")
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(json.dumps(assistant(0)) + "\n")
            handle.write("{not json\n")
            handle.write("\n")
            handle.write(json.dumps({"type": "assistant", "message": {}}) + "\n")  # no timestamp
            handle.write(json.dumps(assistant(60)) + "\n")
        self.assertEqual(len(S.read_records(path)), 2)


class TestWindow(unittest.TestCase):
    def setUp(self):
        self.recs = [(S.parse_ts(r["timestamp"]), r) for r in
                     [prompt(0, "unrelated chatter"), assistant(10),
                      prompt(100, "please run chaos:run now"), assistant(160), assistant(220),
                      prompt(400, "thanks, something else"), assistant(430)]]

    def test_from_match_starts_at_the_matching_prompt(self):
        got = S.window(self.recs, from_match=r"chaos:run")
        self.assertEqual(got[0][0], S.parse_ts(at(100)))

    def test_to_match_ends_before_the_next_matching_prompt(self):
        got = S.window(self.recs, from_match=r"chaos:run", to_match=r"something else")
        self.assertEqual(S.measure(got)["elapsed"], 120.0)   # 100 -> 220
        self.assertEqual(S.measure(got)["machine"], 120.0)

    def test_unmatched_pattern_fails_closed(self):
        with self.assertRaises(S.DataError):
            S.window(self.recs, from_match=r"never appears")
        with self.assertRaises(S.DataError):
            S.window(self.recs, from_match=r"chaos:run", to_match=r"never appears")


class TestWorkflowOrdering(unittest.TestCase):
    """The read-volume.py trap: transcripts are hash-named, so sorting shuffles the arms."""

    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.dir, ignore_errors=True)
        # 'zzz' starts first but sorts last — sorting would swap the two arms.
        write_jsonl(os.path.join(self.dir, "agent-zzz.jsonl"), [prompt(0), assistant(600)])
        write_jsonl(os.path.join(self.dir, "agent-aaa.jsonl"), [prompt(0), assistant(60)])
        write_jsonl(os.path.join(self.dir, "journal.jsonl"),
                    [{"type": "started", "agentId": "zzz"}, {"type": "started", "agentId": "aaa"}])

    def test_arms_follow_journal_start_order_not_filename(self):
        report = S.cmd_workflow(_args(workflow_dir=self.dir, names="X-gov,X-plain"))
        self.assertEqual(report["arms"]["X-gov"]["machine"], 600.0)
        self.assertEqual(report["arms"]["X-plain"]["machine"], 60.0)

    def test_missing_journal_fails_closed_rather_than_guessing(self):
        os.remove(os.path.join(self.dir, "journal.jsonl"))
        with self.assertRaises(S.DataError):
            S.cmd_workflow(_args(workflow_dir=self.dir, names="X-gov,X-plain"))

    def test_allow_unordered_is_opt_in(self):
        os.remove(os.path.join(self.dir, "journal.jsonl"))
        report = S.cmd_workflow(_args(workflow_dir=self.dir, names="X-gov,X-plain",
                                      allow_unordered=True))
        self.assertEqual(report["arms"]["X-gov"]["machine"], 60.0)   # sorted: aaa first

    def test_more_transcripts_than_names_fails_closed(self):
        with self.assertRaises(S.DataError):
            S.cmd_workflow(_args(workflow_dir=self.dir, names="only-one"))


class TestBandsAndGate(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.dir, ignore_errors=True)
        # A-gov 4 min, A-plain 1 min, B-gov 12 min, B-plain 2 min
        for name, secs in (("a1", 240), ("a2", 60), ("b1", 720), ("b2", 120)):
            write_jsonl(os.path.join(self.dir, "agent-%s.jsonl" % name),
                        [prompt(0), assistant(secs)])
        write_jsonl(os.path.join(self.dir, "journal.jsonl"),
                    [{"type": "started", "agentId": a} for a in ("a1", "a2", "b1", "b2")])
        self.names = "A-gov,A-plain,B-gov,B-plain"

    def _run(self, bars):
        return S.cmd_workflow(_args(workflow_dir=self.dir, names=self.names,
                                    band=["bandA=A", "bandB=B"], bar=bars))

    def test_band_within_bar_passes(self):
        report = self._run(["bandA=5", "bandB=15"])
        self.assertFalse(report["breached"])
        self.assertIn("PASS", report["bands"]["bandA"]["verdict"])

    def test_band_over_bar_breaches_and_reports_the_multiple(self):
        report = self._run(["bandA=5", "bandB=5"])
        self.assertTrue(report["breached"])
        self.assertIn("FAIL 2.4x", report["bands"]["bandB"]["verdict"])

    def test_gate_exit_codes(self):
        base = ["workflow", self.dir, "--names", self.names,
                "--band", "bandA=A", "--band", "bandB=B", "--json"]
        self.assertEqual(S.main(base + ["--bar", "bandA=5", "--bar", "bandB=15"]), 0)
        self.assertEqual(S.main(base + ["--bar", "bandB=5"]), 1)

    def test_bad_input_exits_2_not_1(self):
        """A usage error must never be mistaken for a clean pass or a real breach."""
        self.assertEqual(S.main(["workflow", os.path.join(self.dir, "nope")]), 2)

    def test_band_naming_an_unmeasured_arm_fails_closed(self):
        with self.assertRaises(S.DataError):
            S.cmd_workflow(_args(workflow_dir=self.dir, names=self.names, band=["x=GHOST"]))

    def test_time_ratio_uses_the_plain_control(self):
        report = self._run(["bandA=5"])
        self.assertEqual(report["bands"]["bandA"]["timeRatio"], 4.0)   # 240s / 60s
        self.assertEqual(report["bands"]["bandA"]["meanMinPerChange"], 4.0)

    def test_malformed_bar_fails_closed(self):
        with self.assertRaises(S.DataError):
            S.parse_pairs(["bandA5"], "bar")


class TestSessionGate(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.dir, ignore_errors=True)
        self.path = os.path.join(self.dir, "session.jsonl")
        # 3 min of machine work, then 20 min of human thinking, then 1 more minute.
        write_jsonl(self.path, [prompt(0, "run chaos:run"), assistant(90), assistant(180),
                                prompt(1380, "ok continue"), assistant(1440)])

    def test_human_wait_does_not_fail_the_gate(self):
        """A CHAOS stop is the product working; the human's deliberation is not our latency."""
        report = S.cmd_session(_args(transcript=self.path, bar=5.0))
        self.assertEqual(report["machineMin"], 4.0)      # 180s + 60s
        self.assertEqual(report["elapsedMin"], 24.0)
        self.assertEqual(report["humanWaitMin"], 20.0)
        self.assertFalse(report["breached"])

    def test_gate_fires_on_machine_time(self):
        report = S.cmd_session(_args(transcript=self.path, bar=3.0))
        self.assertTrue(report["breached"])


def _args(**kw):
    """Minimal argparse.Namespace stand-in with the defaults the commands expect."""
    defaults = {"names": None, "band": None, "bar": None, "allow_unordered": False,
                "json": False, "from_match": None, "to_match": None, "transcript": None,
                "workflow_dir": None}
    defaults.update(kw)
    return type("Args", (), defaults)()


if __name__ == "__main__":
    unittest.main(verbosity=2)
