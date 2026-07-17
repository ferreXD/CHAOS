#!/usr/bin/env python3
"""CHAOS vNext runtime hook — touched-file audit.

Appends one record per file touched by an Edit/MultiEdit/Write/Bash tool
call to `.chaos/runtime/touched-files.jsonl`. Python 3 standard library
only. Safe as a Claude Code PostToolUse hook, or run manually with
--dry-run to preview extraction without writing.

Never logs file content, tool output, or full shell command text —
only an extracted, best-effort file path. See
../reference/touched-files-audit.md.
"""

from __future__ import annotations

import importlib.util
import json
import os
import re
import sys
from typing import Any, Dict, Optional, Tuple

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def _bootstrap_common():
    spec = importlib.util.spec_from_file_location("chaos_hook_common", os.path.join(_SCRIPT_DIR, "chaos-hook-common.py"))
    if spec is None or spec.loader is None:
        raise ImportError("could not load chaos-hook-common.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


common = _bootstrap_common()

HOOK_NAME = "chaos-touched-files"

_FILE_TOOLS = ("Edit", "MultiEdit", "Write", "NotebookEdit")
_KNOWN_TOOL_VALUES = ("Edit", "MultiEdit", "Write", "Bash")

_RM_RE = re.compile(r"(?:^|[;&|]\s*)(?:rm|del|Remove-Item)\s+(?:-\S+\s+)*([^\s|&;><]+)", re.IGNORECASE)
_TOUCH_RE = re.compile(r"(?:^|[;&|]\s*)(?:touch|New-Item)\s+(?:-\S+\s+)*([^\s|&;><]+)", re.IGNORECASE)
_REDIRECT_RE = re.compile(r"(>>?)\s*([^\s|&;><]+)")
_MV_CP_RE = re.compile(r"(?:^|[;&|]\s*)(?:mv|cp|copy|move)\s+\S+\s+([^\s|&;><]+)", re.IGNORECASE)


def _extract_bash_path(command_text: str) -> Tuple[Optional[str], str]:
    if not command_text:
        return None, "unknown"
    m = _RM_RE.search(command_text)
    if m:
        return m.group(1), "delete"
    m = _TOUCH_RE.search(command_text)
    if m:
        return m.group(1), "create"
    m = _REDIRECT_RE.search(command_text)
    if m:
        return m.group(2), "create" if m.group(1) == ">" else "write"
    m = _MV_CP_RE.search(command_text)
    if m:
        return m.group(1), "write"
    return None, "unknown"


def extract_touch(payload: Dict[str, Any]) -> Tuple[Optional[str], str, str, str]:
    """Returns (raw_path, operation, source, tool_value_for_schema)."""
    tool_name = str(payload.get("tool_name") or "unknown")
    tool_input = payload.get("tool_input") if isinstance(payload.get("tool_input"), dict) else {}
    tool_value = tool_name if tool_name in _KNOWN_TOOL_VALUES else "unknown"

    if tool_name in _FILE_TOOLS:
        raw_path = tool_input.get("file_path") or tool_input.get("path")
        operation = "edit" if tool_name in ("Edit", "MultiEdit", "NotebookEdit") else "write"
        source = "hook-payload" if raw_path else "unknown"
        return (str(raw_path) if raw_path else None), operation, source, ("unknown" if tool_name == "NotebookEdit" else tool_name)

    if tool_name == "Bash":
        command_text = str(tool_input.get("command") or "")
        raw_path, operation = _extract_bash_path(command_text)
        source = "inferred" if raw_path else "unknown"
        return raw_path, operation, source, "Bash"

    return None, "unknown", "unknown", tool_value


def main() -> int:
    parser = common.common_arg_parser("CHAOS touched-file audit hook (appends to .chaos/runtime/touched-files.jsonl).")
    parser.add_argument("--event", choices=["post-tool-use"], required=True)
    args = parser.parse_args()

    try:
        payload = common.load_json_stdin()
        repo_root = common.find_repo_root(args.repo_root, payload)
        runtime_path, created = common.ensure_runtime_dir(repo_root, dry_run=args.dry_run)
        if created:
            common.log_violation(repo_root, "INFO", HOOK_NAME, "CHAOS-HOOK-001", "runtime directory created", confidence="HIGH", dry_run=args.dry_run)

        tool_name = str(payload.get("tool_name") or "unknown")
        raw_path, operation, source, tool_value = extract_touch(payload)

        if raw_path is None:
            if tool_name in _FILE_TOOLS:
                common.log_violation(
                    repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-007",
                    f"hook payload missing expected file_path field for tool={tool_name}",
                    confidence="LOW", dry_run=args.dry_run,
                )
            if args.print_output:
                print(json.dumps({"skipped": True, "tool": tool_name}, indent=2))
            else:
                print(f"{HOOK_NAME} (post-tool-use): no file path detected for tool={tool_name}; nothing appended")
            return 0

        active = common.load_active_command(repo_root)
        chaos_command = str(active.get("command") or "")
        change_id = str(active.get("changeId") or "")

        normalized = common.normalize_path(raw_path, repo_root)
        if normalized is None:
            common.log_violation(
                repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-004",
                f"touched file path could not be normalized relative to repo root: {common.safe_string(raw_path, 200)}",
                command=chaos_command, change_id=change_id, confidence="LOW", dry_run=args.dry_run,
            )
            record_path = common.safe_string(raw_path, 300)
            confidence = "LOW"
        else:
            record_path = normalized
            confidence = "HIGH" if source == "hook-payload" else ("MEDIUM" if source == "inferred" else "LOW")

        record = {
            "schemaVersion": common.SCHEMA_VERSION,
            "timestamp": common.now_iso(),
            "event": "post-tool-use",
            "tool": tool_value,
            "path": record_path,
            "operation": operation,
            "command": chaos_command,
            "changeId": change_id,
            "source": source,
            "confidence": confidence,
        }
        common.append_jsonl(os.path.join(runtime_path, common.TOUCHED_FILES_FILENAME), record, dry_run=args.dry_run)

        if args.print_output:
            print(json.dumps(record, indent=2))
        else:
            print(f"{HOOK_NAME} (post-tool-use): {tool_value} {operation} {record_path}")
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
