# chaos:todo

Run the CHAOS Todo Curator — scan CHAOS evidence, extract and deduplicate actionable work, and
maintain the durable todo backlog plus static HTML digest views.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.claude/skills/chaos-shared/reference/model-robustness-policy.md` and
`.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve `paths.todo`/`paths.todoItems`/
  `paths.todoViews` and `policies.todo.*` from config before defaults.
- Scan evidence before writing anything.
- Require source evidence for every durable todo item — no evidence-free items.
- Dedupe candidates before writing or updating any item.
- Ask one material decision at a time. **After presenting a decision, STOP. Do not continue
  until the user selects an option.** When the interaction runtime is enabled, route it
  through the runtime → the Decision Center (not an ad-hoc chat prompt); see the
  "Interaction Runtime Obligations" section below.
- Attempt to use native interactive selection UI when the Claude Code runtime exposes it. If
  no explicit UI affordance is available, use the numbered decision block fallback. The
  fallback is compliant only if the command stops after presenting the options.
- Do not modify production code, tests, migrations, OpenSpec implementation content, ADR
  decisions, decision logs, rules, gates, `AGENTS.md`, or root `README.md`.
- Write durable todo item files only under the configured todo paths
  (`.chaos/todo/items/*.md`, `.chaos/todo/index.md`).
- Generate static HTML views for human digest reports — never Markdown digest reports.
  Generated HTML views are not source of truth; Markdown item files are.
- Do not use sequential IDs as physical item filenames — date-prefixed slugs only.

### Sonnet-safe execution checklist

- [ ] Config read; todo paths/policies resolved?
- [ ] Existing index/items read before any new scan?
- [ ] Evidence sources scanned per mode (light = shallow, standard = normal, strict = full +
      stale audit)?
- [ ] Candidates deduplicated before any write?
- [ ] Dashboard shown before any write decision?
- [ ] Write decision asked (and maintainer confirmation for repository-level writes), stopping
      after each?
- [ ] Durable items written only under `.chaos/todo/items/` with date-prefixed slugs?
- [ ] HTML views regenerated (not hand-edited), self-contained, escaped, no external assets?

## Usage

```text
/chaos-todo [--light|--standard|--strict]
/chaos-todo --scan
/chaos-todo --next
/chaos-todo --from-roadmap
/chaos-todo --from-audit <path>
/chaos-todo --from-change <change-id>
/chaos-todo --target <target>
/chaos-todo --priority <priority>
/chaos-todo --status <status>
/chaos-todo --type <type>
/chaos-todo --write
/chaos-todo --dry-run
/chaos-todo --dedupe
/chaos-todo --refresh
/chaos-todo --close <todo-id>
/chaos-todo --reopen <todo-id>
/chaos-todo --update <todo-id>
```

## Behaviour

Delegate to the `chaos-todo-curator` agent and the `chaos-todo` skill.

The command must:

1. Resolve config, mode, and invocation intent.
2. Read the existing todo index and item files first.
3. Scan evidence sources appropriate to the mode.
4. Extract and deduplicate todo candidates (including any "Todo Candidates" sections emitted
   by other commands' reports).
5. Show the CHAOS Todo Dashboard in chat before any write decision:

   ```text
   ## CHAOS Todo Dashboard

   Open blockers: <n>
   Public-alpha blockers: <n>
   v1 blockers: <n>
   Stale items: <n>
   Duplicate candidates: <n>
   Items needing owner decision: <n>

   Recommended next:

   1. <item>
   2. <item>
   3. <item>

   Write/update todo backlog and HTML views?

   1. Yes, write proposed updates
   2. Dry-run only
   3. Show details
   4. Stop
   ```

6. **STOP** after presenting this decision.
7. On confirmed write, create/update/close/reopen item files, update the index, and regenerate
   the affected static HTML views.
8. Recommend the next command.

## Default behaviour

No flags → read-first and safe: read existing state, show the dashboard, ask before writing.
Never deep-scans or writes without the dashboard being shown first.

## Modes

- `--light` — read existing index/current status/doctor only; show blockers/next actions; no
  deep scan; no writes unless explicitly confirmed or `--write`.
- `--standard` (default) — scan normal evidence sources; dedupe; propose creation/update/
  closure; write only after confirmation or `--write`.
- `--strict` — scan all configured sources; validate every open todo still has source evidence;
  detect stale/duplicate/orphaned items and findings without todos; require maintainer
  confirmation for repository-wide writes; block unsafe global writes without confirmation.

## Required references

```text
.claude/skills/chaos-todo/SKILL.md
.claude/skills/chaos-todo/reference/todo-command-contract.md
.claude/skills/chaos-todo/reference/todo-source-contract.md
.claude/skills/chaos-todo/reference/todo-candidate-contract.md
.claude/skills/chaos-todo/reference/todo-deduplication-policy.md
.claude/skills/chaos-todo/reference/todo-item-schema.md
.claude/skills/chaos-todo/reference/todo-status-model.md
.claude/skills/chaos-todo/reference/todo-write-policy.md
.claude/skills/chaos-todo/reference/todo-roadmap-bridge.md
.claude/skills/chaos-todo/reference/todo-config-contract.md
.claude/skills/chaos-todo/reference/todo-report-template.md
.claude/skills/chaos-todo/reference/todo-html-view-contract.md
.claude/skills/chaos-todo/reference/todo-html-template.md
```

## Contributor vs maintainer-sensitive

Contributor-safe: `chaos:todo`, `chaos:todo --next`, `chaos:todo --from-change <id>`,
`chaos:todo --scan --dry-run`, `chaos:todo --from-change <id> --write`.

Maintainer-sensitive (repository-level writes): `chaos:todo --from-roadmap --write`,
`chaos:todo --dedupe --write`, `chaos:todo --close <todo-id>` for a repository-level todo,
repository-wide `chaos:todo --refresh`. For these, ask:

```text
Decision required: Repository-level todo update

Context:
This operation may update repository-level todo items, indexes, and generated HTML views.

Recommended option:
1. Continue only if you are acting as repository owner or designated CHAOS maintainer.

Options:
1. Yes, continue and record maintainer confirmation.
2. Switch to dry-run only.
3. Limit to a specific change id.
4. Stop.

Select one option to continue.
```

**STOP** after presenting this decision.

## Output

```text
.chaos/todo/items/YYYY-MM-DD-<slug>.md     # durable source of truth (Markdown)
.chaos/todo/index.md                       # durable repository index (Markdown)
.chaos/todo/views/index.html               # generated digest (static HTML)
.chaos/todo/views/public-alpha.html
.chaos/todo/views/v1.html
.chaos/todo/views/open-blockers.html
.chaos/todo/views/by-type.html
.chaos/todo/views/by-change.html           # optional
.chaos/todo/todo-report-YYYY-MM-DD.html    # dated snapshot digest
```

## Forbidden

- Editing production code, tests, migrations, OpenSpec implementation content, ADR decisions,
  decision logs, rules, gates, `AGENTS.md`, or root `README.md`.
- Creating durable items without resolvable source evidence.
- Writing without deduplication having run first.
- Markdown digest reports (human digests are HTML only).
- Sequential-ID physical item filenames.
- Remote GitHub Issues / Azure Boards export, or GitHub/Azure work-item synchronization.
- Mutating existing roadmap items or other CHAOS reports (reference only).
- Silent repository-level writes without the maintainer confirmation decision.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol**
(`.claude/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:todo`
- `chaos:todo --dry-run` is read-only and lock-compatible; a durable write is not.
- Consume **Todo Candidates** emitted by Iteration 7 diagnostics (`chaos:doctor` /
  `chaos:status`) and other commands' reports as an additional source.
- Preflight: `chaos_begin_command`; honour `mustStop: true`. Do NOT write durable todo
  items for a change that has a pending material decision in the interaction runtime,
  unless the write is explicitly compatible/read-only.
- Material decisions (via `chaos_create_decision`, then STOP): durable write vs defer;
  import mode selection; dedupe-conflict resolution when materially ambiguous.
