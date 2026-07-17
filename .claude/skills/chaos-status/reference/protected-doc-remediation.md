
# Protected Documentation Drift Remediation — chaos:status

`chaos:status` treats `AGENTS.md` / `AGENT.md` and root `README.md` as **protected-but-editable** governance entrypoints.

Protected means:

- never edit silently;
- always detect drift;
- always show the proposed patch or rewrite plan before writing;
- always require explicit human confirmation unless the command is running in report-only mode;
- always record the decision in `.chaos/status-report.md`.

Protected does **not** mean immutable.

## Files in scope

- `AGENTS.md` — preferred multi-agent repository entrypoint.
- `AGENT.md` — legacy/singular variant; if both exist, report a drift finding and recommend consolidating to `AGENTS.md` unless the repository deliberately uses both.
- `README.md` — root human-facing repository entrypoint.

## Drift categories

`chaos:status` must detect and classify:

```text
PROTECTED_DOC_MISSING
PROTECTED_DOC_STALE
PROTECTED_DOC_CONFLICT
PROTECTED_DOC_BLOATED
PROTECTED_DOC_UNLINKED
PROTECTED_DOC_COMMAND_DRIFT
PROTECTED_DOC_RULE_GATE_DRIFT
PROTECTED_DOC_CONFIG_DRIFT
PROTECTED_DOC_README_HONESTY_DRIFT
```

## Required drift checks

### `AGENTS.md` / `AGENT.md`

Check whether the agent entrypoint:

- points to `.chaos/config.yaml` when present;
- points to `.chaos/context.md`, `.chaos/architecture.md`, `.chaos/constitution.md`;
- points to `.chaos/decisions/index.md`, `.chaos/rules/index.md`, `.chaos/commands/index.md`, `.chaos/gates/index.md`;
- does not duplicate all ADR/rule content;
- does not hardcode stale ranges such as `R-001…R-018` when the rules index has more rules;
- does not hardcode stale ranges such as `G-01…G-07` when the gates index has more gates;
- reflects installed command families when it summarizes command availability;
- tells agents to inspect indexes as source of truth instead of trusting stale summaries;
- reflects protected-file edit policy accurately.

### `README.md`

Check whether the root README:

- points humans to the CHAOS workspace;
- points to `.chaos/status-report.md`;
- does not invent setup/build/test commands;
- does not claim obsolete command counts or stale rule/gate ranges;
- distinguishes generated project docs from authoritative code/build docs;
- explains that `AGENTS.md` / `README.md` can be patched by `chaos:status` or `chaos:sync` only with patch preview and confirmation.

## Remediation behaviour

When drift is detected, `chaos:status` must include a remediation prompt.

Options:

```text
1. Patch protected doc now
2. Rewrite protected doc from current CHAOS indexes
3. Create remediation plan only
4. Defer with rationale
5. Mark accepted drift/risk
6. Do nothing
```

## Patch vs rewrite

Use a focused patch when the file is mostly correct and only stale references changed.

Use a rewrite recommendation when:

- the file is generated and heavily stale;
- command/rule/gate summaries contradict current indexes;
- the file duplicates large governance content;
- multiple protected-doc drift findings affect the same file.

A rewrite must preserve useful user-authored repository-specific content when identifiable. If preservation is uncertain, propose a patch or ask for confirmation before overwriting.

## Protected-file policy interaction

If `.chaos/config.yaml` says the file is protected or disallows direct edits, `chaos:status` must not stop at “blocked”. It must show the proposed patch and ask the user to choose:

```text
1. Apply once with protected-doc override and rationale
2. Update config policy to allow confirmed status/sync edits
3. Defer with rationale
4. Mark accepted drift
5. Stop
```

A protected-doc override is allowed only after explicit confirmation and must be recorded in the status report.

## Report requirements

The status report must include:

- protected documentation drift findings;
- proposed file changes summary;
- whether patch or rewrite was recommended;
- user decision;
- whether a protected-doc override was used;
- confidence impact if drift remains.
