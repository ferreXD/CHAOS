# `chaos:propose` Mode Reference

## Default mode

If no mode is supplied, infer the mode from risk and relevance.

Default inference:

- `--light` for documentation-only, small isolated, low-risk, non-behavioural proposals.
- `--standard` for normal product/backend/frontend/mobile/workflow changes.
- `--strict` for brownfield, data, auth/security, external side effects, offline/replay, deployment/cutover, architecture, or customer-visible behavioural changes.

The command must show the inferred mode and rationale before final proposal generation.

Example:

```text
Mode inferred: --strict
Reason:
- Change touches persistence.
- Change affects existing business behaviour.
- ADR/rule alignment is required.

Options:
1. Continue with --strict
2. Downgrade to --standard and record rationale
3. Stop
```

## `--light`

**Light is a collapsed path, not relaxed validation** (see "Light mode: collapsed FRAME workflow"
in `SKILL.md` and `docs/design/2026-07-24-artifact-model-roadmap.md`). It preserves every material
decision, the human's decision weight, green tests, and the full OpenSpec set; it cuts the
narrative ceremony (no proposal-report, no separate review/approval artifacts, one human stop).

Use for:

- documentation-only changes;
- isolated low-risk new capability;
- exploratory spike notes;
- small internal improvement with no behaviour or architecture impact.

Behaviour:

- Scoped evidence scan (files the intent names + rules index + architecture posture; no
  repo-wide sweeps).
- Ask at most three clarification questions unless the request is unsafe or ambiguous.
- One recommended approach; compact Approach Alignment Checkpoint.
- Full OpenSpec set (unchanged in every mode).
- Output = `change.md` + lean decision entries + `lifecycle.md` stub + capsule
  (`chaos-shared/reference/change-template.md`), then STOP for the human.
- `chaos:review` is not part of the light path — the Review line in `change.md` records the
  inline self-review; next command after answers is `chaos:apply`.

Cannot stay light — **auto-escalate to `--standard` without asking** (announce, `⚠ escalated`
line, `escalatedFrom` metadata, `ESC-*` entry, reuse all FRAME output) — if the change:

- crosses an architecture non-goal or posture boundary (persisted data, auth/security, external
  side effects, existing business behaviour, offline/replay/idempotency, deployment/cutover);
- surfaces more than `modes.light.maxMaterialDecisions` material decisions (config, default 2);
- fails the inline self-review checklist;
- hits OpenSpec-unavailable degraded mode.

Never downgrade automatically.

## `--standard`

Use for normal product/backend/frontend changes.

Behaviour:

- Discover sources.
- Classify change and risk.
- Load relevant ADRs/rules/context.
- Load archaeology when relevant and available.
- Produce 2–3 approaches.
- Require Approach Alignment Checkpoint.
- Generate OpenSpec change artefacts when available.
- Produce CHAOS proposal report.
- Recommend `chaos:review` before implementation.

## `--strict`

Use for:

- brownfield migration;
- architecture changes;
- security/auth;
- external side effects;
- offline/replay/idempotency;
- deployment/cutover;
- high-impact data access/schema changes;
- regulated/compliance-sensitive workflows.

Behaviour:

- Exact source manifest required.
- Missing ADRs/rules/archaeology must be called out.
- Brownfield work requires archaeology unless explicitly waived.
- Proposed ADRs must not be treated as accepted unless CHAOS workspace or user confirms that posture.
- OpenSpec validation must be requested or run if possible.
- Proposal cannot be marked ready if blocking evidence gaps remain.
- `chaos:review` is mandatory before implementation.

## Mode escalation

- **`--light` → `--standard` is automatic** (the valve — see the `--light` section): never ask,
  always announce and record (`⚠` line, `escalatedFrom`, `ESC-*` entry), reuse all FRAME output.
- **→ `--strict`** (from light or standard) remains confirm-based when strict-class risk is
  detected:

```text
The change touches ERP finalization (strict-class risk).
Escalating to --strict is recommended.
Proceed as strict? [yes/no/waive]
```


## Runtime decision behaviour by mode

| Mode | Missing decisions / context |
|---|---|
| `--light` | Ask only high-impact questions. Allow deferral or accepted risk for non-critical gaps. Record remaining items as assumptions/deferred questions. |
| `--standard` | Ask material questions one by one. If no direct blocker exists, allow continuation after recording user decision, accepted risk, or deferral rationale. |
| `--strict` | Blocking/material decisions must be resolved before the proposal can be marked ready. Deferral is allowed only if final status reflects not-ready/blocked. |

Open questions must not be emitted by default. Ask the user to resolve them first unless non-interactive execution or explicit deferral applies.
