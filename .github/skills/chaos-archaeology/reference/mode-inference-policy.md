# Mode Inference Policy

If the user does not pass a mode, infer mode from risk.

## Infer `--light`

- docs-only or test-only request;
- small localized code area;
- no persistence, external side effects, or public contract impact;
- user asks for a quick look or orientation.

## Infer `--standard`

- existing feature or flow;
- normal API/application change;
- module-level behaviour;
- moderate uncertainty;
- persistence exists but is not critical/high-risk.

## Infer `--strict`

- external side effects;
- DB writes, migrations, table ownership;
- auth/security;
- replay/idempotency;
- offline behaviour;
- API compatibility;
- brownfield migration slice;
- conflicting evidence;
- user asks for cutover/migration safety.

## UX

Show inference and ask for confirmation when risk is high:

```md
Mode inferred: --strict

Reason:
- Topic appears to involve external side effects.
- Existing persistence behaviour must be preserved.
- ADR-0010 / ADR-0012 concerns may apply.

Options:
1. Continue with strict
2. Downgrade to standard and record rationale
3. Narrow scope
4. Stop
```
