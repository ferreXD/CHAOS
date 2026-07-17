#!/usr/bin/env python3
"""Shared utilities for CHAOS vNext runtime-observability hooks.

Python 3 standard-library only. Imported by the other
`chaos-*.py` scripts in this directory via `importlib` (this module's
filename has a hyphen, so it cannot be imported with a plain `import`
statement) — see `_bootstrap_common()` in each of those scripts. Not
intended to be run directly.

Scope: this module only supports the vNext runtime-observability hooks
(session/command/touched-file/violation/decision-wait state under
`.chaos/runtime/`). It does not implement command-boundary enforcement,
protected-file guards, sync-authority guards, or provenance metadata
stamping — see `../reference/hook-runtime-policy.md`.
"""

from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import queue as queue_module
import re
import subprocess
import sys
import threading
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

SCHEMA_VERSION = 1
CONFIDENCE_VALUES = ("HIGH", "MEDIUM", "LOW")
_CONF_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}

RUNTIME_DIR_PARTS = (".chaos", "runtime")
SESSION_CONTEXT_FILENAME = "session-context.json"
ACTIVE_COMMAND_FILENAME = "active-command.json"
TOUCHED_FILES_FILENAME = "touched-files.jsonl"
HOOK_VIOLATIONS_FILENAME = "hook-violations.jsonl"
DECISION_WAITS_FILENAME = "decision-waits.jsonl"

# Deliberately conservative: reused (subset) of the pattern list already
# vetted for chaos-artifact-metadata-hook.py. Any value matching one of
# these is treated as secret-like and never written to a runtime file.
_SECRET_PATTERNS = [
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"gh[oprsu]_[A-Za-z0-9]{20,}"),
    re.compile(r"AKIA[0-9A-Z]{12,}"),
    re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),  # JWT-like
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"(?i)bearer\s+[a-z0-9\-_.]{16,}"),
    re.compile(r"(?i)(password|pwd|secret|token|pat|connectionstring)\s*[:=]\s*\S+"),
]

DECISION_WAIT_PATTERNS = [
    re.compile(r"decision required\s*:", re.IGNORECASE),
    re.compile(r"^options\s*:", re.IGNORECASE | re.MULTILINE),
    re.compile(r"select one option to continue", re.IGNORECASE),
    re.compile(r"reply with\s+1\b", re.IGNORECASE),
    re.compile(r"^\s*STOP\s*$", re.MULTILINE),
]

CHAOS_COMMANDS = (
    "chaos:init",
    "chaos:help",
    "chaos:status",
    "chaos:doctor",
    "chaos:archaeology",
    "chaos:archeology",
    "chaos:propose",
    "chaos:review",
    "chaos:apply",
    "chaos:code-review",
    "chaos:verify",
    "chaos:archive",
    "chaos:sync",
    "chaos:retro",
)


# --------------------------------------------------------------------------
# stdin / payload
# --------------------------------------------------------------------------


def load_json_stdin() -> Dict[str, Any]:
    """Read a JSON hook payload from stdin without ever blocking.

    Claude Code hooks pipe a JSON payload and close stdin. Manual/CLI runs
    typically have stdin attached to a terminal (or an inherited handle
    that never closes and never sends data). The actual read happens on a
    daemon thread with a bounded wait; if nothing arrives in time, an
    empty payload is returned instead of hanging.
    """
    try:
        if sys.stdin is None or sys.stdin.isatty():
            return {}
    except Exception:
        return {}

    result_queue: "queue_module.Queue[bytes]" = queue_module.Queue()

    def _reader() -> None:
        try:
            result_queue.put(sys.stdin.buffer.read())
        except Exception:
            result_queue.put(b"")

    reader_thread = threading.Thread(target=_reader, daemon=True)
    reader_thread.start()
    try:
        raw = result_queue.get(timeout=1.0)
    except queue_module.Empty:
        return {}

    if not raw or not raw.strip():
        return {}
    try:
        data = raw.decode("utf-8-sig")
        parsed = json.loads(data)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def exit_hard(code: int) -> None:
    """Flush and hard-exit, skipping interpreter shutdown finalization.

    A daemon reader thread from load_json_stdin() may still be blocked
    reading stdin if no hook payload ever arrived (e.g. a manual CLI run
    with stdin inherited-but-idle). Normal interpreter shutdown can crash
    trying to finalize stdin's buffer while that thread holds its lock.
    """
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(code)


# --------------------------------------------------------------------------
# repo root / git
# --------------------------------------------------------------------------


def run_git(repo_root: str, args: List[str]) -> Optional[str]:
    try:
        result = subprocess.run(
            ["git", "-C", repo_root] + args,
            capture_output=True,
            text=True,
            timeout=5,
            encoding="utf-8",
            errors="replace",
            stdin=subprocess.DEVNULL,
        )
    except Exception:
        return None
    if result.returncode != 0:
        return None
    out = result.stdout.strip()
    return out if out else None


def find_repo_root(repo_root_arg: Optional[str] = None, payload: Optional[Dict[str, Any]] = None) -> str:
    if repo_root_arg:
        return os.path.abspath(repo_root_arg)
    env_root = os.environ.get("CLAUDE_PROJECT_DIR")
    if env_root and os.path.isdir(env_root):
        return os.path.abspath(env_root)
    payload_cwd = (payload or {}).get("cwd")
    if payload_cwd and os.path.isdir(str(payload_cwd)):
        return os.path.abspath(str(payload_cwd))
    current = os.path.abspath(os.getcwd())
    for _ in range(10):
        if os.path.isdir(os.path.join(current, ".chaos")) or os.path.isdir(os.path.join(current, ".git")):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent
    return os.path.abspath(os.getcwd())


def detect_provider_from_remote(remote_url: Optional[str]) -> str:
    if not remote_url:
        return "unknown"
    low = remote_url.lower()
    if "dev.azure.com" in low or "visualstudio.com" in low:
        return "azure-devops"
    if "github.com" in low:
        return "github"
    return "local-git"


# --------------------------------------------------------------------------
# runtime dir / file plumbing
# --------------------------------------------------------------------------


def runtime_dir(repo_root: str) -> str:
    return os.path.join(repo_root, *RUNTIME_DIR_PARTS)


def ensure_runtime_dir(repo_root: str, dry_run: bool = False) -> Tuple[str, bool]:
    """Ensure `.chaos/runtime/` exists. Returns (path, created_this_call)."""
    path = runtime_dir(repo_root)
    if os.path.isdir(path):
        return path, False
    if dry_run:
        return path, False
    try:
        os.makedirs(path, exist_ok=True)
        return path, True
    except Exception:
        return path, False


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def read_json_file(path: str) -> Optional[Dict[str, Any]]:
    if not os.path.isfile(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def write_json_file_atomic(path: str, data: Dict[str, Any], dry_run: bool = False) -> bool:
    """Write JSON via temp-file + os.replace so readers never see a partial file."""
    if dry_run:
        return False
    directory = os.path.dirname(path)
    tmp_path = os.path.join(directory, f".{os.path.basename(path)}.{uuid.uuid4().hex}.tmp")
    try:
        os.makedirs(directory, exist_ok=True)
        with open(tmp_path, "w", encoding="utf-8", newline="") as fh:
            json.dump(data, fh, indent=2, sort_keys=False, ensure_ascii=False)
            fh.write("\n")
        os.replace(tmp_path, path)
        return True
    except Exception:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass
        return False


def append_jsonl(path: str, record: Dict[str, Any], dry_run: bool = False) -> bool:
    if dry_run:
        return False
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a", encoding="utf-8", newline="") as fh:
            fh.write(json.dumps(record, sort_keys=False, ensure_ascii=False) + "\n")
        return True
    except Exception:
        return False


def read_jsonl(path: str, max_lines: Optional[int] = None) -> Tuple[List[Dict[str, Any]], int]:
    """Tolerant JSONL reader. Returns (records, malformed_line_count)."""
    records: List[Dict[str, Any]] = []
    malformed = 0
    if not os.path.isfile(path):
        return records, malformed
    try:
        with open(path, "r", encoding="utf-8") as fh:
            lines = fh.readlines()
    except Exception:
        return records, malformed
    if max_lines is not None:
        lines = lines[-max_lines:]
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            if isinstance(obj, dict):
                records.append(obj)
            else:
                malformed += 1
        except Exception:
            malformed += 1
    return records, malformed


def normalize_path(raw_path: Optional[str], repo_root: str) -> Optional[str]:
    """Normalize a path relative to repo_root using forward slashes.

    Returns None if the path is empty, unresolvable, or escapes repo_root.
    """
    if not raw_path:
        return None
    try:
        candidate = raw_path if os.path.isabs(raw_path) else os.path.join(repo_root, raw_path)
        rel = os.path.relpath(candidate, repo_root)
    except Exception:
        return None
    rel = rel.replace(os.sep, "/")
    if rel == "." or rel.startswith(".."):
        return None
    return rel


def load_active_command(repo_root: str) -> Dict[str, Any]:
    data = read_json_file(os.path.join(runtime_dir(repo_root), ACTIVE_COMMAND_FILENAME))
    return data or {}


def load_session_context(repo_root: str) -> Dict[str, Any]:
    data = read_json_file(os.path.join(runtime_dir(repo_root), SESSION_CONTEXT_FILENAME))
    return data or {}


# --------------------------------------------------------------------------
# secrets / safe strings
# --------------------------------------------------------------------------


def detect_secret_like_value(value: Any) -> bool:
    if not value:
        return False
    s = str(value)
    return any(pat.search(s) for pat in _SECRET_PATTERNS)


def safe_string(value: Any, max_len: int = 500) -> str:
    """Stringify, redact if secret-like, and truncate. Never raises."""
    if value is None:
        return ""
    try:
        s = str(value)
    except Exception:
        return ""
    if detect_secret_like_value(s):
        return "[redacted]"
    if len(s) > max_len:
        s = s[:max_len] + "...(truncated)"
    return s


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# --------------------------------------------------------------------------
# violations
# --------------------------------------------------------------------------


def log_violation(
    repo_root: str,
    severity: str,
    hook: str,
    code: str,
    message: str,
    command: str = "",
    change_id: str = "",
    path: str = "",
    confidence: str = "LOW",
    dry_run: bool = False,
) -> Dict[str, Any]:
    record = {
        "schemaVersion": SCHEMA_VERSION,
        "timestamp": now_iso(),
        "severity": severity,
        "hook": hook,
        "command": command or "",
        "changeId": change_id or "",
        "code": code,
        "message": safe_string(message, max_len=500),
        "path": path or "",
        "confidence": confidence if confidence in CONFIDENCE_VALUES else "LOW",
    }
    append_jsonl(os.path.join(runtime_dir(repo_root), HOOK_VIOLATIONS_FILENAME), record, dry_run=dry_run)
    return record


# --------------------------------------------------------------------------
# decision waits
# --------------------------------------------------------------------------


def detect_decision_wait_text(text: str) -> bool:
    if not text:
        return False
    return any(pat.search(text) for pat in DECISION_WAIT_PATTERNS)


def record_decision_wait(
    repo_root: str,
    command: str = "",
    change_id: str = "",
    decision_title: str = "",
    options_count: int = 0,
    recommended_option: str = "",
    source: str = "unknown",
    status: str = "waiting",
    confidence: str = "LOW",
    dry_run: bool = False,
) -> Dict[str, Any]:
    """Append a decision-wait record. Callable from other hook scripts, or
    (documented in reference/decision-wait-contract.md) from command prompts
    that want to log an explicit-marker decision wait."""
    record = {
        "schemaVersion": SCHEMA_VERSION,
        "timestamp": now_iso(),
        "command": command or "",
        "changeId": change_id or "",
        "decisionTitle": safe_string(decision_title, max_len=200),
        "optionsCount": options_count,
        "recommendedOption": str(recommended_option or ""),
        "source": source,
        "status": status,
        "confidence": confidence if confidence in CONFIDENCE_VALUES else "LOW",
    }
    append_jsonl(os.path.join(runtime_dir(repo_root), DECISION_WAITS_FILENAME), record, dry_run=dry_run)
    return record


# --------------------------------------------------------------------------
# misc
# --------------------------------------------------------------------------


def min_confidence(*values: str) -> str:
    valid = [v for v in values if v in _CONF_ORDER]
    if not valid:
        return "LOW"
    return min(valid, key=lambda v: _CONF_ORDER[v])


def confidence_rank(value: Optional[str]) -> int:
    """Order a confidence label for comparison (`HIGH` > `MEDIUM` > `LOW`).

    Unknown/missing values rank below `LOW` so they never win a
    richer-wins comparison against any recognized confidence label.
    """
    return _CONF_ORDER.get(value, -1)


def is_richer_confidence(candidate: Optional[str], baseline: Optional[str]) -> bool:
    """True if `candidate` outranks `baseline` (strictly higher confidence)."""
    return confidence_rank(candidate) > confidence_rank(baseline)


def common_arg_parser(description: str) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--repo-root", default=None, help="Repository root (defaults to CLAUDE_PROJECT_DIR, payload cwd, or discovered .chaos/.git).")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero on critical runtime errors (still report-only for ordinary warnings).")
    parser.add_argument("--dry-run", action="store_true", help="Compute but do not write/append any runtime file.")
    parser.add_argument("--print", dest="print_output", action="store_true", help="Print the resulting JSON/summary to stdout.")
    return parser
