#!/usr/bin/env python3
"""CHAOS in-session auto-resume — Stop hook.

Keeps a chat-invoked CHAOS command running *in the same interactive session*
across material decisions. When the command stops on a decision, this hook
cheaply polls the interaction runtime (no model tokens) until the human answers
in the Decision Center, then returns `{"decision":"block","reason":...}` to make
the SAME session continue — no manual `chaos:resume`, all command output stays in
the chat.

It is a pure no-op (allow the stop) unless ALL of these hold:
  - policies.interactionRuntime.autoResume.enabled: true, AND
  - policies.interactionRuntime.autoResume.inSessionResume: true, in .chaos/config.yaml
  - CHAOS_COMMAND_RUN_ID is NOT set (that env means we are the headless runner's
    child, and the runner owns resume — the two mechanisms never fight).

Everything degrades safely: on any uncertainty, timeout, cancelled decision, or
error, the hook allows the stop. Worst case is "no auto-resume this time", never a
stuck or corrupted session. Python 3 standard library only.

See ../reference/in-session-auto-resume-contract.md and
../reference/hook-runtime-policy.md.
"""

from __future__ import annotations

import importlib.util
import json
import os
import sys
import time
from typing import Any, Dict, Optional, Tuple

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def _bootstrap_common():
    spec = importlib.util.spec_from_file_location(
        "chaos_hook_common", os.path.join(_SCRIPT_DIR, "chaos-hook-common.py")
    )
    if spec is None or spec.loader is None:
        raise ImportError("could not load chaos-hook-common.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


common = _bootstrap_common()

HOOK_NAME = "chaos-auto-resume"

INTERACTIONS_DIR_PARTS = (".chaos", "interactions")
CONFIG_REL_PARTS = (".chaos", "config.yaml")

# Interaction-runtime decision states.
WAITING_STATES = {"waiting"}
ANSWERED_STATES = {"answered"}
CLOSED_STATES = {"consumed", "cancelled", "expired", "superseded"}
# active.json session-level states that mean "a human decision is pending".
ACTIVE_WAITING_STATES = {"waiting-for-user-decision", "waiting", "blocked-multiple-decisions"}

DEFAULT_MAX_WAIT_SECONDS = 1800
DEFAULT_POLL_INTERVAL_SECONDS = 1.5
MAX_RATIONALE = 240


# --------------------------------------------------------------------------
# config gate (tiny targeted YAML scalar reader — no PyYAML dependency)
# --------------------------------------------------------------------------


def _strip_comment(line: str) -> str:
    idx = line.find("#")
    return line if idx == -1 else line[:idx]


def parse_autoresume_gate(yaml_text: str) -> Dict[str, Any]:
    """Read enabled / inSessionResume from the `autoResume:` block. Not a general
    YAML parser — reads only the scalars directly under the first autoResume map."""
    enabled = False
    in_session = False
    present = False
    block_indent = -1

    for raw in yaml_text.splitlines():
        stripped = _strip_comment(raw)
        if not stripped.strip():
            continue
        indent = len(stripped) - len(stripped.lstrip(" "))

        if block_indent == -1:
            if stripped.strip() == "autoResume:":
                block_indent = indent
                present = True
            continue

        if indent <= block_indent:
            break  # dedented out of the block

        key, _, value = stripped.strip().partition(":")
        token = value.strip().split()[0] if value.strip() else ""
        if key == "enabled":
            enabled = token == "true"
        elif key == "inSessionResume":
            in_session = token == "true"

    return {"enabled": enabled, "inSessionResume": in_session, "present": present}


def read_gate(repo_root: str) -> Dict[str, Any]:
    path = os.path.join(repo_root, *CONFIG_REL_PARTS)
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return parse_autoresume_gate(fh.read())
    except Exception:
        return {"enabled": False, "inSessionResume": False, "present": False}


def gate_allows_in_session_resume(repo_root: str) -> bool:
    if os.environ.get("CHAOS_COMMAND_RUN_ID"):
        return False  # runner-driven; the runner owns resume
    gate = read_gate(repo_root)
    return bool(gate.get("enabled")) and bool(gate.get("inSessionResume"))


# --------------------------------------------------------------------------
# interaction-runtime reads
# --------------------------------------------------------------------------


def interactions_dir(repo_root: str) -> str:
    return os.path.join(repo_root, *INTERACTIONS_DIR_PARTS)


def _decision_path(repo_root: str, decision_id: str) -> str:
    return os.path.join(interactions_dir(repo_root), "decisions", decision_id, "decision.json")


def _response_path(repo_root: str, decision_id: str) -> str:
    return os.path.join(interactions_dir(repo_root), "decisions", decision_id, "response.json")


def find_pending_decision(repo_root: str, active_command: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Return the pending decision this session is waiting on, or None.

    Uses the interaction runtime `active.json` pointer and confirms the decision
    is genuinely `waiting`. When the session's active command has a changeId, the
    decision's changeId must match it (guards against picking up an unrelated
    change's decision); with no changeId we accept the single active decision.
    """
    active = common.read_json_file(os.path.join(interactions_dir(repo_root), "active.json")) or {}
    state = str(active.get("state") or "")
    decision_id = str(active.get("activeDecisionId") or "")
    if not decision_id or state not in ACTIVE_WAITING_STATES:
        return None

    decision = common.read_json_file(_decision_path(repo_root, decision_id))
    if not decision or str(decision.get("state") or "") not in WAITING_STATES:
        return None

    session_change = str((active_command or {}).get("changeId") or "").strip()
    decision_change = str(decision.get("changeId") or "").strip()
    if session_change and decision_change and session_change != decision_change:
        return None  # a decision for a different change — not ours

    return {
        "decisionId": decision_id,
        "changeId": decision_change,
        "sourceCommand": str(decision.get("sourceCommand") or ""),
        "commandRunId": str(decision.get("commandRunId") or active.get("activeCommandRunId") or ""),
        "options": decision.get("options") if isinstance(decision.get("options"), list) else [],
    }


def read_decision_outcome(repo_root: str, decision_id: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Return (state, response_or_None) for the decision, re-read from disk."""
    decision = common.read_json_file(_decision_path(repo_root, decision_id)) or {}
    state = str(decision.get("state") or "")
    response = common.read_json_file(_response_path(repo_root, decision_id))
    return state, response


def classify_outcome(state: str, response: Optional[Dict[str, Any]]) -> str:
    """Pure: 'answered' → resume, 'closed' → allow stop, 'pending' → keep waiting."""
    if state in ANSWERED_STATES and response is not None:
        return "answered"
    if state in CLOSED_STATES:
        return "closed"
    return "pending"


def _option_label(options: Any, option_id: str) -> str:
    if isinstance(options, list):
        for opt in options:
            if isinstance(opt, dict) and str(opt.get("id")) == option_id:
                return str(opt.get("label") or "")
    return ""


def build_resume_reason(pending: Dict[str, Any], response: Dict[str, Any]) -> str:
    """The continuation instruction. The defensive-resume contract in the
    chaos-interaction-runtime skill makes the model resume from the runtime even
    if this text is not delivered to it, so this is guidance, not the sole path."""
    option_id = str((response or {}).get("selectedOptionId") or "")
    label = _option_label(pending.get("options"), option_id)
    rationale = str((response or {}).get("rationale") or "").strip()
    if len(rationale) > MAX_RATIONALE:
        rationale = rationale[:MAX_RATIONALE] + "…"

    lines = [
        "The pending CHAOS decision was answered in the Decision Center. Continue this "
        "command in-session — do NOT restart it and do NOT ask the user again.",
        "",
        f"- decisionId: {pending.get('decisionId')}",
        f"- selectedOptionId: {option_id}" + (f" ({label})" if label else ""),
    ]
    if rationale:
        lines.append(f"- rationale: {rationale}")
    lines += [
        f"- commandRunId: {pending.get('commandRunId')}",
        f"- changeId: {pending.get('changeId') or '(none)'}",
        f"- sourceCommand: {pending.get('sourceCommand')}",
        "",
        "The interaction runtime is the source of truth: read the answered decision + "
        "response, incorporate the selected option, mark the decision consumed, and continue "
        "the original command from its capsule nextStep.",
    ]
    return "\n".join(lines)


# --------------------------------------------------------------------------
# hook output
# --------------------------------------------------------------------------


def _emit_block(reason: str) -> None:
    """Stop-hook block: prevents stopping and continues this same session."""
    sys.stdout.write(json.dumps({"decision": "block", "reason": reason}))


# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------


def main() -> int:
    parser = common.common_arg_parser("CHAOS in-session auto-resume Stop hook.")
    parser.add_argument("--event", choices=["stop"], required=True)
    parser.add_argument("--max-wait-seconds", type=float, default=DEFAULT_MAX_WAIT_SECONDS)
    parser.add_argument("--poll-interval-seconds", type=float, default=DEFAULT_POLL_INTERVAL_SECONDS)
    args = parser.parse_args()

    try:
        payload = common.load_json_stdin()
        repo_root = common.find_repo_root(args.repo_root, payload)

        # Gate: pure no-op unless explicitly enabled and not runner-driven.
        if not gate_allows_in_session_resume(repo_root):
            return 0

        # Avoid re-blocking the same unanswered decision forever if a prior
        # continuation already occurred (best-effort; field may be absent).
        already_continuing = bool(payload.get("stop_hook_active"))

        active_command = common.load_active_command(repo_root)
        pending = find_pending_decision(repo_root, active_command)
        if not pending:
            return 0  # nothing pending → command finished; allow the stop

        decision_id = pending["decisionId"]
        deadline = time.monotonic() + max(0.0, float(args.max_wait_seconds))
        interval = max(0.1, float(args.poll_interval_seconds))

        while True:
            state, response = read_decision_outcome(repo_root, decision_id)
            outcome = classify_outcome(state, response)
            if outcome == "answered":
                _emit_block(build_resume_reason(pending, response or {}))
                return 0
            if outcome == "closed":
                return 0  # cancelled/expired/consumed elsewhere → allow the stop
            if time.monotonic() >= deadline:
                # Timed out waiting for the human. Allow the stop; if we were
                # already mid-continuation, definitely do not spin again.
                _ = already_continuing
                sys.stderr.write(
                    f"{HOOK_NAME}: still waiting on decision {decision_id}; answer it in the "
                    "Decision Center, then send any message or run chaos:resume.\n"
                )
                return 0
            time.sleep(interval)

    except SystemExit:
        raise
    except Exception as exc:  # never let an internal bug block the session
        sys.stderr.write(f"{HOOK_NAME}: internal error (non-blocking): {exc}\n")
        return 0


if __name__ == "__main__":
    _exit_code = main()
    common.exit_hard(_exit_code)
