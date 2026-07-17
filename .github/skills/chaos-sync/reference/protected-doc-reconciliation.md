
# Protected Documentation Reconciliation — chaos:sync

`chaos:sync` may update or rewrite `AGENTS.md` / `AGENT.md` and root `README.md` as first-class governance reconciliation targets.

These files are **protected-but-editable**:

- protected from silent edits;
- editable after chat-visible dashboard, one-by-one decision, patch preview, and explicit confirmation;
- auditable through `.chaos/sync-reports/*`.

Protected does not mean immutable.

## Files in scope

- `AGENTS.md` — preferred agent-facing entrypoint.
- `AGENT.md` — legacy/singular variant; reconcile only if present or explicitly configured.
- `README.md` — root human-facing repository entrypoint.

## What sync may reconcile

### Agent entrypoint drift

- stale rule ranges;
- stale gate ranges;
- stale command availability summaries;
- missing references to `.chaos/config.yaml`;
- missing references to current command indexes;
- missing protected-file edit policy;
- contradiction between installed Copilot artifacts and documented command surface;
- singular `AGENT.md` vs plural `AGENTS.md` ambiguity.

### README drift

- stale command list;
- stale rule/gate ranges;
- missing link to CHAOS workspace;
- missing link to `.chaos/status-report.md`;
- invented setup/build/test commands;
- generated README claims that are no longer true;
- missing note that `chaos:status` / `chaos:sync` can patch protected docs with confirmation.

## Dashboard requirement

The chat-first dashboard must include protected-doc drift:

```md
AGENTS.md / AGENT.md drift: <none|minor|major|blocked-by-policy>
README.md drift: <none|minor|major|blocked-by-policy>
Protected-doc updates suggested: <n>
Protected-doc rewrite suggested: <yes/no>
```

## Runtime reconciliation loop

Handle protected documentation decisions one by one.

```text
Protected doc issue <i>/<n>: <title>
File: AGENTS.md | AGENT.md | README.md
Drift type: <type>
Recommended action: patch | rewrite | defer
Why it matters: <impact>

Options:
1. Apply recommended patch
2. Rewrite file from current CHAOS indexes
3. Show/edit custom patch
4. Defer with rationale
5. Mark accepted drift
6. Stop sync
```

## Patch preview

Before writing, show:

```md
## Protected Documentation Patch Preview

Will update:
- AGENTS.md
- README.md

Change summary:
- Replace hardcoded rule/gate ranges with index-source wording.
- Add `chaos:retro` to workflow command list.
- Add protected-but-editable policy note.

Protected-doc policy:
- Requires explicit confirmation: yes
- Override required: <yes/no>
- Rationale: <if override>
```

## Config policy interaction

If `.chaos/config.yaml` currently blocks edits to `AGENTS.md` or `README.md`, `chaos:sync` must still offer reconciliation.

Options:

```text
1. Apply once with protected-doc override and rationale
2. Update config policy to allow confirmed status/sync edits
3. Defer with rationale
4. Mark accepted drift
5. Stop sync
```

`--yes` cannot bypass this decision.

## Rewrite rules

A rewrite is allowed only if:

- the user explicitly selects rewrite;
- a preview is shown;
- useful custom content is preserved where identifiable;
- the sync report records the source indexes used to generate the replacement.

If preservation is uncertain, prefer patching or ask the user to confirm overwrite.

## Post-sync consistency checks

After protected-doc updates, verify:

- referenced `.chaos/*/index.md` files exist;
- documented command names match `.chaos/commands/index.md` or installed artifacts;
- documented rule/gate counts/ranges do not contradict current indexes;
- README does not invent unverified build/test commands;
- `AGENTS.md` remains a router, not a bloated duplicate knowledge base.

If checks cannot be confirmed, final verdict cannot be clean `SYNC_APPLIED`; use `SYNC_APPLIED_BUT_UNCONFIRMED` or `SYNC_APPLIED_WITH_DEBT`.
