# chaos:status Remediation Model

## Interactive remediation behaviour

`chaos:status` is primarily an audit command, but it must not stop at passive reporting when a foundational concern is missing.

After producing the status report, if it detects missing or weak foundational concerns such as absent confidence/knowledge classification, missing source inventory discipline, missing command status, missing gate evidence requirements, or missing/partial/stale/conflicting `.chaos/config.yaml`, it must ask the user how to proceed unless `--no-interactive` is supplied.

Allowed remediation choices:

1. `Fix now` — apply a focused patch to the relevant CHAOS files.
2. `Create remediation plan` — write a remediation item to `.chaos/status-report.md` without changing files.
3. `Defer with rationale` — record the deferral and rationale in the report.
4. `Mark accepted risk` — record that the human owner accepts the governance risk.
5. `Do nothing` — leave files unchanged.

The command must never silently modify governance files. It may only patch files after explicit user confirmation.

For missing confidence/knowledge classification, the default proposed fix is to update `.chaos/constitution.md` with the Confidence and Knowledge Classification Doctrine and, where appropriate, add a corresponding operational rule to `.chaos/rules/index.md` and gate requirement to `.chaos/gates/index.md`.

For missing/partial/stale/conflicting config, the default proposed fix is to create or patch `.chaos/config.yaml` from detected repository conventions and the canonical config contract. The command must show the patch or generated config before writing. It must not add architectural decisions, secrets, credentials, connection strings, hidden approval switches, or giant prompt/rule bodies.

Config remediation choices:

1. `Fix now` — create or patch `.chaos/config.yaml` after explicit confirmation.
2. `Create remediation plan` — record required config work in `.chaos/status-report.md`.
3. `Defer with rationale` — record why config adoption/repair is deferred.
4. `Mark accepted risk` — record that the human owner accepts config drift.
5. `Do nothing` — leave files unchanged.

If config contains suspected secrets, the safe default is to report and ask for manual cleanup or an explicit redaction patch. Never echo secret-like values in full in the report.

## Toolchain remediation behaviour

If `chaos:status` detects missing or invalid required tools, it must offer remediation one tool at a time. Tool commands should come from `.chaos/config.yaml` when present, otherwise use CHAOS defaults.

Allowed choices for each missing/invalid tool:

1. `Install now, if safe and supported`
2. `Show manual install instructions`
3. `Continue in degraded mode`
4. `Defer with rationale`
5. `Abort command`

Installation safety rules:

- Never install silently.
- Show the exact command before running it.
- Ask for explicit confirmation before every install command.
- Do not run elevated/admin/sudo commands unless explicitly approved.
- If command execution is unavailable, mark tool status as `UNKNOWN` and provide manual instructions.
- For OpenSpec, install only after Node.js and npm pass. The default command is:

```bash
npm install -g @fission-ai/openspec@latest
```

Missing OpenSpec should mark OpenSpec-dependent commands as not ready unless the user explicitly defers or the repository does not use OpenSpec.

## Protected documentation remediation behaviour

If `chaos:status` detects drift in `AGENTS.md` / `AGENT.md` or root `README.md`, it must offer protected documentation remediation.

Allowed choices:

1. `Patch protected doc now` — apply a focused patch after preview and confirmation.
2. `Rewrite protected doc now` — rewrite from current CHAOS indexes after preview and confirmation.
3. `Create remediation plan` — record work in `.chaos/status-report.md` without changing files.
4. `Defer with rationale` — record deferral and rationale.
5. `Mark accepted drift/risk` — record accepted governance drift.
6. `Do nothing` — leave files unchanged.

Protected file policy must be respected as an interaction policy, not an immutability rule. If config blocks edits, show the patch anyway and ask for one-time protected-doc override, config policy update, deferral, accepted drift, or stop.

Never edit protected documentation silently. Never use `--yes` or implied consent for protected documentation changes.
