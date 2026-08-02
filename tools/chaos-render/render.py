#!/usr/bin/env python3
"""chaos:render - deterministic Stage-B renderer (read-only --check stage).

Projects `change.md` and `lifecycle.md` for one change from the sources of truth:

  - .chaos/changes/<id>/records/*.json      (contract + per-pass phase facts)
  - .chaos/changes/<id>/decision-events.md  (agent-written append-only ledger)
  - .chaos/interactions/sessions/*.json     (runtime sessions: which phases RAN)
  - the artifact-metadata hook              (serialization, provenance, repo context)

Stage-B contract (docs/design/2026-08-01-stage-b-renderer-handoff.md §3): every
value in the rendered artifacts is derived at render time; nothing is copied from
prose. Per-phase run/mode/verdict come ONLY from phase-facts records - never from
"whichever session exists". Schemas: tools/chaos-render/schema/*.schema.json.

Usage:
  python tools/chaos-render/render.py <changeId> [--root DIR] [--check] [--only change|lifecycle]

  default   render both artifacts to stdout
  --check   diff rendered output against the files on disk; exit 0 clean,
            1 differences, 2 validation/render errors
"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import importlib.util
import json
import os
import re
import sys
from typing import Any, Dict, List, Optional, Tuple

OVERFLOW_LINES = 80  # template rule: a section beyond ~80 lines moves to appendix/

SCHEMA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema")

PHASES = ["frame", "review", "deliver", "verify", "sync", "archive"]
OPTIONAL_PHASES = ["codeReview", "retro"]
COMMAND_PHASE = {
    "chaos:propose": "frame",
    "chaos:review": "review",
    "chaos:apply": "deliver",
    "chaos:verify": "verify",
    "chaos:sync": "sync",
    "chaos:archive": "archive",
    "chaos:code-review": "codeReview",
    "chaos:retro": "retro",
}
# Which lifecycle stage a ledger prefix belongs to (for "ledger as of phase P" views).
PREFIX_STAGE = {
    "ESC": 0, "PROP": 0, "REV": 1, "APPLY": 2, "APP": 2,
    "VFY": 3, "VER": 3, "CR": 3, "SYNC": 4, "ARC": 5, "RETRO": 6,
}
PHASE_STAGE = {"frame": 0, "review": 1, "deliver": 2, "verify": 3, "sync": 4, "archive": 5, "codeReview": 3, "retro": 6}

ENTRY_HEADING_RE = re.compile(
    r"^## ((?:PROP|REV|APPLY|APP|VFY|VER|CR|SYNC|ARC|RETRO)-DEC-\d{3}|ESC-\d{3}) — (.+)$"
)
FIELD_RE = re.compile(r"^- ([A-Za-z][A-Za-z0-9 -]*): (.*)$")
REF_TOKEN_RE = re.compile(
    r"\b((?:PROP|REV|APPLY|APP|VFY|VER|CR|SYNC|ARC|RETRO)-DEC-\d{3}|ESC-\d{3})\b"
)


# --------------------------------------------------------------------------
# Metadata-hook reuse (serialization / provenance / repository context)
# --------------------------------------------------------------------------


def load_metadata_hook(repo_root: str):
    """Dynamically load the artifact-metadata hook module (house pattern)."""
    hook_path = os.path.join(repo_root, ".claude", "hooks", "scripts", "chaos-artifact-metadata-hook.py")
    if not os.path.isfile(hook_path):
        return None
    spec = importlib.util.spec_from_file_location("chaos_artifact_metadata_hook", hook_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules["chaos_artifact_metadata_hook"] = module
    spec.loader.exec_module(module)
    return module


# --------------------------------------------------------------------------
# Minimal JSON-Schema validator (exactly the keyword subset our schemas use)
# --------------------------------------------------------------------------


def _resolve_ref(ref: str, root: Dict[str, Any]) -> Dict[str, Any]:
    if not ref.startswith("#/"):
        raise ValueError(f"unsupported $ref: {ref}")
    node: Any = root
    for part in ref[2:].split("/"):
        node = node[part]
    return node


def _type_ok(value: Any, expected: str) -> bool:
    if expected == "object":
        return isinstance(value, dict)
    if expected == "array":
        return isinstance(value, list)
    if expected == "string":
        return isinstance(value, str)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected == "boolean":
        return isinstance(value, bool)
    if expected == "null":
        return value is None
    return False


def validate_schema(value: Any, schema: Dict[str, Any], root: Optional[Dict[str, Any]] = None, path: str = "$") -> List[str]:
    """Validate against the subset of JSON Schema 2020-12 used by our schema files."""
    errors: List[str] = []
    if root is None:
        root = schema
    if "$ref" in schema:
        errors.extend(validate_schema(value, _resolve_ref(schema["$ref"], root), root, path))
        return errors

    stype = schema.get("type")
    if stype is not None:
        types = stype if isinstance(stype, list) else [stype]
        if not any(_type_ok(value, t) for t in types):
            errors.append(f"{path}: expected type {types}, got {type(value).__name__}")
            return errors

    if "const" in schema and value != schema["const"]:
        errors.append(f"{path}: expected const {schema['const']!r}, got {value!r}")
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: {value!r} not in enum {schema['enum']}")

    if isinstance(value, str):
        if "pattern" in schema and not re.search(schema["pattern"], value):
            errors.append(f"{path}: {value!r} does not match pattern {schema['pattern']}")
        if "minLength" in schema and len(value) < schema["minLength"]:
            errors.append(f"{path}: shorter than minLength {schema['minLength']}")
        if "maxLength" in schema and len(value) > schema["maxLength"]:
            errors.append(f"{path}: longer than maxLength {schema['maxLength']}")
    if isinstance(value, int) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{path}: {value} below minimum {schema['minimum']}")
    if isinstance(value, list):
        if "minItems" in schema and len(value) < schema["minItems"]:
            errors.append(f"{path}: fewer than minItems {schema['minItems']}")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            errors.append(f"{path}: more than maxItems {schema['maxItems']}")
        item_schema = schema.get("items")
        if item_schema:
            for i, item in enumerate(value):
                errors.extend(validate_schema(item, item_schema, root, f"{path}[{i}]"))
    if isinstance(value, dict):
        for req in schema.get("required", []):
            if req not in value:
                errors.append(f"{path}: missing required key '{req}'")
        props = schema.get("properties", {})
        for key, sub in props.items():
            if key in value:
                errors.extend(validate_schema(value[key], sub, root, f"{path}.{key}"))
        addl = schema.get("additionalProperties", True)
        if addl is False:
            for key in value:
                if key not in props:
                    errors.append(f"{path}: unexpected key '{key}'")
        elif isinstance(addl, dict):
            for key in value:
                if key not in props:
                    errors.extend(validate_schema(value[key], addl, root, f"{path}.{key}"))

    for sub in schema.get("allOf", []):
        if "if" in sub:
            if not validate_schema(value, sub["if"], root, path):
                if "then" in sub:
                    errors.extend(validate_schema(value, sub["then"], root, path))
        else:
            errors.extend(validate_schema(value, sub, root, path))
    if "oneOf" in schema:
        matches = sum(1 for sub in schema["oneOf"] if not validate_schema(value, sub, root, path))
        if matches != 1:
            errors.append(f"{path}: matched {matches} of oneOf branches (need exactly 1)")
    if "if" in schema and "allOf" not in schema:
        if not validate_schema(value, schema["if"], root, path) and "then" in schema:
            errors.extend(validate_schema(value, schema["then"], root, path))
    return errors


def load_schema(name: str) -> Dict[str, Any]:
    with open(os.path.join(SCHEMA_DIR, name), "r", encoding="utf-8") as fh:
        return json.load(fh)


# --------------------------------------------------------------------------
# Ledger parser (decision-events.md -> canonical parsed entries)
# --------------------------------------------------------------------------

# Ledger keys whose value line combines several `key: value` pairs with ' · '.
COMPOSITE_SUBKEY_RE = re.compile(r"^([a-z][a-z -]*): (.*)$")


def _split_composite(rest: str) -> List[Tuple[Optional[str], str]]:
    """Split 'A · b: C · d: E' into [(None,'A'), ('b','C'), ('d','E')]."""
    parts = rest.split(" · ")
    out: List[Tuple[Optional[str], str]] = [(None, parts[0])]
    for seg in parts[1:]:
        m = COMPOSITE_SUBKEY_RE.match(seg)
        if m:
            out.append((m.group(1), m.group(2)))
        else:
            # Not a key:value segment - it belongs to the previous value.
            k, v = out[-1]
            out[-1] = (k, v + " · " + seg)
    return out


def _parse_status(raw: str) -> Dict[str, Any]:
    """Parse '<STATE> [(who[, date])] [· CONSUMED] [· run: <id>]'."""
    status: Dict[str, Any] = {"raw": raw, "state": "OPEN", "consumed": False, "by": None, "date": None, "run": None}
    segments = [s.strip() for s in raw.split(" · ")]
    head, rest = segments[0], segments[1:]
    m = re.match(r"^(OPEN|ANSWERED|RESOLVED-IN-ARM|RECORDED)(?:\s*\(([^)]*)\))?$", head)
    if m:
        status["state"] = m.group(1)
        paren = m.group(2)
        if paren:
            bits = [b.strip() for b in paren.split(",")]
            if m.group(1) == "RECORDED" or len(bits) == 1:
                status["date"] = bits[-1]
            else:
                status["by"], status["date"] = bits[0], bits[1]
    for seg in rest:
        if seg == "CONSUMED":
            status["consumed"] = True
        elif seg.startswith("run: "):
            status["run"] = seg[len("run: "):].strip()
    return status


def _parse_options(raw: str) -> List[Dict[str, Any]]:
    options: List[Dict[str, Any]] = []
    for seg in raw.split(" · "):
        seg = seg.strip()
        if not seg:
            continue
        m = re.match(r"^([A-Z]) (.+)$", seg)
        key = None
        body = seg
        if m and len(m.group(1)) == 1:
            key, body = m.group(1), m.group(2)
        label, summary = body, None
        if " — " in body:
            label, summary = body.split(" — ", 1)
        options.append({"key": key, "label": label.strip(), "summary": summary.strip() if summary else None})
    return options


def _parse_recommendation(raw: str) -> Dict[str, Any]:
    rec: Dict[str, Any] = {"key": None, "label": None, "rationale": None}
    body = raw.strip()
    if " — " in body:
        head, rec["rationale"] = body.split(" — ", 1)
    else:
        head = body
    head = head.strip()
    if head.lower() == "none":
        return rec
    m = re.match(r"^([A-Z])(?: (.+))?$", head)
    if m:
        rec["key"] = m.group(1)
        rec["label"] = m.group(2)
    else:
        rec["label"] = head
    return rec


def _parse_answer(raw: str) -> Dict[str, Any]:
    ans: Dict[str, Any] = {"key": None, "label": None, "rationale": None, "note": None}
    body = raw.strip()
    m = re.search(r"—\s*rationale:\s*[\"“](.+?)[\"”]", body)
    if m:
        ans["rationale"] = m.group(1)
        note = body[m.end():].strip()
        if note.startswith("."):
            note = note[1:].strip()
        ans["note"] = note or None
        body = body[: m.start()].strip()
    body = body.strip().strip("*").strip()
    m = re.match(r"^([A-Z]) (.+)$", body)
    if m:
        ans["key"], ans["label"] = m.group(1), m.group(2).strip()
    elif body:
        ans["label"] = body
    return ans


def _parse_sync_action(raw: str) -> Dict[str, Any]:
    note = None
    body = raw.strip()
    if " — " in body:
        body, note = body.split(" — ", 1)
    tokens = [t.strip() for t in body.split("+")]
    known = {"NONE", "CREATE_ADR", "UPDATE_CHAOS_RULES", "AMEND_OPENSPEC_SPEC", "RECORD_ACCEPTED_RISK"}
    parsed = [t for t in tokens if t in known]
    if len(parsed) != len(tokens):
        # Unknown token: keep the whole line as a note so nothing is lost.
        return {"tokens": parsed or [], "note": raw.strip()}
    return {"tokens": parsed, "note": note.strip() if note else None}


KNOWLEDGE_VALUES = {"FACT", "INFERENCE", "ASSUMPTION", "UNKNOWN"}
ENTRY_TYPE_VALUES = {"EVIDENCE_WAIVER", "DESIGN_DECISION", "DEFERRED_DECISION"}


def parse_ledger(text: str) -> Dict[str, Any]:
    """Parse decision-events.md per the canonical §2 scan rule."""
    lines = text.splitlines()
    entries: List[Dict[str, Any]] = []
    order: List[str] = []
    current: Optional[Dict[str, Any]] = None
    raw_fields: Dict[str, str] = {}

    def flush() -> None:
        nonlocal current, raw_fields
        if current is not None:
            current["_fields"] = raw_fields
            entries.append(current)
        current, raw_fields = None, {}

    for line in lines:
        if line.startswith("## "):
            flush()
            m = ENTRY_HEADING_RE.match(line)
            if m:
                current = {"id": m.group(1), "title": m.group(2).strip()}
                order.append(m.group(1))
            continue
        if current is None:
            continue
        fm = FIELD_RE.match(line)
        if fm:
            key = fm.group(1).strip().lower()
            if key in raw_fields:
                raw_fields[key + " (dup)"] = fm.group(2)
            else:
                raw_fields[key] = fm.group(2)
    flush()

    decisions: List[Dict[str, Any]] = []
    escalations: List[Dict[str, Any]] = []
    for entry in entries:
        fields = entry.pop("_fields")
        if entry["id"].startswith("ESC-"):
            escalations.append(_normalize_escalation(entry, fields))
        else:
            decisions.append(_normalize_decision(entry, fields))
    return {"decisions": decisions, "escalations": escalations, "order": order}


def _take_composites(fields: Dict[str, str], entry_extra: Dict[str, str]) -> Dict[str, str]:
    """Explode composite ' · key: value' lines into a flat map (first value keyed by line key)."""
    flat: Dict[str, str] = {}
    for key, raw in fields.items():
        parts = _split_composite(raw)
        flat[key] = parts[0][1]
        for sub_key, sub_val in parts[1:]:
            if sub_key is None:
                flat[key] = flat[key] + " · " + sub_val
            elif sub_key not in flat:
                flat[sub_key] = sub_val
            else:
                entry_extra[f"{key} · {sub_key}"] = sub_val
    return flat


def _normalize_escalation(entry: Dict[str, Any], fields: Dict[str, str]) -> Dict[str, Any]:
    extras: Dict[str, str] = {}
    flat = _take_composites(fields, extras)
    status = _parse_status(flat.get("status", ""))
    out = {
        "id": entry["id"],
        "title": entry["title"],
        "status": {"state": "RECORDED", "date": status.get("date") or ""},
        "from": flat.get("from", ""),
        "to": flat.get("to", ""),
        "trigger": flat.get("trigger", ""),
        "keptWork": flat.get("kept-work", ""),
        "evidence": flat.get("evidence"),
        "knowledge": flat.get("knowledge"),
        "confidence": flat.get("confidence"),
        "extras": extras,
    }
    for k, v in flat.items():
        if k not in ("status", "from", "to", "trigger", "kept-work", "evidence", "knowledge", "confidence"):
            out["extras"][k] = v
    return out


def _normalize_decision(entry: Dict[str, Any], fields: Dict[str, str]) -> Dict[str, Any]:
    extras: Dict[str, str] = {}
    flat = _take_composites(fields, extras)
    status = _parse_status(fields.get("status", flat.get("status", "")))
    kind = "recorded" if status["state"] == "RECORDED" else "surfaced"

    knowledge = flat.get("knowledge")
    entry_type = flat.get("type")
    if entry_type in KNOWLEDGE_VALUES:
        # Review-finding entries write '- severity: X · type: FACT · ...' where
        # 'type' is the knowledge classification, not the entry type.
        if knowledge is None:
            knowledge = entry_type
        entry_type = None
    if entry_type is not None and entry_type not in ENTRY_TYPE_VALUES:
        extras["type"] = entry_type
        entry_type = None

    escalates = None
    if "escalates" in flat:
        m = re.match(r"^(light|standard|strict)\s*(?:→|->)\s*(light|standard|strict)$", flat["escalates"].strip())
        if m:
            escalates = {"from": m.group(1), "to": m.group(2)}

    conditions: List[str] = []
    if "conditions" in flat:
        conditions = [c.strip() for c in re.split(r"\s*;\s*|\s*\(\d+\)\s*", flat["conditions"]) if c.strip()]

    out: Dict[str, Any] = {
        "id": entry["id"],
        "title": entry["title"],
        "kind": kind,
        "status": status,
        "runtimeDecision": flat.get("runtime-decision"),
        "options": _parse_options(flat["options"]) if "options" in flat else [],
        "recommendation": _parse_recommendation(flat["recommendation"]) if "recommendation" in flat else None,
        "answer": _parse_answer(flat["answer"]) if "answer" in flat else None,
        "whyMaterial": flat.get("why-material"),
        "impact": flat.get("impact"),
        "syncAction": _parse_sync_action(flat["sync-action"]) if "sync-action" in flat else None,
        "knowledge": knowledge or "UNKNOWN",
        "confidence": flat.get("confidence") or "LOW",
        "approvesChange": flat.get("approves-change", "").strip().lower() == "true",
        "conditions": conditions,
        "type": entry_type,
        "severity": flat.get("severity") if flat.get("severity") in ("BLOCKING", "MAJOR", "MINOR", "ADVISORY") else None,
        "fixability": flat.get("fixability"),
        "evidence": flat.get("evidence"),
        "interactionType": flat.get("interaction-type"),
        "escalates": escalates,
        "decision": flat.get("decision"),
        "rationale": flat.get("rationale"),
        "detail": flat.get("detail"),
        "followUpOwner": flat.get("follow-up owner"),
        "extras": extras,
    }
    consumed_keys = {
        "status", "runtime-decision", "options", "recommendation", "answer", "why-material",
        "impact", "sync-action", "knowledge", "confidence", "approves-change", "conditions",
        "type", "severity", "fixability", "evidence", "interaction-type", "escalates",
        "decision", "rationale", "detail", "follow-up owner", "run",
    }
    for k, v in flat.items():
        if k not in consumed_keys:
            out["extras"][k] = v
    return out


# --------------------------------------------------------------------------
# Sources: records, sessions
# --------------------------------------------------------------------------


RECORD_FILE_RE = re.compile(r"^(frame|review|deliver|verify|sync|archive)\.pass-(\d{2})\.facts\.json$")


def load_records(change_dir: str, errors: List[str]) -> Dict[str, Any]:
    records: Dict[str, Any] = {"contract": None, "phases": {p: [] for p in PHASES}}
    records_dir = os.path.join(change_dir, "records")
    if not os.path.isdir(records_dir):
        return records
    contract_schema = load_schema("contract.schema.json")
    facts_schema = load_schema("phase-facts.schema.json")
    for name in sorted(os.listdir(records_dir)):
        path = os.path.join(records_dir, name)
        if not name.endswith(".json"):
            continue
        try:
            with open(path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
        except Exception as exc:  # noqa: BLE001 - report, don't crash the render
            errors.append(f"records/{name}: unreadable JSON ({exc})")
            continue
        if name == "contract.json":
            issues = validate_schema(data, contract_schema)
            if issues:
                errors.extend(f"records/{name}: {i}" for i in issues)
            records["contract"] = data
            continue
        m = RECORD_FILE_RE.match(name)
        if not m:
            errors.append(f"records/{name}: unrecognized record file name")
            continue
        issues = validate_schema(data, facts_schema)
        if issues:
            errors.extend(f"records/{name}: {i}" for i in issues)
        if data.get("phase") != m.group(1) or data.get("pass") != int(m.group(2)):
            errors.append(f"records/{name}: filename disagrees with phase/pass in the record")
        records["phases"].setdefault(data.get("phase", m.group(1)), []).append(data)
    for phase in records["phases"]:
        records["phases"][phase].sort(key=lambda r: r.get("pass", 0))
    return records


def load_sessions(root: str, change_id: str) -> List[Dict[str, Any]]:
    sessions_dir = os.path.join(root, ".chaos", "interactions", "sessions")
    out: List[Dict[str, Any]] = []
    if not os.path.isdir(sessions_dir):
        return out
    for name in sorted(os.listdir(sessions_dir)):
        if not name.endswith(".json"):
            continue
        try:
            with open(os.path.join(sessions_dir, name), "r", encoding="utf-8") as fh:
                data = json.load(fh)
        except Exception:  # noqa: BLE001 - a broken session file must not kill the render
            continue
        if data.get("changeId") == change_id:
            out.append(data)
    return out


# --------------------------------------------------------------------------
# Model assembly + derivations
# --------------------------------------------------------------------------


def latest(records: Dict[str, Any], phase: str) -> Optional[Dict[str, Any]]:
    passes = records["phases"].get(phase) or []
    return passes[-1] if passes else None


def escalation_chain(ledger: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Ordered mode-change chain: ESC events + decision entries carrying `escalates`."""
    chain: List[Dict[str, Any]] = []
    by_id: Dict[str, Dict[str, Any]] = {}
    for esc in ledger["escalations"]:
        by_id[esc["id"]] = {
            "from": esc["from"], "to": esc["to"], "ref": esc["id"],
            "desc": esc["title"], "date": esc["status"]["date"], "kind": "auto",
        }
    for dec in ledger["decisions"]:
        if dec.get("escalates"):
            by_id[dec["id"]] = {
                "from": dec["escalates"]["from"], "to": dec["escalates"]["to"], "ref": dec["id"],
                "desc": "human decision", "date": dec["status"].get("date") or "", "kind": "human",
            }
    for entry_id in ledger["order"]:
        if entry_id in by_id:
            chain.append(by_id[entry_id])
    return chain


def ledger_as_of(ledger: Dict[str, Any], phase: str) -> List[str]:
    """Entry ids visible at the end of `phase` (prefix-stage <= phase-stage)."""
    limit = PHASE_STAGE[phase]
    out = []
    for entry_id in ledger["order"]:
        prefix = entry_id.split("-")[0]
        if PREFIX_STAGE.get(prefix, 0) <= limit:
            out.append(entry_id)
    return out


def build_model(root: str, change_id: str) -> Tuple[Dict[str, Any], List[str], List[str]]:
    errors: List[str] = []
    warnings: List[str] = []
    change_dir = os.path.join(root, ".chaos", "changes", change_id)
    if not os.path.isdir(change_dir):
        errors.append(f"no change folder at .chaos/changes/{change_id}")
        return {}, errors, warnings
    # Legacy guard: a pre-Stage-B change has hand-written artifacts and no records/. Rendering it
    # would project an empty skeleton over real content — refuse rather than destroy it.
    if not os.path.isdir(os.path.join(change_dir, "records")):
        legacy = [n for n in ("change.md", "lifecycle.md") if os.path.isfile(os.path.join(change_dir, n))]
        if legacy:
            errors.append(
                f"{change_id} has no records/ but has hand-written {', '.join(legacy)} — "
                "this is a legacy (pre-Stage-B) change. Readers fall back to it by design; the "
                "renderer will not overwrite it. Emit records first if you want it rendered."
            )
            return {}, errors, warnings

    ledger_path = os.path.join(change_dir, "decision-events.md")
    ledger = {"decisions": [], "escalations": [], "order": []}
    if os.path.isfile(ledger_path):
        with open(ledger_path, "r", encoding="utf-8") as fh:
            ledger = parse_ledger(fh.read())
    records = load_records(change_dir, errors)
    sessions = load_sessions(root, change_id)

    chain = escalation_chain(ledger)
    frame_rec = latest(records, "frame")
    framing_mode = frame_rec["mode"] if frame_rec else None
    final_mode = chain[-1]["to"] if chain else framing_mode
    escalated_from = chain[-1]["from"] if chain else None

    # Phase table: run/mode/verdict/at come ONLY from facts records; session
    # existence marks a phase as attempted so a step that ran can never vanish.
    session_phases: Dict[str, List[Dict[str, Any]]] = {}
    for s in sessions:
        phase = COMMAND_PHASE.get(s.get("sourceCommand", ""))
        if phase:
            session_phases.setdefault(phase, []).append(s)
    phases: Dict[str, Dict[str, Any]] = {}
    for phase in PHASES + OPTIONAL_PHASES:
        rec = latest(records, phase) if phase in records["phases"] else None
        if rec:
            phases[phase] = {
                "status": "complete", "at": rec["at"], "run": rec["run"],
                "mode": rec["mode"], "verdict": rec["verdict"],
            }
        elif session_phases.get(phase):
            phases[phase] = {"status": "attempted", "at": None, "run": None, "mode": None, "verdict": None}
        elif phase in PHASES:
            phases[phase] = {"status": "pending", "at": None, "run": None, "mode": None, "verdict": None}
        # optional phases with no record and no session simply don't render

    approval = next((d for d in ledger["decisions"] if d["approvesChange"]), None)
    deliver_rec = latest(records, "deliver")
    verify_rec = latest(records, "verify")
    sync_rec = latest(records, "sync")
    archive_rec = latest(records, "archive")

    if archive_rec:
        status = "Archived"
    elif deliver_rec:
        status = "Delivered"
    elif approval and approval["status"]["state"] == "ANSWERED":
        status = "Approved"
    elif frame_rec:
        status = "Framed"
    else:
        status = "Framed"

    contract = records["contract"]
    statement_ids = [s["id"] for s in contract["statements"]] if contract else []

    coverage: Dict[str, Dict[str, Any]] = {}
    if deliver_rec:
        for row in deliver_rec["facts"].get("coverage", []):
            coverage[row["statement"]] = row
        cov_ids = sorted(coverage.keys())
        if contract and cov_ids != sorted(statement_ids):
            errors.append(
                "deliver coverage does not match the contract statement set "
                f"(coverage {len(cov_ids)} vs contract {len(statement_ids)})"
            )
        for dev in deliver_rec["facts"].get("deviations", []):
            if dev["decision"] not in ledger["order"]:
                errors.append(f"deliver deviation cites unknown decision {dev['decision']}")

    # current rollup - every value derived, never copied
    current: Dict[str, Any] = {
        "tests": None, "contract": None, "decisions": None,
        "traceability": None, "syncState": None, "archiveReadiness": None,
    }
    tests_src = verify_rec or deliver_rec
    if tests_src:
        t = tests_src["facts"]["checks"]["tests"] if verify_rec else tests_src["facts"]["tests"]
        current["tests"] = f"{t['passed']}/{t['total']}"
    if contract and deliver_rec:
        ticked = sum(1 for r in coverage.values() if r["covered"])
        current["contract"] = f"{ticked}/{len(statement_ids)}"
    if ledger["order"]:
        current["decisions"] = len(ledger["order"])
    if verify_rec and verify_rec["facts"].get("traceability"):
        rows = verify_rec["facts"]["traceability"]
        sat = sum(1 for r in rows if r["status"] == "SATISFIED")
        par = sum(1 for r in rows if r["status"] == "PARTIAL")
        mis = sum(1 for r in rows if r["status"] == "MISSING")
        current["traceability"] = f"{sat}/{par}/{mis}"
    if sync_rec:
        current["syncState"] = sync_rec["verdict"]
    if archive_rec:
        current["archiveReadiness"] = archive_rec["verdict"]
    elif verify_rec:
        current["archiveReadiness"] = verify_rec["facts"]["archiveReadiness"]

    if archive_rec:
        matrix_ids = sorted(r["decision"] for r in archive_rec["facts"]["closureMatrix"])
        if matrix_ids != sorted(ledger["order"]):
            errors.append(
                "archive closure matrix does not enumerate the ledger exactly "
                f"(matrix {len(matrix_ids)} vs ledger {len(ledger['order'])} per the §2 scan rule)"
            )
    if sync_rec:
        recon_ids = sorted(r["decision"] for r in sync_rec["facts"]["decisionReconciliation"])
        expected = sorted(ledger_as_of(ledger, "sync"))
        # ARC entries postdate a change-scoped sync, so compare against the as-of view.
        expected = [e for e in expected if not e.startswith("ARC-")]
        if recon_ids != expected:
            warnings.append(
                f"sync reconciliation rows ({len(recon_ids)}) differ from the as-of-sync ledger view ({len(expected)})"
            )
    if verify_rec and contract:
        vc = verify_rec["facts"]["checks"]["contract"]
        if vc["total"] != len(statement_ids):
            errors.append(f"verify contract total {vc['total']} != contract statements {len(statement_ids)}")

    known_refs = set(ledger["order"])
    if contract:
        known_refs.update(statement_ids)
    if frame_rec and frame_rec["facts"].get("risk"):
        known_refs.update(item["id"] for item in frame_rec["facts"]["risk"]["items"])
    review_rec = latest(records, "review")
    if review_rec:
        known_refs.update(f["id"] for f in review_rec["facts"]["findings"])
    if verify_rec:
        known_refs.update(f["id"] for f in verify_rec["facts"].get("findings", []))
    if sync_rec:
        known_refs.update(f["id"] for f in sync_rec["facts"]["driftFindings"])

    model = {
        "changeId": change_id,
        "root": root,
        "changeDir": change_dir,
        "ledger": ledger,
        "records": records,
        "sessions": sessions,
        "chain": chain,
        "mode": final_mode,
        "escalatedFrom": escalated_from,
        "status": status,
        "phases": phases,
        "current": current,
        "approval": approval,
        "coverage": coverage,
        "knownRefs": known_refs,
    }
    return model, errors, warnings


# --------------------------------------------------------------------------
# Rendering helpers
# --------------------------------------------------------------------------


def date_of(iso: Optional[str]) -> str:
    return iso[:10] if iso else "—"


def dash(value: Any) -> str:
    return str(value) if value not in (None, "") else "—"


def limiter_lines(limiters: List[Dict[str, Any]]) -> List[str]:
    out = []
    for lim in limiters or []:
        tag = lim["kind"] if not lim.get("confidence") else f"{lim['kind']} · {lim['confidence']}"
        out.append(f"- `[{tag}]` {lim['text']}")
    return out


def condition_icon(status: str) -> str:
    return "✅" if status in ("CONFIRMED", "SATISFIED") else ("❌" if status == "FAILED" else "⏳")


def check_table(rows: List[Tuple[str, str]]) -> List[str]:
    out = ["| check | result |", "|---|---|"]
    out.extend(f"| {k} | {v} |" for k, v in rows)
    return out


def rules_cell(rules: List[Dict[str, Any]]) -> str:
    return " · ".join(f"{r['id']} {'✅' if r['status'] == 'pass' else '❌'}" for r in rules)


# --------------------------------------------------------------------------
# change.md renderer
# --------------------------------------------------------------------------


def resolve_write_context(model: Dict[str, Any], hook) -> Dict[str, Any]:
    """Repository context + identity, resolved once per render (machine-local)."""
    if "_ctx" not in model:
        ctx = {"repo": None, "identity": "unknown", "identitySource": "none", "confidence": "LOW"}
        if hook:
            rc, rc_conf = hook.resolve_repository_context(model["root"])
            ident_value, ident_source, ident_conf = hook.resolve_identity("provider-username", "", model["root"])
            ctx = {
                "repo": rc, "identity": ident_value, "identitySource": ident_source,
                "confidence": hook.min_confidence(ident_conf, rc_conf),
            }
        model["_ctx"] = ctx
    return model["_ctx"]


def derived_written_at(model: Dict[str, Any]) -> Optional[str]:
    """Deterministic provenance timestamp: the newest source-record timestamp.

    Never the wall clock - a render must be regenerable byte-identically at any
    commit (Stage-B determinism rule).
    """
    stamps: List[str] = []
    for passes in model["records"]["phases"].values():
        stamps.extend(r["at"] for r in passes)
    if model["records"]["contract"]:
        stamps.append(model["records"]["contract"]["recordedAt"])
    return max(stamps) if stamps else None


def body_hash_of(body: str, hook) -> str:
    if hook:
        return hook.compute_body_hash(body)
    return hashlib.sha256(body.strip("\n").encode("utf-8")).hexdigest()


ARTIFACT_SOURCE_COMMAND = {
    "change": "chaos:propose",
    "lifecycle": "chaos:propose",
    "sync-report": "chaos:sync",
    "archive-report": "chaos:archive",
    "change-artifact": "chaos:propose",
}
REPO_CONTEXT_ARTIFACTS = {"change", "sync-report", "archive-report"}


def _fallback_scalar(value: Any) -> str:
    """Mirror of the metadata hook's _yaml_scalar, for hook-less environments."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value)
    if s == "" or s.strip() != s or re.search(r"[:#\[\]{}]", s) or s.lower() in ("null", "true", "false", "~"):
        return json.dumps(s)
    return s


def render_frontmatter(model: Dict[str, Any], hook, artifact_type: str, body: str = "") -> List[str]:
    scalar = hook._yaml_scalar if hook else _fallback_scalar
    ctx = resolve_write_context(model, hook)
    written_at = derived_written_at(model)
    identity = ctx["identity"]
    lines = ["---", "chaosMetadata:"]
    lines.append("  schemaVersion: 1")
    lines.append(f"  artifactType: {artifact_type}")
    lines.append("  artifactScope: change")
    lines.append(f"  changeId: {model['changeId']}")
    if artifact_type == "change":
        lines.append(f"  mode: {model['mode']}")
        lines.append(f"  escalatedFrom: {scalar(model['escalatedFrom'])}")
    lines.append(f"  sourceCommand: {scalar(ARTIFACT_SOURCE_COMMAND.get(artifact_type, 'chaos:render'))}")
    lines.append(f"  lastWrittenAt: {scalar(written_at)}")
    lines.append(f"  lastWrittenBy: {scalar(identity)}")
    lines.append(f"  lastAuditedAt: {scalar(written_at)}")
    lines.append(f"  lastAuditedBy: {scalar(identity)}")
    if artifact_type in REPO_CONTEXT_ARTIFACTS and ctx["repo"]:
        lines.append("  repositoryContext:")
        for key in ("provider", "branch", "reviewRequest", "contextSource", "confidence"):
            lines.append(f"    {key}: {scalar(ctx['repo'].get(key))}")
    lines.append("  metadata:")
    lines.append(f"    identitySource: {scalar(ctx['identitySource'])}")
    lines.append("    timestampSource: records")
    lines.append(f"    confidence: {scalar(ctx['confidence'])}")
    lines.append(f"    bodyHash: {scalar('sha256:' + body_hash_of(body, hook))}")
    if artifact_type == "change":
        lines.append("  lifecycle:")
        lines.append(f"    status: {model['status']}")
        lines.append("    phases:")
        rendered = [(p, model["phases"][p]) for p in PHASES + OPTIONAL_PHASES if p in model["phases"]]
        pad = max(len(p) + 1 for p, _ in rendered)
        for phase, info in rendered:
            key = (phase + ":").ljust(pad)
            if info["status"] == "complete":
                lines.append(
                    f"      {key} {{ status: complete, at: \"{info['at']}\", run: \"{info['run']}\", "
                    f"mode: {info['mode']}, verdict: {info['verdict']} }}"
                )
            else:
                lines.append(
                    f"      {key} {{ status: {info['status']}, at: null, run: null, mode: null, verdict: null }}"
                )
        lines.append("    current:")
        cur = model["current"]
        for key in ("tests", "contract", "decisions", "traceability", "syncState", "archiveReadiness"):
            val = cur[key]
            if val is None:
                lines.append(f"      {key}: null")
            elif isinstance(val, int):
                lines.append(f"      {key}: {val}")
            elif key in ("tests", "contract", "traceability"):
                lines.append(f"      {key}: {json.dumps(val)}")
            else:
                lines.append(f"      {key}: {val}")
    lines.append("---")
    return lines


def slugify(heading: str) -> str:
    base = heading.split("(")[0]
    base = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")
    return base[:40] or "section"


def apply_overflow(content: List[str]) -> Tuple[List[str], Dict[str, List[str]]]:
    """Enforce the ~80-line section rule by measurement (round-3 defect fix).

    Any `##` section whose body exceeds OVERFLOW_LINES moves to
    appendix/<slug>.md, leaving the heading, a one-line summary and the link.
    """
    out: List[str] = []
    appendices: Dict[str, List[str]] = {}
    i = 0
    while i < len(content):
        line = content[i]
        if not line.startswith("## "):
            out.append(line)
            i += 1
            continue
        j = i + 1
        while j < len(content) and not content[j].startswith("## "):
            j += 1
        section = content[i:j]
        if len(section) - 1 <= OVERFLOW_LINES:
            out.extend(section)
        else:
            heading = line[3:].strip()
            slug = slugify(heading)
            appendices[slug] = ["# " + heading] + section[1:]
            summary = next(
                (s.strip() for s in section[1:]
                 if s.strip() and not s.strip().startswith(("<!--", "###", "|", "-->")) and "-->" not in s),
                "…",
            )
            out.append(line)
            out.append("")
            out.append(f"{summary} · full section: `appendix/{slug}.md` ({len(section) - 1} lines, overflowed per the ~{OVERFLOW_LINES}-line rule)")
        i = j
    return out, appendices


def render_change_md(model: Dict[str, Any], hook) -> str:
    content, _appendices = apply_overflow(render_change_body(model))
    fm = render_frontmatter(model, hook, "change", "\n".join(content))
    return "\n".join(fm + [""] + content) + "\n"


def render_change_body(model: Dict[str, Any]) -> List[str]:
    records = model["records"]
    ledger = model["ledger"]
    frame = latest(records, "frame")
    review = latest(records, "review")
    archive = latest(records, "archive")
    contract = records["contract"]
    out: List[str] = []

    title = frame["facts"]["title"] if frame else model["changeId"]
    out.append(f"# {model['changeId']} — {title}")
    out.append("")
    for hop in model["chain"]:
        out.append(
            f"> ⚠ **escalated: {hop['from']} → {hop['to']}** — {hop['desc']} · {hop['date']} · see {hop['ref']}"
        )
    if model["chain"]:
        out.append("")

    out.append("## Intent")
    out.append("")
    if frame:
        out.extend(frame["facts"]["intent"])
    out.append("")

    out.append("## Contract")
    out.append("")
    if contract:
        groups: Dict[Optional[str], List[Dict[str, Any]]] = {}
        group_order = contract.get("groups") or []
        for st in contract["statements"]:
            groups.setdefault(st.get("group"), []).append(st)
        ordered = group_order + [g for g in groups if g not in group_order and g is not None]
        keys: List[Optional[str]] = ordered if ordered else [None]
        if None in groups and keys != [None]:
            keys.append(None)
        for gi, group in enumerate(keys):
            if group not in groups:
                continue
            if group is not None:
                out.append(f"**{group}**")
                out.append("")
            for st in groups[group]:
                cov = model["coverage"].get(st["id"])
                mark = "x" if cov and cov["covered"] else " "
                out.append(f"- [{mark}] {st['text']}")
            if gi < len(keys) - 1:
                out.append("")
    if archive:
        fa = archive["facts"]["openspecArchive"]
        base = ", ".join(f"`openspec/specs/{p['capability']}/`" for p in fa.get("promotions", []))
        out.append("")
        out.append(
            f"OpenSpec: `openspec/changes/archive/{fa['archivedAs']}/` (archived {date_of(archive['at'])}; "
            f"base specs at {base}) · decisions: see `decision-events.md`"
        )
    else:
        out.append("")
        out.append(f"OpenSpec: `openspec/changes/{model['changeId']}/` · decisions: see `decision-events.md`")

    if frame:
        osf = frame["facts"]["openspec"]
        out.append("")
        out.append("### OpenSpec Invocation")
        out.append("")
        out.append(f"Status: **{osf['status']}**")
        engine = osf.get("engine") or {}
        if engine:
            ver = f" CLI {engine['version']}" if engine.get("version") else ""
            src = f" ({engine['configSource']})" if engine.get("configSource") else ""
            out.append("")
            out.append(f"Configured OpenSpec command: `{engine['name']}`{ver}{src}")
        if osf.get("invocationPath"):
            out.append("")
            out.append(f"Actual invocation: {osf['invocationPath']}")
        if osf.get("artifacts"):
            out.append("")
            out.append("Generated OpenSpec artifacts:")
            out.append("")
            out.extend(f"- `{a}`" for a in osf["artifacts"])
        if osf.get("statusCheck"):
            sc = osf["statusCheck"]
            note = f"; {sc['note']}" if sc.get("note") else ""
            out.append("")
            out.append(
                f"`openspec status --change {model['changeId']} --json` reports "
                f"`isComplete: {str(sc['isComplete']).lower()}`{note}."
            )
        if osf.get("validation"):
            v = osf["validation"]
            out.append("")
            out.append(f"Validation command: `{v['command']}`")
            out.append("")
            note = f" — \"{v['note']}\"" if v.get("note") else ""
            out.append(f"Validation result: **{v['result']}**{note}")
        if osf.get("confidenceImpact"):
            out.append("")
            out.append(f"Confidence impact: {osf['confidenceImpact']}")

        if frame["facts"].get("sourceManifest"):
            out.append("")
            out.append("## Source manifest (strict — exact, inspected)")
            out.append("")
            out.append("| Path | Role | Knowledge |")
            out.append("|---|---|---|")
            for row in frame["facts"]["sourceManifest"]:
                out.append(f"| `{row['path']}` | {row['role']} | {row['knowledge']} |")

        if frame["facts"].get("risk"):
            risk = frame["facts"]["risk"]
            out.append("")
            out.append("## Risk (strict)")
            out.append("")
            rationale = f" — {risk['classRationale']}" if risk.get("classRationale") else ""
            out.append(f"Risk class: **{risk['class']}**{rationale}")
            out.append("")
            out.append("| # | Risk | Likelihood | Impact | Mitigation |")
            out.append("|---|---|---|---|---|")
            for item in risk["items"]:
                out.append(
                    f"| {item['id']} | {item['summary']} | {item['likelihood']} | {item['impact']} | {item['mitigation']} |"
                )

        if frame["facts"].get("framingTraceability"):
            out.append("")
            out.append("## Traceability (strict)")
            out.append("")
            out.append("Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:")
            out.append("")
            out.append("| Spec capability | Requirements | Contract statements | Tasks |")
            out.append("|---|---|---|---|")
            for row in frame["facts"]["framingTraceability"]:
                cap = f"`{row['capability']}`" if row.get("capability") else "— (governance)"
                reqs = row["requirements"] if row.get("requirements") is not None else "—"
                stmts = f"{', '.join(row['statements'])} ({len(row['statements'])})" if row["statements"] else "—"
                out.append(f"| {cap} | {reqs} | {stmts} | {row['tasks']} |")

    if review:
        rf = review["facts"]
        out.append("")
        out.append("## Review")
        out.append("")
        a = review["assessment"]
        out.append(
            f"verdict: {review['verdict']} · confidence: {a['confidence']} · "
            f"evidence_coverage: {a['evidenceCoverage']} · assumption_load: {a['assumptionLoad']}"
        )
        scope = ", ".join(f"`{p}`" for p in rf["scope"]["paths"])
        out.append(f"scope: {scope} · rules in play: {', '.join(rf['scope']['rulesInPlay'])}")
        if rf.get("openspecValidation"):
            ov = rf["openspecValidation"]
            note = f" ({ov['note']})" if ov.get("note") else ""
            eligible = {"READY_FOR_APPROVAL": "Yes", "READY_WITH_CONDITIONS": "Conditional"}.get(review["verdict"], "No")
            out.append(f"openspec_validation: {ov['result']}{note} · approval_eligible: {eligible}")
        out.append(f"reviewed: {date_of(review['at'])} · run: {review['run']}")
        approval = model["approval"]
        if approval:
            st = approval["status"]
            rationale = approval["answer"]["rationale"] if approval.get("answer") else None
            quoted = f" — \"{rationale}\"" if rationale else ""
            out.append(
                f"approved: {st['date']} by {st['by']}{quoted} · see {approval['id']} (`approves-change: true`)"
            )
        out.append("")
        out.append("findings:")
        out.append("")
        for f in rf["findings"]:
            tail = f" ({f['decision']})" if f.get("decision") else ""
            note = f" — {f['note']}" if f.get("note") else ""
            out.append(f"- {f['id']} {f['severity']} — {f['summary']} · {f['status']}{tail}{note}")
        if approval and approval["conditions"]:
            out.append("")
            out.append("**Approval conditions** (why CONDITIONS rather than a clean approval):")
            out.append("")
            for i, cond in enumerate(approval["conditions"], 1):
                out.append(f"{i}. {cond}")
        if review.get("commentary"):
            out.append("")
            out.append("### Findings and risk (strict)")
            out.append("")
            out.append(review["commentary"].rstrip())
        if review.get("confidenceLimiters"):
            out.append("")
            out.append("Confidence limiters:")
            out.append("")
            out.extend(limiter_lines(review["confidenceLimiters"]))

    if frame:
        out.append("")
        out.append("## Framing record")
        out.append("")
        a = frame["assessment"]
        out.append(
            f"verdict: {frame['verdict']} · confidence: {a['confidence']} · "
            f"evidence_coverage: {a['evidenceCoverage']} · assumption_load: {a['assumptionLoad']}"
        )
        if frame.get("commentary"):
            out.append("")
            out.append(frame["commentary"].rstrip())
        if frame["mode"] == "strict":
            out.append("")
            out.append("Under strict, `chaos:review` is **mandatory** before implementation.")
        if frame.get("confidenceLimiters"):
            out.append("")
            out.append("Confidence limiters:")
            out.append("")
            out.extend(limiter_lines(frame["confidenceLimiters"]))

    deliver_passes = records["phases"].get("deliver") or []
    if deliver_passes:
        out.append("")
        out.append("## Delivery")
        out.append("")
        out.append("<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state")
        out.append("     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->")
        for rec in deliver_passes:
            f = rec["facts"]
            out.append("")
            out.append(f"### Delivery — pass {rec['pass']}")
            out.append("")
            build = f["build"]
            bcmd = f" (`{build['command']}`)" if build.get("command") else ""
            tests = f["tests"]
            tnote = f" ({tests['note']})" if tests.get("note") else ""
            covered = sum(1 for r in f["coverage"] if r["covered"])
            out.extend(check_table([
                ("build", f"{build['warnings']} warn / {build['errors']} err{bcmd}"),
                ("tests", f"{tests['passed']}/{tests['total']}{tnote}"),
                ("contract", f"{covered}/{len(f['coverage'])} statements covered"),
                ("rules", rules_cell(f["rules"])),
            ]))
            out.append("")
            files = ", ".join(
                f"`{row['path']}`" + (" (new)" if row["change"] == "added" else "")
                for row in f["files"]
            )
            out.append(f"files: {files}")
            if f.get("scopeDrift"):
                sd = f["scopeDrift"]
                note = f" — {sd['note']}" if sd.get("note") else ""
                out.append("")
                out.append(f"scope drift: **{sd['status']}**{note}")
            out.append("")
            out.append(f"status: Delivered · {date_of(rec['at'])} · run: {rec['run']}")
            a = rec["assessment"]
            risk = f["scopeDrift"].get("risk") if f.get("scopeDrift") else None
            risk_part = f" · scope drift risk: {risk}" if risk else ""
            out.append(
                f"result: {rec['verdict']} · execution confidence: {a['confidence']} · "
                f"validation evidence: {a['evidenceCoverage']}{risk_part} · assumption load: {a['assumptionLoad']}"
            )
            if f.get("rules"):
                out.append("")
                out.append("### Rule evidence")
                out.append("")
                out.append("| Rule | Evidence |")
                out.append("|---|---|")
                for r in f["rules"]:
                    out.append(f"| {r['id']} | {r['evidence']} |")
            honesty = [r for r in f["coverage"] if r["covered"] and r["evidence"] != "test"]
            if honesty:
                out.append("")
                out.append("### Coverage honesty — how each contract statement was evidenced")
                out.append("")
                test_covered = sum(1 for r in f["coverage"] if r["covered"] and r["evidence"] == "test")
                out.append(
                    f"{test_covered} of {len(f['coverage'])} statements are covered by a passing test. "
                    f"{len(honesty)} are **code-evidenced only**, and are called out rather than quietly ticked:"
                )
                out.append("")
                out.append("| Statement | Evidence | Why not test-covered |")
                out.append("|---|---|---|")
                stmt_text = {s["id"]: s["text"] for s in (contract["statements"] if contract else [])}
                for r in honesty:
                    refs = "; ".join(r.get("refs") or [])
                    out.append(f"| {stmt_text.get(r['statement'], r['statement'])} | {refs} | {dash(r.get('whyNotTest'))} |")
            if f.get("deviations"):
                out.append("")
                out.append("### Deviations")
                out.append("")
                dec_by_id = {d["id"]: d for d in ledger["decisions"]}
                for i, dev in enumerate(f["deviations"], 1):
                    entry = dec_by_id.get(dev["decision"])
                    detail = ""
                    if entry and entry.get("rationale"):
                        detail = f" {entry['rationale']}"
                    out.append(f"{i}. **{dev['summary']}** ({dev['decision']}).{detail}")
            if f.get("approvalConditions"):
                out.append("")
                out.append("### Approval conditions — status at delivery")
                out.append("")
                approval = model["approval"]
                for c in f["approvalConditions"]:
                    label = ""
                    if approval and 0 < c["index"] <= len(approval["conditions"]):
                        label = approval["conditions"][c["index"] - 1]
                    note = f" — {c['note']}" if c.get("note") else ""
                    out.append(f"{c['index']}. **{label}** {condition_icon(c['status'])}{note}")
            if rec.get("verdictRationale"):
                out.append("")
                out.append("### Delivery notes")
                out.append("")
                out.append(rec["verdictRationale"].rstrip())
            if rec.get("commentary"):
                out.append("")
                out.append(rec["commentary"].rstrip())

    todo = derive_todo_candidates(model)
    if todo:
        out.append("")
        out.append("## Todo Candidates")
        out.append("")
        for item in todo:
            ref = f" ({item['ref']})" if item.get("ref") else ""
            note = f" — {item['note']}" if item.get("note") else ""
            out.append(f"- **{item['title']}**{ref}{note}")

    verify_passes = records["phases"].get("verify") or []
    if verify_passes:
        out.append("")
        out.append("## Verification")
        out.append("")
        out.append("<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state")
        out.append("     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->")
        for rec in verify_passes:
            out.extend(render_verify_pass(model, rec))

    return out


def derive_todo_candidates(model: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Mechanical baseline (open review advisories) ∪ authored todoCandidates.

    Dedup key is the ref when present (the same debt item surfaces from several
    phases — deliver, sync and archive all name RK-5), else the lowercased title.
    First occurrence wins, so the earliest phase's phrasing is kept.
    """
    items: List[Dict[str, Any]] = []
    seen = set()

    def add(item: Dict[str, Any]) -> None:
        key = item.get("ref") or item["title"].lower()
        if key not in seen:
            seen.add(key)
            items.append(item)

    for phase in PHASES:
        rec = latest(model["records"], phase)
        if rec:
            for t in rec.get("todoCandidates") or []:
                add(dict(t))
    review = latest(model["records"], "review")
    if review:
        for f in review["facts"]["findings"]:
            if f["status"] == "OPEN":
                add({"title": f"{f['id']} ({f['severity']})", "ref": f["id"], "note": f["summary"]})
    return items


def render_verify_pass(model: Dict[str, Any], rec: Dict[str, Any]) -> List[str]:
    out: List[str] = []
    f = rec["facts"]
    a = rec["assessment"]
    out.append("")
    out.append(f"### Verification — pass {rec['pass']}")
    out.append("")
    out.append(
        f"verdict: {rec['verdict']} · confidence: {a['confidence']} · evidence_coverage: {a['evidenceCoverage']} · "
        f"assumption_load: {a['assumptionLoad']} · archive_readiness: {f['archiveReadiness']}"
    )
    out.append(f"verified: {date_of(rec['at'])} · run: {rec['run']} · mode: {rec['mode']}")
    out.append("")
    checks = f["checks"]
    rows: List[Tuple[str, str]] = []
    b = checks["build"]
    note = f" — {b['note']}" if b.get("note") else ""
    rows.append(("build", f"{b['warnings']} warn / {b['errors']} err{note}"))
    t = checks["tests"]
    note = f" — {t['note']}" if t.get("note") else ""
    rows.append(("tests", f"{t['passed']}/{t['total']}{note}"))
    c = checks["contract"]
    note = f"; {c['note']}" if c.get("note") else ""
    rows.append(("contract", f"{c['ticked']}/{c['total']} ticked{note}"))
    if checks.get("openspec"):
        o = checks["openspec"]
        tasks = f" · {o['tasks']['done']}/{o['tasks']['total']} tasks" if o.get("tasks") else ""
        rows.append(("openspec", f"`validate --strict` {o['validation']} · `isComplete: {str(o['isComplete']).lower()}`{tasks}"))
    if f.get("traceability"):
        sat = sum(1 for r in f["traceability"] if r["status"] == "SATISFIED")
        par = sum(1 for r in f["traceability"] if r["status"] == "PARTIAL")
        mis = sum(1 for r in f["traceability"] if r["status"] == "MISSING")
        rows.append(("traceability", f"{sat} SATISFIED / {par} PARTIAL / {mis} MISSING"))
    if checks.get("scopeDrift"):
        sd = checks["scopeDrift"]
        note = f" — {sd['note']}" if sd.get("note") else ""
        rows.append(("scope drift", f"**{sd['status']}**{note}"))
    if checks.get("rules"):
        rows.append(("rules", rules_cell(checks["rules"])))
    out.extend(check_table(rows))

    approval = model["approval"]
    for c in f.get("approvalConditions") or []:
        status_label = c["status"].replace("_", " ")
        out.append("")
        out.append(f"### Approval condition {c['index']} — {status_label}")
        out.append("")
        if c.get("detail"):
            out.append(c["detail"].rstrip())
        elif c.get("note"):
            out.append(c["note"])

    if f.get("traceability"):
        out.append("")
        out.append("### Traceability (strict)")
        out.append("")
        out.append("| Requirement | Source | Implementation | Test | Status | Confidence |")
        out.append("|---|---|---|---|---|---|")
        for r in f["traceability"]:
            test = r["test"] if r["test"] else "none"
            status = f"**{r['status']}**" if r["status"] != "SATISFIED" else r["status"]
            out.append(
                f"| {r['requirement']} | {r['capability']} | {r['implementation']} | {test} | {status} | {r['confidence']} |"
            )

    if f.get("findings"):
        out.append("")
        out.append("### Findings")
        for fd in f["findings"]:
            out.append("")
            out.append(f"**{fd['id']} — {fd['severity']} · {fd['knowledge']} · {fd['confidence']} · {fd['title']}**")
            if fd.get("detail"):
                out.append(fd["detail"].rstrip())
            if fd.get("recommendation"):
                out.append(f"Recommend {fd['recommendation']}.")

    review = latest(model["records"], "review")
    open_findings = [x for x in review["facts"]["findings"] if x["status"] == "OPEN"] if review else []
    if open_findings:
        out.append("")
        refs = " and ".join(x["id"] for x in open_findings)
        out.append(f"**Carried from review, still open:** {refs}.")

    out.append("")
    out.append("### Decision-event audit")
    out.append("")
    out.append(render_decision_audit(model, "verify"))

    if rec.get("verdictRationale"):
        out.append("")
        alt = {"READY_WITH_DEBT": "READY", "NOT_READY": "READY", "READY": "NOT_READY"}.get(rec["verdict"], "—")
        out.append(f"### Why {rec['verdict']} and not {alt}")
        out.append("")
        out.append(rec["verdictRationale"].rstrip())
    return out


def render_decision_audit(model: Dict[str, Any], phase: str) -> str:
    ledger = model["ledger"]
    visible = ledger_as_of(ledger, phase)
    by_prefix: Dict[str, int] = {}
    for entry_id in visible:
        prefix = "ESC" if entry_id.startswith("ESC-") else entry_id.rsplit("-DEC-", 1)[0] + "-DEC"
        by_prefix[prefix] = by_prefix.get(prefix, 0) + 1
    parts = [f"{n} `{p}`" for p, n in by_prefix.items()]
    open_entries = [
        d["id"] for d in ledger["decisions"]
        if d["id"] in visible and d["status"]["state"] == "OPEN"
    ]
    tokens: List[str] = []
    for d in ledger["decisions"]:
        if d["id"] in visible and d.get("syncAction"):
            for tok in d["syncAction"]["tokens"]:
                if tok != "NONE" and tok not in tokens:
                    tokens.append(tok)
    open_part = "No OPEN entry." if not open_entries else f"OPEN: {', '.join(open_entries)}."
    sync_part = f" Sync actions declared and syncable: {', '.join(f'`{t}`' for t in tokens)}." if tokens else ""
    return (
        f"{len(visible)} entries: {', '.join(parts)}. {open_part}{sync_part} "
        "Every `*-DEC-*` id cross-referenced in this document resolves to an existing entry. `[FACT · HIGH]`"
    )


# --------------------------------------------------------------------------
# lifecycle.md renderer
# --------------------------------------------------------------------------

PHASE_LABEL = {
    "frame": "Frame", "review": "Review", "deliver": "Deliver", "verify": "Verify",
    "sync": "Sync", "archive": "Archive", "codeReview": "Code review", "retro": "Retro",
}
PHASE_POINTER = {
    "frame": "change.md#contract", "review": "change.md#review", "deliver": "change.md#delivery",
    "verify": "change.md#verification", "sync": "change.md (decision-events)", "archive": "—",
    "codeReview": "change.md#review", "retro": "—",
}


def render_lifecycle_md(model: Dict[str, Any], hook) -> str:
    content = render_lifecycle_body(model)
    fm = render_frontmatter(model, hook, "lifecycle", "\n".join(content))
    return "\n".join(fm + [""] + content) + "\n"


def render_lifecycle_body(model: Dict[str, Any]) -> List[str]:
    out: List[str] = []
    out.append(f"# Lifecycle — {model['changeId']}")
    out.append("")
    out.append(f"Status: {model['status']}")
    out.append(f"Mode: {model['mode']} · Escalated-from: {model['escalatedFrom'] or 'none'}")

    archive = latest(model["records"], "archive")
    if archive:
        openspec_path = f"openspec/changes/archive/{archive['facts']['openspecArchive']['archivedAs']}"
    else:
        openspec_path = f"openspec/changes/{model['changeId']}"
    runs = " · ".join(
        f"{phase} {model['phases'][phase]['run']}"
        for phase in PHASES + OPTIONAL_PHASES
        if phase in model["phases"] and model["phases"][phase]["run"]
    )
    out.append(f"OpenSpec: {openspec_path} · Runs: {runs}")

    cur = model["current"]
    light = model["mode"] == "light"
    parts = []
    if cur["tests"] is not None or True:
        parts.append(f"tests {dash(cur['tests'])}")
    parts.append(f"contract {dash(cur['contract'])}")
    parts.append(f"decisions {dash(cur['decisions'])}")
    if not light:
        parts.append(f"traceability {dash(cur['traceability'])}")
        parts.append(f"sync {dash(cur['syncState'])}")
        parts.append(f"archive {dash(cur['archiveReadiness'])}")
    out.append("Current: " + " · ".join(parts))
    out.append("")
    out.append("| Phase | Status | Mode | Verdict | Date | Pointer |")
    out.append("|---|---|---|---|---|---|")
    rendered_phases = ["frame", "deliver"] if light else PHASES
    rendered_phases = rendered_phases + [p for p in OPTIONAL_PHASES if p in model["phases"]]
    sync_rec = latest(model["records"], "sync")
    for phase in rendered_phases:
        info = model["phases"].get(phase)
        if info is None:
            continue
        status = {"complete": "Complete", "attempted": "Attempted", "pending": "Pending"}[info["status"]]
        pointer = PHASE_POINTER[phase]
        if phase == "sync" and sync_rec:
            pointer = "sync-report.md"
        if phase == "archive" and archive:
            pointer = "archive-report.md"
        out.append(
            f"| {PHASE_LABEL[phase]} | {status} | {dash(info['mode'])} | {dash(info['verdict'])} "
            f"| {date_of(info['at']) if info['at'] else '—'} | {pointer} |"
        )
    return out


# --------------------------------------------------------------------------
# sync-report.md / archive-report.md renderers
# --------------------------------------------------------------------------


def kv_table(rows: List[Tuple[str, str]]) -> List[str]:
    out = ["| | |", "|---|---|"]
    out.extend(f"| {k} | {v} |" for k, v in rows)
    return out


def render_todo_section(items: List[Dict[str, Any]]) -> List[str]:
    out = ["", "## Todo Candidates", ""]
    for item in items:
        ref = f" ({item['ref']})" if item.get("ref") else ""
        note = f" — {item['note']}" if item.get("note") else ""
        out.append(f"- **{item['title']}**{ref}{note}")
    return out


def render_sync_report_md(model: Dict[str, Any], hook) -> str:
    content = render_sync_report_body(model)
    fm = render_frontmatter(model, hook, "sync-report", "\n".join(content))
    return "\n".join(fm + [""] + content) + "\n"


def render_sync_report_body(model: Dict[str, Any]) -> List[str]:
    rec = latest(model["records"], "sync")
    f = rec["facts"]
    inv = f["invocation"]
    out: List[str] = [f"# CHAOS Sync Report — {model['changeId']}", ""]

    recon = f["decisionReconciliation"]
    recommended = sum(1 for d in f["driftFindings"] if d["action"]["kind"] == "RECOMMEND")
    applied = sum(1 for d in f["driftFindings"] if d["action"]["kind"] == "APPLY")
    out.append("## 1. Sync Dashboard")
    out.append("")
    out.extend(kv_table([
        ("Scope", f"one change (`{model['changeId']}`)"),
        ("Role level", f"**{inv['roleLevel']}**"),
        ("Decision events", f"{len(recon)} — all terminal, all classified"),
        ("Shared-governance promotions", f"**{recommended} recommended, {applied} applied**"),
        ("Manual follow-up required", "**YES**" if f.get("rollup", {}).get("manualFollowUpRequired") else "no"),
        ("Verdict", rec["verdict"]),
    ]))

    out.append("")
    out.append("## 2. Invocation and Mode")
    out.append("")
    out.append(f"Command: `chaos:sync --change {model['changeId']}`")
    out.append(f"Mode: {rec['mode']} (inferred from `change.md` `chaosMetadata.mode`)")
    out.append("Scope: single change")
    out.append(f"Role level: {inv['roleLevel']}")
    out.append(f"Report target: `.chaos/changes/{model['changeId']}/sync-report.md`")
    out.append(f"Dry-run: {'yes' if inv['dryRun'] else 'no'}")
    if inv["roleLevel"] == "contributor-safe":
        out.append("")
        out.append(
            "**Scope ceiling.** `chaos:sync --change` must not silently edit shared governance "
            "(ADRs, decision logs, rules, gates, indexes, `AGENTS.md`, `README.md`); it may "
            "*recommend* promotions and route them to a maintainer-level sync "
            "(`change-scope-and-roles.md` §1). Drift items below touching shared files are "
            "therefore **recommended, not applied**."
        )

    if f.get("sourceManifest"):
        out.append("")
        out.append("## 3. Source Manifest")
        out.append("")
        out.append("| Source | Status | Notes |")
        out.append("|---|---|---|")
        for row in f["sourceManifest"]:
            status = f"**{row['status']}**" if row["status"] != "verified" else row["status"]
            note = row.get("note") or (row.get("finding") or "")
            if row.get("finding") and row.get("note"):
                note = f"{row['note']} ({row['finding']})"
            elif row.get("finding"):
                note = row["finding"]
            out.append(f"| `{row['source']}` | {status} | {note} |")

    if f.get("openspec"):
        o = f["openspec"]
        out.append("")
        out.append("## 4. Toolchain / OpenSpec Status")
        out.append("")
        auth = f.get("authority")
        auth_part = ""
        if auth:
            auth_part = (
                f" Repository context resolved from **{auth['contextSource']}**; authority "
                f"confidence **{auth['confidence']}**" + (f" — {auth['note']}" if auth.get("note") else "") + "."
            )
        out.append(
            f"`openspec validate {model['changeId']} --strict` → **{o['validation']}** · "
            f"`isComplete: {str(o['isComplete']).lower()}` · "
            f"{o['tasks']['done']}/{o['tasks']['total']} tasks ticked.{auth_part}"
        )

    out.append("")
    out.append("## 5. Drift Findings")
    out.append("")
    out.append("| ID | Category | Severity | Knowledge | Confidence | Summary | Action |")
    out.append("|---|---|---|---|---|---|---|")
    for d in f["driftFindings"]:
        sev = f"**{d['severity']}**" if d["severity"] == "HIGH" else d["severity"]
        act = d["action"]
        action = {"APPLY": "Applied", "RECOMMEND": "**Recommend**", "DEFER": "Defer"}[act["kind"]]
        if act.get("target"):
            action += f" {act['target']}"
        if act.get("note"):
            action += f"; {act['note']}"
        out.append(f"| {d['id']} | {d['category']} | {sev} | {d['knowledge']} | {d['confidence']} | {d['summary']} | {action} |")

    out.append("")
    out.append("## 6. Decision Event Reconciliation")
    out.append("")
    out.append(f"All {len(recon)} classified.")
    out.append("")
    out.append("| Decision | Type | Promotion | Status |")
    out.append("|---|---|---|---|")
    for row in recon:
        promo = " + ".join(
            p["token"] + (f" ({p['state']})" if p["state"] not in ("done", "closed") else "")
            for p in row["promotions"]
        )
        notes = " · ".join(p["note"] for p in row["promotions"] if p.get("note")) or "closed"
        out.append(f"| {row['decision']} | {row['classification']} | {promo} | {notes} |")

    out.append("")
    out.append("## 7. Applied Sync Actions")
    out.append("")
    out.append("| Action | File | Result |")
    out.append("|---|---|---|")
    for a in f.get("appliedActions", []):
        out.append(f"| {a['action']} | `{a['file']}` | {a['result']} |")
    if f.get("notModified"):
        out.append("")
        out.append("Not modified: " + ", ".join(f"`{p}`" for p in f["notModified"]))

    if f.get("ruleCandidates") or f.get("gateCandidates"):
        out.append("")
        out.append("## 8. Rules and Gates")
        for rc_item in f.get("ruleCandidates", []):
            out.append("")
            out.append(
                f"- **Candidate {rc_item['id']}** (source: {rc_item['source']}, severity: {rc_item['severity']}) — "
                f"{rc_item['statement']} Violation criterion: {rc_item['violationCriterion']}"
            )
        if not f.get("gateCandidates"):
            out.append("")
            out.append("Gates: none.")

    if f.get("debt"):
        out.append("")
        out.append("## 9. Sync Debt Ledger")
        out.append("")
        out.append("| Item | Reason | Impact | Follow-up |")
        out.append("|---|---|---|---|")
        for d in f["debt"]:
            out.append(f"| {d['item']} | {d['reason']} | {d['impact']} | {d['followUp']} |")

    if f.get("consistencyChecks"):
        out.append("")
        out.append("## 10. Post-Sync Consistency Check")
        out.append("")
        out.append("| Check | Result |")
        out.append("|---|---|")
        for c in f["consistencyChecks"]:
            result = c["result"] + (f" ({c['note']})" if c.get("note") else "")
            out.append(f"| {c['check']} | {result} |")

    out.append("")
    out.append("## 11. Final Sync Verdict")
    out.append("")
    out.append(f"Verdict: **{rec['verdict']}**")
    a = rec["assessment"]
    auth = f.get("authority")
    auth_note = f" · {auth['confidence']} authority confidence ({auth['contextSource']})" if auth else ""
    out.append(f"Confidence: {a['confidence']}{auth_note}")
    r = f.get("rollup")
    if r:
        out.append(
            f"Drift load: {r['driftLoad']} · Decision load: {r['decisionLoad']} · "
            f"Rule impact: {r.get('ruleImpact', 'NONE')} · Gate impact: {r.get('gateImpact', 'NONE')} · "
            f"ADR impact: {r.get('adrImpact', 'NONE')}"
        )
        out.append(f"Manual follow-up required: **{'YES' if r['manualFollowUpRequired'] else 'NO'}**")

    if rec.get("commentary"):
        out.append("")
        out.append("## 12. Closure Summary")
        out.append("")
        out.append(rec["commentary"].rstrip())

    if rec.get("todoCandidates"):
        out.extend(render_todo_section(rec["todoCandidates"]))
    return out


def render_archive_report_md(model: Dict[str, Any], hook) -> str:
    content = render_archive_report_body(model)
    fm = render_frontmatter(model, hook, "archive-report", "\n".join(content))
    return "\n".join(fm + [""] + content) + "\n"


def render_archive_report_body(model: Dict[str, Any]) -> List[str]:
    rec = latest(model["records"], "archive")
    f = rec["facts"]
    a = rec["assessment"]
    ledger = model["ledger"]
    out: List[str] = [f"# CHAOS Archive Report — {model['changeId']}", ""]

    matrix = f["closureMatrix"]
    out.append("## 1. Archive Dashboard")
    out.append("")
    out.extend(kv_table([
        ("Verdict", f"**{rec['verdict']}**"),
        ("Confidence", f"{a['confidence']} · evidence coverage {a['evidenceCoverage']} · assumption load {a['assumptionLoad']}"),
        ("Mode", f"{rec['mode']} (inferred from `change.md`)"),
        ("Source-of-truth confirmation", f"**{f['sourceOfTruth']['status']}**"),
        ("Decision closure", f"**{len(matrix)} enumerated / {len(matrix)} classified / 0 UNCLASSIFIED**"),
        ("Debt load", f"{f.get('debtLoad', '—')} — {len(f.get('debt', []))} items"),
    ]))

    out.append("")
    out.append("## 2. Invocation")
    out.append("")
    out.append(f"Command: `chaos:archive {model['changeId']}`")
    out.append(f"Run: `{rec['run']}`")
    gate = f["gate"]
    out.append(
        f"Mode: {rec['mode']} · Force waiver: **{'used' if gate['forceWaiver'] else 'not used'}** · "
        f"Governance override: **{'used' if gate['governanceOverride'] else 'not used'}**"
    )
    gate_entry = next((d for d in ledger["decisions"] if d["id"] == gate["decision"]), None)
    if gate_entry and gate_entry.get("answer"):
        ans = gate_entry["answer"]
        rationale = f", \"{ans['rationale']}\"" if ans.get("rationale") else ""
        out.append(f"Archive gate: {gate['decision']} — answered `{ans.get('label') or ans.get('key')}`{rationale}")
    deferrals = [
        d for d in ledger["decisions"]
        if d["id"].startswith("ARC-") and d["id"] != gate["decision"]
        and d.get("answer") and "archive" not in (d["answer"].get("label") or "")
    ]
    for d in deferrals:
        out.append(
            f"Prior attempt: {d['id']} — answered `{d['answer'].get('label')}`; no archive was executed and no report written."
        )

    verify_rec = latest(model["records"], "verify")
    out.append("")
    out.append("## 3. Verification Gate")
    out.append("")
    if verify_rec:
        va = verify_rec["assessment"]
        rows = [
            ("Verification verdict", f"`{verify_rec['verdict']}` (run `{f['gate']['verificationRun']}`, {verify_rec['mode']})"),
            ("Confidence", f"{va['confidence']} · evidence {va['evidenceCoverage']} · assumption load {va['assumptionLoad']}"),
        ]
        tr = verify_rec["facts"].get("traceability")
        if tr:
            sat = sum(1 for r in tr if r["status"] == "SATISFIED")
            par = sum(1 for r in tr if r["status"] == "PARTIAL")
            mis = sum(1 for r in tr if r["status"] == "MISSING")
            rows.append(("Traceability", f"{sat} SATISFIED / {par} PARTIAL / {mis} MISSING"))
        sd = verify_rec["facts"]["checks"].get("scopeDrift")
        if sd:
            rows.append(("Scope drift", sd["status"]))
        out.extend(kv_table(rows))
    else:
        out.append(f"Verification run: `{f['gate']['verificationRun']}` (no verify record found — cross-check unavailable)")

    if f.get("preArchiveValidation"):
        out.append("")
        out.append("## 4. Pre-Archive Validation (re-run at archive time)")
        out.append("")
        out.append("| Check | Result |")
        out.append("|---|---|")
        for c in f["preArchiveValidation"]:
            result = c["result"] + (f" — {c['note']}" if c.get("note") else "")
            out.append(f"| {c['check']} | {result} |")

    out.append("")
    out.append("## 5. Decision Event Closure Matrix")
    out.append("")
    out.append(f"**{len(matrix)} enumerated (§2 scan rule) / {len(matrix)} classified / 0 UNCLASSIFIED — balanced.**")
    out.append("")
    out.append("| ID | Source | Type | Closure Status | Sync Action | Retro Topic | Confidence |")
    out.append("|---|---|---|---|---|---|---|")
    for row in matrix:
        sync_cell = " + ".join(row["syncAction"]["tokens"])
        if row["syncAction"].get("note"):
            sync_cell += f" ({row['syncAction']['note']})"
        closure = f"**{row['closure']}**" if row["closure"] != "CLOSED" else row["closure"]
        out.append(
            f"| {row['decision']} | {row['source']} | {row['classification']} | {closure} "
            f"| {sync_cell} | {row.get('retroTopic') or '—'} | {row['confidence']} |"
        )

    oa = f["openspecArchive"]
    out.append("")
    out.append("## 6. OpenSpec Archive Execution")
    out.append("")
    out.append(f"Command resolved and run: `{oa['command']}`")
    out.append("")
    for p in oa.get("promotions", []):
        out.append(f"- `{p['capability']}: {p['op']}` → `+ {p['requirements']} added`")
    t = oa["totals"]
    out.append(f"- `Totals: + {t['added']}, ~ {t['modified']}, - {t['removed']}, → {t['renamed']}`")
    out.append(f"- Archived as `{oa['archivedAs']}`.")
    for w in oa.get("warnings", []):
        out.append("")
        out.append(f"Non-blocking warning recorded honestly: *\"{w}\"*")

    st = f["sourceOfTruth"]
    out.append("")
    out.append(f"## 7. Source-of-Truth Confirmation — **{st['status']}**")
    out.append("")
    out.append("| Check | Result |")
    out.append("|---|---|")
    for c in st["checks"]:
        result = c["result"] + (f" — {c['note']}" if c.get("note") else "")
        out.append(f"| {c['check']} | {result} |")

    if f.get("acceptedRisks"):
        out.append("")
        out.append("## 8. Waiver / Accepted Risk Ledger")
        out.append("")
        out.append("| ID | Waived condition | Accepted by | Impact | Confidence impact | Follow-up |")
        out.append("|---|---|---|---|---|---|")
        for r in f["acceptedRisks"]:
            rid = r["ref"] + (f" / {r['risk']}" if r.get("risk") else "")
            accepted = f"{r['acceptedBy']}, {r['date']} (\"{r['rationale']}\")"
            out.append(
                f"| {rid} | {r['condition']} | {accepted} | {r['impact']} "
                f"| {r.get('confidenceImpact') or '—'} | {r.get('followUp') or '—'} |"
            )

    if f.get("debt"):
        out.append("")
        out.append("## 9. Debt Ledger (carried into archive)")
        out.append("")
        out.append("| Item | Reason | Impact | Route |")
        out.append("|---|---|---|---|")
        for d in f["debt"]:
            out.append(f"| {d['item']} | {d['reason']} | {d['impact']} | {d['route']} |")
        out.append("")
        out.append(f"Debt load: **{f.get('debtLoad', '—')}**.")

    out.append("")
    out.append("## 10. Final Verdict")
    out.append("")
    out.append(f"Verdict: **{rec['verdict']}**")
    out.append(
        f"Confidence: **{a['confidence']}** · Evidence coverage: {a['evidenceCoverage']} · "
        f"Assumption load: {a['assumptionLoad']} · Debt load: {f.get('debtLoad', '—')}"
    )
    out.append(
        f"Governance override: **{'used' if gate['governanceOverride'] else 'not used'}** · "
        f"Force waiver: **{'used' if gate['forceWaiver'] else 'not used'}**"
    )
    if rec.get("verdictRationale"):
        out.append("")
        out.append(rec["verdictRationale"].rstrip())

    if rec.get("commentary"):
        out.append("")
        out.append("## 11. Closure Summary")
        out.append("")
        out.append(rec["commentary"].rstrip())

    if rec.get("todoCandidates"):
        out.extend(render_todo_section(rec["todoCandidates"]))
    return out


# --------------------------------------------------------------------------
# Artifact set assembly (--check / --write operate on this)
# --------------------------------------------------------------------------


def render_artifacts(model: Dict[str, Any], hook, only: Optional[str] = None) -> Dict[str, str]:
    """All render targets for this change, keyed by path relative to the change dir."""
    targets: Dict[str, str] = {}
    if only in (None, "change"):
        content, appendices = apply_overflow(render_change_body(model))
        fm = render_frontmatter(model, hook, "change", "\n".join(content))
        targets["change.md"] = "\n".join(fm + [""] + content) + "\n"
        for slug, section in appendices.items():
            fm_a = render_frontmatter(model, hook, "change-artifact", "\n".join(section))
            targets[f"appendix/{slug}.md"] = "\n".join(fm_a + [""] + section) + "\n"
    if only in (None, "lifecycle"):
        targets["lifecycle.md"] = render_lifecycle_md(model, hook)
    if only in (None, "sync-report") and latest(model["records"], "sync"):
        targets["sync-report.md"] = render_sync_report_md(model, hook)
    if only in (None, "archive-report") and latest(model["records"], "archive"):
        targets["archive-report.md"] = render_archive_report_md(model, hook)
    return targets


# --------------------------------------------------------------------------
# Cross-reference validation over rendered output
# --------------------------------------------------------------------------


def validate_cross_refs(rendered: str, model: Dict[str, Any]) -> List[str]:
    errors = []
    known = model["knownRefs"]
    for token in sorted(set(REF_TOKEN_RE.findall(rendered))):
        if token not in known:
            errors.append(f"cross-ref {token} does not resolve to any ledger entry")
    return errors


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def run_check(target_path: str, rendered: str, label: str) -> Tuple[bool, List[str]]:
    if not os.path.isfile(target_path):
        return False, [f"--- {label}: no file on disk at {target_path}"]
    with open(target_path, "r", encoding="utf-8") as fh:
        on_disk = fh.read()
    if on_disk == rendered:
        return True, []
    diff = list(difflib.unified_diff(
        on_disk.splitlines(), rendered.splitlines(),
        fromfile=f"{label} (on disk)", tofile=f"{label} (rendered)", lineterm="",
    ))
    return False, diff


def main(argv: Optional[List[str]] = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252
        sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="chaos:render — deterministic Stage-B artifact renderer.")
    parser.add_argument("changeId")
    parser.add_argument("--root", default=".", help="repository root (default: cwd)")
    parser.add_argument("--check", action="store_true", help="diff rendered output against disk instead of printing")
    parser.add_argument("--write", action="store_true", help="write rendered artifacts to disk (idempotent)")
    parser.add_argument(
        "--only", choices=["change", "lifecycle", "sync-report", "archive-report"],
        help="render a single artifact",
    )
    args = parser.parse_args(argv)
    if args.check and args.write:
        print("error: --check and --write are mutually exclusive", file=sys.stderr)
        return 2

    root = os.path.abspath(args.root)
    hook = load_metadata_hook(root)
    if hook is None:
        # Fall back to the toolkit's own hook when rendering a foreign repo (e.g. the demo worktree).
        here_root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
        hook = load_metadata_hook(here_root)

    model, errors, warnings = build_model(root, args.changeId)
    for w in warnings:
        print(f"warning: {w}", file=sys.stderr)
    if errors:
        for e in errors:
            print(f"error: {e}", file=sys.stderr)
        return 2

    targets = render_artifacts(model, hook, args.only)

    ref_errors = validate_cross_refs("\n".join(targets.values()), model)
    if ref_errors:
        for e in ref_errors:
            print(f"error: {e}", file=sys.stderr)
        return 2

    if args.write:
        for label, rendered in targets.items():
            path = os.path.join(model["changeDir"], label)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            existing = None
            if os.path.isfile(path):
                with open(path, "r", encoding="utf-8") as fh:
                    existing = fh.read()
            if existing == rendered:
                print(f"{label}: unchanged")
            else:
                with open(path, "w", encoding="utf-8", newline="") as fh:
                    fh.write(rendered)
                print(f"{label}: written")
        return 0

    if not args.check:
        for label, rendered in targets.items():
            print(f"===== {label} =====")
            print(rendered, end="")
        return 0

    clean = True
    for label, rendered in targets.items():
        ok, diff = run_check(os.path.join(model["changeDir"], label), rendered, label)
        if ok:
            print(f"{label}: CLEAN")
        else:
            clean = False
            print(f"{label}: {max(0, len(diff) - 2)} diff line(s)")
            for line in diff:
                print(line)
    return 0 if clean else 1


if __name__ == "__main__":
    sys.exit(main())
