# Change-Scope, Roles & Repository-Wide Reconciliation — chaos:sync

`chaos:sync` distinguishes **contributor-safe** sync from **maintainer-level** and
**repo-owner-only** sync. This protects shared governance while multiple developers
work on different OpenSpec changes in the same sprint.

Canonical contract: `.chaos/changes/README.md`. Machine-readable form:
`.chaos/config.yaml` (`policies.sync`, `policies.artifactNaming`, `policies.changeArtifacts`).

## 1. Role model

| Role | Allowed scopes | Output |
|---|---|---|
| **Developer-safe** | `chaos:sync --change <change-id>` | `.chaos/changes/<change-id>/sync-report.md` |
| **Maintainer-level** | `--since <ref>`, `--adrs`, `--rules`, `--gates`, `--agents` | `.chaos/sync-reports/<scope-or-date>-sync-report.md` |
| **Repo-owner-only** | `--all` | `.chaos/sync-reports/repo-sync-YYYY-MM-DD.md` |

### `chaos:sync --change <change-id>` (contributor-safe)

- Reconciles **only** the specific change folder `.chaos/changes/<change-id>/`.
- Writes `.chaos/changes/<change-id>/sync-report.md`.
- May reconcile that change's decision events, lifecycle manifest, and OpenSpec
  state for the change.
- Must **not** silently edit shared governance (ADRs, decision logs, rules, gates,
  indexes, `AGENTS.md`, `README.md`). It may *recommend* promotions and route them to
  a maintainer-level / repo-owner sync.

### Maintainer-level scopes

- `--since <ref>`, `--adrs`, `--rules`, `--gates`, `--agents` may update the shared
  governance area they name, but only after patch preview and explicit confirmation.

### `chaos:sync --all` (repo-owner-only)

- Repository-wide governance reconciliation, run after one or more feature branches
  merge into `main`.
- Writes `.chaos/sync-reports/repo-sync-YYYY-MM-DD.md`.
- Responsible for detecting and reconciling: duplicate IDs, conflicting governance
  promotions, stale indexes, ADR/rule/gate drift, `AGENTS.md` drift, `README.md`
  drift, and archaeology index drift.

## 2. `--all` maintainer confirmation gate

Before running repository-wide reconciliation, show the chat-first dashboard and ask:

```text
chaos:sync --all is a repository-wide governance reconciliation command.
It may update shared CHAOS governance artifacts such as decisions, rules, gates,
AGENTS.md, README.md, ADR drafts, and decision logs.

Are you acting as the repository owner or designated CHAOS maintainer?

1. Yes, continue and record maintainer confirmation.
2. No, switch to chaos:sync --change <change-id>.
3. Dry-run only.
4. Stop.
```

- In `--strict` mode, lack of maintainer confirmation **blocks** repository-wide sync.
- In `--dry-run` mode, no maintainer confirmation is required (no files change).
- Record the maintainer confirmation (or its absence) in the sync report.
- `--yes` must not bypass the maintainer confirmation gate.

## 3. Artifact-naming & index promotion policy

`chaos:sync` promotes date-prefixed, slug-based drafts into indexes and assigns
**display-only** sequential IDs there:

- Physical filenames stay date-prefixed and slug-based:
  - `docs/adr/YYYY-MM-DD-<slug>.md`
  - `docs/decision-log/YYYY-MM-DD-<slug>.md`
  - `.chaos/rules/YYYY-MM-DD-<slug>.md`
  - `.chaos/gates/YYYY-MM-DD-<slug>.md`
- Sequential display IDs (`ADR-0015`, `R-022`, `G-010`) are assigned/normalized only
  when `chaos:sync` promotes or updates the relevant index.
- Never create a new physical artifact whose primary filename is a sequential ID.

## 4. Duplicate sequential-ID reconciliation (one by one)

When `--all` detects duplicate sequential index IDs, resolve them one at a time:

```text
Duplicate rule ID detected: R-021.

Candidate A:
R-021 — Test assertion library policy

Candidate B:
R-021 — External sync retry policy

Recommended action:
Keep test assertion library policy as R-021 and assign external sync retry policy to R-022.

1. Accept recommendation.
2. Swap numbering.
3. Provide custom numbering.
4. Defer with sync debt.
5. Stop.
```

The same one-by-one loop applies to `ADR-NNNN` and `G-NN` display IDs. Deferred
duplicates are recorded in the Sync Debt Ledger.

## 5. Legacy compatibility

`chaos:sync` may READ legacy scattered report folders (`.chaos/reviews/`,
`.chaos/apply-reports/`, `.chaos/verification/`, `.chaos/archive-reports/`,
`.chaos/retros/`, `.chaos/proposals/`, `.chaos/approvals/`) for compatibility. It must
not migrate them as part of normal reconciliation; it may surface a legacy-layout
finding and recommend a future migration task.
