# Material Decision Protocol

Any command that asks the user to choose between **material** alternatives must create
a runtime decision instead of asking an ordinary chat question.

## What counts as material

Approve/reject a proposal; choose an execution profile; approve a risky write; decide
whether to continue after failed validation; approve scope expansion; resolve
conflicting evidence; decide archive/sync promotion; accept/reject a waiver; select a
todo import/write mode; choose a repair action when diagnostics found blockers;
**authorize a repo-wide or owner/maintainer-gated operation** (e.g. the
`chaos:sync --all` maintainer/repo-owner confirmation).

These must go through `chaos_create_decision` (→ Decision Center), **not** an ad-hoc
in-chat yes/no — that is the whole point of the runtime. The only exception is when
command integration is disabled or the runtime is unavailable (see
`fallback-protocol.md`).

## Steps

1. **Build the decision payload**: `commandRunId`, `changeId`, `sourceCommand`,
   `title`, `context`, `interactionType` (see "Choosing the interaction type"),
   `options`, `recommendedOptionId` (if any), `requiresRationale` (if needed),
   `independent` flag, `metadata`.
2. **Call `chaos_create_decision`** (MCP preferred).
3. **If the result has `mustStop: true`:**
   - STOP immediately. Do not continue the command.
   - Tell the user the decision is waiting in the Decision Center.
   - Include the `decisionId` and a resume instruction
     (`chaos:resume --run <commandRunId>`) when available.
4. Do **not** ask the same decision as an ordinary chat question unless the runtime is
   unavailable and `fallback-protocol.md` explicitly allows it, or command integration
   is disabled by config (`command-preflight-protocol.md` Step 0).
5. Do **not** decide on the user's behalf.
6. Do **not** continue execution after creating a pending decision.

## Choosing the interaction type

Set `interactionType` so the Decision Center renders the right control and the runtime
validates the right answer. Omitted → `single-choice-decision`. Pick the **narrowest**
type that fits; do not shoehorn a yes/no into a single-choice list, or a "select several"
into repeated single decisions.

- **single-choice-decision** (default) — the human picks exactly one option (radios).
  Use for: execution profile; "add now / amend first / defer / accept-risk / stop";
  conflict resolution with named resolutions.
- **confirmation** — a yes/no gate; provide exactly two options (e.g. `confirm` / `deny`).
  Use for: repo-wide / owner-gated authorizations (the `chaos:sync --all`
  maintainer/repo-owner confirmation); "proceed with this risky write?";
  archive-with-debt approval.
- **multi-choice-decision** — the human selects one or more options (checkboxes); answer
  is `selectedOptionIds`. Use for: "which of these N items to include / import / close";
  selecting a subset of findings, todos, or waivers to act on.
- **freeform-input** — the human types a value; the answer is the text
  (`freeformValue`), not an option. `options` may be omitted (a placeholder is supplied).
  Use for: "provide the missing connection string / owner / value"; a short value that is
  itself the answer. `requiresRationale` is separate — set it only if you also need a
  reason alongside the typed value.

Authoring: pass `interactionType` to `chaos_create_decision` (MCP) or `--interaction-type`
to the runtime CLI `create-decision` fallback. The Decision Center renders and validates
all four; the human answers there as usual.

## Batching

How many decisions to create before stopping is governed by
`reference/decision-batching-policy.md`
(`policies.interactionRuntime.commands.decisionBatching`): `sequential` stops on the
first decision; `batch-independent` (default) creates every **independent** material
decision known up front, then stops once so they can be answered together. Dependent
decisions still require a later round. Creating more *independent* decisions after a
`mustStop` is allowed; *continuing execution* past them is not.

## Idempotency

The runtime suppresses duplicate equivalent decisions (`PENDING_DECISION_EXISTS`) and
still returns `mustStop: true`. Treat that identically to a fresh
`WAITING_FOR_USER_DECISION`: stop and route the user to the Decision Center.

## Diagnostics coherence

A created-but-unanswered decision is exactly what Iteration 7's decision probe counts
as a pending decision, and it holds a change lock. Stopping is what keeps
`chaos:doctor` / `chaos:status` accurate. Continuing past it is a
`continued-after-must-stop` violation the advisory hook guard will record.
