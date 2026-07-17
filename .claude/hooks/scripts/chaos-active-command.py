#!/usr/bin/env python3
"""CHAOS vNext runtime hook — active command detection.

Builds `.chaos/runtime/active-command.json`: a best-effort record of which
CHAOS command the current turn appears to be running, parsed from the
Claude Code hook payload's prompt text. Python 3 standard library only.

This hook only *records* detection. It does not enforce read-only/scope
boundaries, does not block writes, and does not ask the user anything —
see ../reference/active-command-detection.md and
../reference/hook-runtime-policy.md.
"""

from __future__ import annotations

import importlib.util
import json
import os
import re
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def _bootstrap_common():
    spec = importlib.util.spec_from_file_location("chaos_hook_common", os.path.join(_SCRIPT_DIR, "chaos-hook-common.py"))
    if spec is None or spec.loader is None:
        raise ImportError("could not load chaos-hook-common.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


common = _bootstrap_common()

HOOK_NAME = "chaos-active-command"
DETECTED_BY = "chaos-active-command-hook"

# canonical "chaos:<name>" token -> table entry. "{changeId}", "{date}", "{topic}"
# are resolved (or the whole entry dropped) when the active-command.json is written.
COMMAND_TABLE: Dict[str, Dict[str, Any]] = {
    "init": {
        "readOnly": False, "scope": "unknown",
        "expectedArtifacts": [], "allowedWriteGlobs": [".chaos/**", "AGENTS.md"],
        "notes": ["chaos:init is not read-only; it bootstraps the .chaos workspace."],
    },
    "help": {
        "readOnly": True, "scope": "unknown",
        "expectedArtifacts": [], "allowedWriteGlobs": [],
        "notes": ["chaos:help is read-only."],
    },
    "status": {
        "readOnly": True, "scope": "repository",
        "expectedArtifacts": [".chaos/status-report.md"], "allowedWriteGlobs": [".chaos/status-report.md"],
        "notes": ["read-only except the status report itself."],
    },
    "doctor": {
        "readOnly": True, "scope": "repository",
        "expectedArtifacts": [".chaos/doctor/doctor-report-{date}.md"], "allowedWriteGlobs": [".chaos/doctor/**", ".chaos/runtime/**"],
        "notes": ["read-only except the doctor report and runtime files."],
    },
    "archaeology": {
        "readOnly": True, "scope": "topic",
        "expectedArtifacts": [".chaos/archaeology/{topic}-archaeology.md"], "allowedWriteGlobs": [".chaos/archaeology/**"],
        "notes": ["read-only except the archaeology report/index."],
    },
    "archeology": {
        "readOnly": True, "scope": "topic",
        "expectedArtifacts": [".chaos/archaeology/{topic}-archaeology.md"], "allowedWriteGlobs": [".chaos/archaeology/**"],
        "notes": ["alternate spelling of chaos:archaeology; read-only except the archaeology report/index."],
    },
    "propose": {
        "readOnly": False, "scope": "change",
        "expectedArtifacts": [".chaos/changes/{changeId}/lifecycle.md"],
        "allowedWriteGlobs": [".chaos/changes/{changeId}/**", "openspec/changes/{changeId}/**"],
        "notes": [],
    },
    "review": {
        "readOnly": True, "scope": "change",
        "expectedArtifacts": [".chaos/changes/{changeId}/proposal-review.md"],
        "allowedWriteGlobs": [
            ".chaos/changes/{changeId}/proposal-review.md",
            ".chaos/changes/{changeId}/approval.md",
            ".chaos/changes/{changeId}/decision-events.md",
        ],
        "notes": ["read-only except review/approval/decision artifacts."],
    },
    "apply": {
        "readOnly": False, "scope": "change",
        "expectedArtifacts": [".chaos/changes/{changeId}/apply-report.md"], "allowedWriteGlobs": ["**"],
        "notes": ["not read-only; implements the approved change."],
    },
    "code-review": {
        "readOnly": True, "scope": "change",
        "expectedArtifacts": [".chaos/changes/{changeId}/code-review.md"], "allowedWriteGlobs": [".chaos/changes/{changeId}/code-review.md"],
        "notes": ["read-only except the code-review report."],
    },
    "verify": {
        "readOnly": True, "scope": "change",
        "expectedArtifacts": [".chaos/changes/{changeId}/verification.md"], "allowedWriteGlobs": [".chaos/changes/{changeId}/verification.md"],
        "notes": ["read-only except the verification report."],
    },
    "archive": {
        "readOnly": False, "scope": "change",
        "expectedArtifacts": [".chaos/changes/{changeId}/archive-report.md"],
        "allowedWriteGlobs": [".chaos/changes/{changeId}/archive-report.md", ".chaos/archive-reports/**"],
        "notes": ["limited writes (archive/lifecycle closure only)."],
    },
    "sync": {
        "readOnly": False, "scope": "change",
        "expectedArtifacts": [".chaos/changes/{changeId}/sync-report.md"], "allowedWriteGlobs": [".chaos/changes/{changeId}/sync-report.md"],
        "notes": ["not read-only, but scope-sensitive; see --all handling."],
    },
    "retro": {
        "readOnly": False, "scope": "change",
        "expectedArtifacts": [".chaos/changes/{changeId}/retro.md"], "allowedWriteGlobs": [".chaos/changes/{changeId}/retro.md"],
        "notes": ["limited writes (retro report only)."],
    },
}

SLASH_ALIASES: Dict[str, str] = {
    "init": "init", "help": "help", "status": "status", "doctor": "doctor",
    "archaeology": "archaeology", "archeology": "archeology",
    "propose": "propose", "proposal": "propose",
    "review": "review", "apply": "apply", "code-review": "code-review",
    "verify": "verify", "archive": "archive", "sync": "sync", "retro": "retro",
}

_CHAOS_TOKEN_RE = re.compile(r"\bchaos:([a-zA-Z][a-zA-Z-]*)\b")
_SLASH_TOKEN_RE = re.compile(r"/chaos-([a-zA-Z][a-zA-Z-]*)\b")
_MODE_RE = re.compile(r"--(light|standard|strict)\b", re.IGNORECASE)
_CHANGE_FLAG_RE = re.compile(r"--change[= ]([A-Za-z0-9._-]+)")
_CHANGE_PATH_RE = re.compile(r"(?:\.chaos/changes|openspec/changes)/([A-Za-z0-9._-]+)")
_ALL_FLAG_RE = re.compile(r"--all\b")


def _extract_prompt_text(payload: Dict[str, Any]) -> str:
    for key in ("prompt", "user_prompt", "message", "text", "input"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value
    return ""


def _find_command_token(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Returns (canonical_command_word, matched_raw_form) or (None, None)."""
    m = _CHAOS_TOKEN_RE.search(text)
    if m:
        word = m.group(1).lower()
        if word in COMMAND_TABLE:
            return word, f"chaos:{word}"
    m = _SLASH_TOKEN_RE.search(text)
    if m:
        raw = m.group(1).lower()
        word = SLASH_ALIASES.get(raw)
        if word:
            return word, f"/chaos-{raw}"
    return None, None


def _extract_change_id(text: str, command_word: str, match_end: int) -> Tuple[str, str]:
    m = _CHANGE_FLAG_RE.search(text)
    if m:
        return m.group(1), "HIGH"
    m = _CHANGE_PATH_RE.search(text)
    if m:
        return m.group(1), "MEDIUM"
    if command_word == "sync":
        return "", "LOW"
    # First positional token immediately after the command match.
    tail = text[match_end:match_end + 200].lstrip()
    tok_match = re.match(r"([A-Za-z0-9][A-Za-z0-9._-]{2,})", tail)
    if tok_match and not tok_match.group(1).startswith("--"):
        return tok_match.group(1), "MEDIUM"
    return "", "LOW"


def _extract_mode(text: str) -> str:
    m = _MODE_RE.search(text)
    if m:
        return m.group(1).lower()
    return "unknown"


def build_active_command(repo_root: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    text = _extract_prompt_text(payload)
    command_word, raw_form = _find_command_token(text)

    if not command_word:
        return None

    entry = COMMAND_TABLE[command_word]
    mode = _extract_mode(text)
    match = _CHAOS_TOKEN_RE.search(text) or _SLASH_TOKEN_RE.search(text)
    match_end = match.end() if match else len(text)
    change_id, change_confidence = _extract_change_id(text, command_word, match_end)

    scope = entry["scope"]
    read_only = entry["readOnly"]
    repo_wide = False
    notes = list(entry["notes"])
    expected_templates = list(entry["expectedArtifacts"])
    write_globs = list(entry["allowedWriteGlobs"])

    if command_word == "sync" and _ALL_FLAG_RE.search(text):
        scope = "repository"
        repo_wide = True
        expected_templates = [".chaos/sync-reports/repo-sync-{date}.md"]
        write_globs = [".chaos/sync-reports/**"]
        notes = notes + ["chaos:sync --all detected: repository-wide scope, not change-scoped."]
        change_id, change_confidence = "", "LOW"

    today = datetime.now().strftime("%Y-%m-%d")
    expected_artifacts: List[str] = []
    for template in expected_templates:
        resolved = template.replace("{date}", today)
        if "{changeId}" in resolved:
            if not change_id:
                notes = notes + [f"expected artifact omitted (changeId unresolved): {template}"]
                continue
            resolved = resolved.replace("{changeId}", change_id)
        if "{topic}" in resolved:
            notes = notes + [f"expected artifact omitted (topic not resolvable from prompt text): {template}"]
            continue
        expected_artifacts.append(resolved)

    allowed_write_globs = [g.replace("{changeId}", change_id) if change_id else g for g in write_globs]

    command_confidence = "HIGH" if raw_form else "MEDIUM"
    overall_confidence = common.min_confidence(command_confidence, change_confidence) if change_id else command_confidence

    return {
        "schemaVersion": common.SCHEMA_VERSION,
        "detectedAt": common.now_iso(),
        "detectedBy": DETECTED_BY,
        "command": f"chaos:{command_word}",
        "rawPrompt": common.safe_string(text, max_len=500),
        "changeId": change_id,
        "mode": mode,
        "scope": scope,
        "readOnly": read_only,
        "repoWide": repo_wide,
        "expectedArtifacts": expected_artifacts,
        "allowedWriteGlobs": allowed_write_globs,
        "notes": notes,
        "confidence": overall_confidence,
    }


def build_unknown_command(reason: str) -> Dict[str, Any]:
    return {
        "schemaVersion": common.SCHEMA_VERSION,
        "detectedAt": common.now_iso(),
        "detectedBy": DETECTED_BY,
        "command": "",
        "rawPrompt": "",
        "changeId": "",
        "mode": "unknown",
        "scope": "unknown",
        "readOnly": True,
        "repoWide": False,
        "expectedArtifacts": [],
        "allowedWriteGlobs": [],
        "notes": [reason],
        "confidence": "LOW",
    }


def main() -> int:
    parser = common.common_arg_parser("CHAOS active-command detection hook (writes .chaos/runtime/active-command.json).")
    parser.add_argument("--event", choices=["session-start", "user-prompt-submit"], required=True)
    args = parser.parse_args()

    try:
        payload = common.load_json_stdin()
        repo_root = common.find_repo_root(args.repo_root, payload)
        runtime_path, created = common.ensure_runtime_dir(repo_root, dry_run=args.dry_run)
        if created:
            common.log_violation(repo_root, "INFO", HOOK_NAME, "CHAOS-HOOK-001", "runtime directory created", confidence="HIGH", dry_run=args.dry_run)

        target_path = os.path.join(runtime_path, common.ACTIVE_COMMAND_FILENAME)

        if args.event == "session-start":
            record = build_unknown_command("session-start: active command reset for new session")
            common.write_json_file_atomic(target_path, record, dry_run=args.dry_run)
            common.log_violation(repo_root, "INFO", HOOK_NAME, "CHAOS-HOOK-003", "active command not detected (session-start reset)", confidence="LOW", dry_run=args.dry_run)
            if args.print_output:
                print(json.dumps(record, indent=2))
            else:
                print(f"{HOOK_NAME} (session-start): active command reset")
            return 0

        # user-prompt-submit
        payload_text = _extract_prompt_text(payload)
        record = build_active_command(repo_root, payload)

        if record is None:
            # No confident command token found. Preserve whatever active-command.json
            # already holds (a plain follow-up turn shouldn't erase context from a
            # multi-turn CHAOS command), but flag it when the prompt looks like it was
            # trying to reference CHAOS and detection still failed.
            if "chaos" in payload_text.lower():
                common.log_violation(
                    repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-003",
                    "prompt mentions 'chaos' but no CHAOS command token could be parsed; active-command.json left unchanged",
                    confidence="LOW", dry_run=args.dry_run,
                )
            if args.print_output:
                print(json.dumps(common.load_active_command(repo_root), indent=2))
            else:
                print(f"{HOOK_NAME} (user-prompt-submit): no command detected; active-command.json unchanged")
            return 0

        common.write_json_file_atomic(target_path, record, dry_run=args.dry_run)
        if args.print_output:
            print(json.dumps(record, indent=2))
        else:
            print(f"{HOOK_NAME} (user-prompt-submit): command={record['command']} changeId={record['changeId'] or '(none)'} confidence={record['confidence']}")
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
