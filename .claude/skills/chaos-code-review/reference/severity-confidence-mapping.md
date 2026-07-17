# Severity & Confidence Mapping — chaos:code-review

The `code-reviewer` driver uses `CRITICAL | HIGH | MEDIUM | LOW | NIT`. CHAOS governance uses
`BLOCKING | MAJOR | MINOR | ADVISORY` plus knowledge type and confidence. Map every material
finding into the CHAOS classification so the review is auditable and gate-ready.

## Severity mapping

| Driver severity | CHAOS severity | Notes |
|---|---|---|
| `CRITICAL` | `BLOCKING` | Always blocks `CODE_READY`. |
| `HIGH` | `MAJOR` (→ `BLOCKING` in `--strict` when it affects correctness, security, or data integrity) | |
| `MEDIUM` | `MINOR` | May become `MAJOR` if it compounds risk. |
| `LOW` | `ADVISORY` | |
| `NIT` | `ADVISORY` | Style/nit; never blocks. |

## Knowledge type (CHAOS constitution)

Classify each material finding:

`FACT | INFERENCE | ASSUMPTION | UNKNOWN | CONFLICT`

- `FACT`: verified in the code/diff with a citable file/line.
- `INFERENCE`: reasoned from evidence but not directly proven.
- `ASSUMPTION`: depends on unseen runtime/behaviour; label it.
- `UNKNOWN`: cannot be determined from available evidence.
- `CONFLICT`: code contradicts `AGENTS.md`, a project skill, an ADR, or a rule.

Never present inference as fact. Never invent line numbers, files, rules, or skill contents.

## Confidence

`HIGH | MEDIUM | LOW`. Cap confidence (and explain why) when:

- `AGENTS.md` is missing or a mandatory skill is unavailable;
- only partial diffs are available;
- tests are unavailable or were not run;
- line numbers cannot be verified;
- the finding depends on unseen runtime behaviour.

## Verdicts

Use exactly one:

- `CODE_READY` — no BLOCKING findings; MAJOR findings (if any) explicitly waived/accepted.
- `CODE_READY_WITH_CONDITIONS` — proceed only with listed conditions; MAJOR findings open.
- `NEEDS_REMEDIATION` — BLOCKING/MAJOR findings must be fixed (route to `chaos:apply`).
- `BLOCKED` — cannot proceed (e.g., unresolved CONFLICT against governance).
- `INSUFFICIENT_AUTHORITY` — `AGENTS.md`/mandatory skills missing and not provided; review
  capped or not performed.

Every verdict includes overall confidence, evidence coverage
(`COMPLETE | PARTIAL | WEAK`), and assumption load (`LOW | MEDIUM | HIGH`).
