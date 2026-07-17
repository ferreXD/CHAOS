#!/usr/bin/env python3
"""CHAOS vNext runtime hook — stop summary.

Reads all `.chaos/runtime/*` files and prints a concise summary at the end
of a turn/session. Checks whether the active command's expectedArtifacts
exist and logs CHAOS-HOOK-005 warnings for any that are missing. Also
makes a best-effort attempt at decision-wait detection from the Stop
payload's transcript, if one is available. Python 3 standard library only.

Report-only by default; --strict only affects exit code on critical
runtime errors (e.g. unreadable/corrupt runtime JSON), never on ordinary
missing-artifact or decision-wait findings. See
../reference/hook-runtime-policy.md and
../reference/decision-wait-contract.md.
"""

from __future__ import annotations

import importlib.util
import json
import os
import re
import sys
from typing import Any, Dict, List, Optional

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def _bootstrap_common():
    spec = importlib.util.spec_from_file_location("chaos_hook_common", os.path.join(_SCRIPT_DIR, "chaos-hook-common.py"))
    if spec is None or spec.loader is None:
        raise ImportError("could not load chaos-hook-common.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


common = _bootstrap_common()

HOOK_NAME = "chaos-stop-summary"

_TITLE_RE = re.compile(r"decision required\s*:\s*([^\n]*)", re.IGNORECASE)
_OPTION_LINE_RE = re.compile(r"(?m)^\s*(\d+)\.\s")
_RECOMMENDED_RE = re.compile(r"(?m)^\s*(\d+)\.[^\n]*\(recommended\)", re.IGNORECASE)


def _read_transcript_tail(transcript_path: str, max_bytes: int = 8000) -> str:
    try:
        if not transcript_path or not os.path.isfile(transcript_path):
            return ""
        with open(transcript_path, "r", encoding="utf-8", errors="replace") as fh:
            fh.seek(0, os.SEEK_END)
            size = fh.tell()
            fh.seek(max(0, size - max_bytes))
            return fh.read()
    except Exception:
        return ""


def _detect_decision_wait(repo_root: str, payload: Dict[str, Any], chaos_command: str, change_id: str, dry_run: bool) -> Optional[Dict[str, Any]]:
    """Best-effort only. Returns the recorded decision-wait dict, or None."""
    transcript_path = payload.get("transcript_path")
    tail_text = _read_transcript_tail(str(transcript_path)) if transcript_path else ""
    if not tail_text or not common.detect_decision_wait_text(tail_text):
        return None
    try:
        title_match = _TITLE_RE.search(tail_text)
        title = title_match.group(1).strip() if title_match else ""
        options_count = len(_OPTION_LINE_RE.findall(tail_text))
        rec_match = _RECOMMENDED_RE.search(tail_text)
        recommended = rec_match.group(1) if rec_match else ""
    except Exception:
        title, options_count, recommended = "", 0, ""

    return common.record_decision_wait(
        repo_root,
        command=chaos_command,
        change_id=change_id,
        decision_title=title,
        options_count=options_count,
        recommended_option=recommended,
        source="assistant-output",
        status="waiting",
        confidence="LOW",
        dry_run=dry_run,
    )


def _check_expected_artifacts(repo_root: str, active: Dict[str, Any]) -> Dict[str, Any]:
    expected = active.get("expectedArtifacts") if isinstance(active.get("expectedArtifacts"), list) else []
    present: List[str] = []
    missing: List[str] = []
    for rel_path in expected:
        if not isinstance(rel_path, str) or not rel_path:
            continue
        if os.path.isfile(os.path.join(repo_root, rel_path)):
            present.append(rel_path)
        else:
            missing.append(rel_path)
    return {"expected": expected, "present": present, "missing": missing}


def _count_by(records: List[Dict[str, Any]], key: str) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for r in records:
        value = str(r.get(key, "unknown") or "unknown")
        counts[value] = counts.get(value, 0) + 1
    return counts


def main() -> int:
    parser = common.common_arg_parser("CHAOS stop-summary hook (reads .chaos/runtime/* and prints a concise summary).")
    parser.add_argument("--event", choices=["stop"], required=True)
    args = parser.parse_args()

    critical_error = False

    try:
        payload = common.load_json_stdin()
        repo_root = common.find_repo_root(args.repo_root, payload)
        runtime_path, created = common.ensure_runtime_dir(repo_root, dry_run=args.dry_run)
        if created:
            common.log_violation(repo_root, "INFO", HOOK_NAME, "CHAOS-HOOK-001", "runtime directory created", confidence="HIGH", dry_run=args.dry_run)

        session_path = os.path.join(runtime_path, common.SESSION_CONTEXT_FILENAME)
        active_path = os.path.join(runtime_path, common.ACTIVE_COMMAND_FILENAME)

        session = common.read_json_file(session_path) or {}
        if os.path.isfile(session_path) and not session:
            common.log_violation(repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-009", "session-context.json exists but could not be parsed as JSON", path="session-context.json", confidence="LOW", dry_run=args.dry_run)
            critical_error = True

        active = common.read_json_file(active_path) or {}
        if os.path.isfile(active_path) and not active:
            common.log_violation(repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-009", "active-command.json exists but could not be parsed as JSON", path="active-command.json", confidence="LOW", dry_run=args.dry_run)
            critical_error = True

        chaos_command = str(active.get("command") or "")
        change_id = str(active.get("changeId") or "")

        touched_files, touched_malformed = common.read_jsonl(os.path.join(runtime_path, common.TOUCHED_FILES_FILENAME))
        if touched_malformed:
            common.log_violation(repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-009", f"{touched_malformed} malformed line(s) in touched-files.jsonl", path="touched-files.jsonl", confidence="LOW", dry_run=args.dry_run)

        violations_before, violations_malformed = common.read_jsonl(os.path.join(runtime_path, common.HOOK_VIOLATIONS_FILENAME))
        if violations_malformed:
            common.log_violation(repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-009", f"{violations_malformed} malformed line(s) in hook-violations.jsonl", path="hook-violations.jsonl", confidence="LOW", dry_run=args.dry_run)

        decisions, decisions_malformed = common.read_jsonl(os.path.join(runtime_path, common.DECISION_WAITS_FILENAME))
        if decisions_malformed:
            common.log_violation(repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-009", f"{decisions_malformed} malformed line(s) in decision-waits.jsonl", path="decision-waits.jsonl", confidence="LOW", dry_run=args.dry_run)

        artifacts = _check_expected_artifacts(repo_root, active)
        for missing_path in artifacts["missing"]:
            common.log_violation(
                repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-005",
                f"expected artifact not found at stop: {missing_path}",
                command=chaos_command, change_id=change_id, path=missing_path, confidence="MEDIUM", dry_run=args.dry_run,
            )

        new_decision_wait = _detect_decision_wait(repo_root, payload, chaos_command, change_id, args.dry_run)
        if new_decision_wait:
            common.log_violation(
                repo_root, "INFO", HOOK_NAME, "CHAOS-HOOK-006", "decision wait detected",
                command=chaos_command, change_id=change_id, confidence="LOW", dry_run=args.dry_run,
            )
            decisions = decisions + [new_decision_wait]

        # Re-read violations after this run's own log_violation calls so the
        # summary reflects what actually landed in the file (skipped when --dry-run).
        violations_after, _ = common.read_jsonl(os.path.join(runtime_path, common.HOOK_VIOLATIONS_FILENAME)) if not args.dry_run else (violations_before, 0)

        summary = {
            "schemaVersion": common.SCHEMA_VERSION,
            "generatedAt": common.now_iso(),
            "sessionContext": {
                "provider": session.get("provider", "unknown"),
                "branch": (session.get("branch") or {}).get("name", "unknown"),
                "confidence": (session.get("resolution") or {}).get("confidence", "LOW"),
            },
            "activeCommand": {
                "command": chaos_command or "(none)",
                "changeId": change_id or "(none)",
                "mode": active.get("mode", "unknown"),
                "confidence": active.get("confidence", "LOW"),
            },
            "touchedFiles": {
                "count": len(touched_files),
                "byOperation": _count_by(touched_files, "operation"),
            },
            "hookViolations": {
                "count": len(violations_after),
                "bySeverity": _count_by(violations_after, "severity"),
            },
            "decisionWaits": {
                "count": len(decisions),
                "waiting": sum(1 for d in decisions if d.get("status") == "waiting"),
            },
            "expectedArtifacts": artifacts,
        }

        if args.print_output:
            print(json.dumps(summary, indent=2))
        else:
            print(f"{HOOK_NAME} (stop) — CHAOS runtime observability summary")
            print(f"  active command: {summary['activeCommand']['command']} (changeId={summary['activeCommand']['changeId']}, mode={summary['activeCommand']['mode']}, confidence={summary['activeCommand']['confidence']})")
            print(f"  session: provider={summary['sessionContext']['provider']} branch={summary['sessionContext']['branch']} confidence={summary['sessionContext']['confidence']}")
            print(f"  touched files logged: {summary['touchedFiles']['count']} {summary['touchedFiles']['byOperation']}")
            print(f"  hook violations logged: {summary['hookViolations']['count']} {summary['hookViolations']['bySeverity']}")
            print(f"  decision waits: {summary['decisionWaits']['count']} (waiting={summary['decisionWaits']['waiting']})")
            if artifacts["expected"]:
                print(f"  expected artifacts: {len(artifacts['present'])}/{len(artifacts['expected'])} present" + (f" — missing: {artifacts['missing']}" if artifacts["missing"] else ""))

        if args.strict and critical_error:
            print("chaos-stop-summary: critical runtime error in --strict mode (see hook-violations.jsonl)", file=sys.stderr)
            return 2
        return 0
    except SystemExit:
        raise
    except Exception as exc:  # never let an internal bug block the session
        print(f"{HOOK_NAME}: internal error (non-blocking): {exc}", file=sys.stderr)
        try:
            repo_root = common.find_repo_root(None, {})
            common.log_violation(repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-010", f"recovered from non-fatal error: {exc}", confidence="LOW")
        except Exception:
            pass
        return 2 if args.strict else 0


if __name__ == "__main__":
    _exit_code = main()
    common.exit_hard(_exit_code)
