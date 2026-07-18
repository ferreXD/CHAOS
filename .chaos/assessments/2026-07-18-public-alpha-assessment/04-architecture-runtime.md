# 04 — Architecture, runtime, and Decision Center

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown
Classification scale: Strong foundation · Good public-alpha compromise · Acceptable technical debt · Needs attention before beta · Needs redesign before v1 · Fundamental risk

## 4.1 Package inventory (all Observed; tests were executed)

| Package | src LOC | test LOC | Runtime deps | Tests | Result |
|---|---:|---:|---|---:|---|
| `tools/chaos-interaction-runtime` | 3,096 | 1,052 | none | 45 | **43 pass / 2 FAIL** (missing `.chaos/interactions/examples/` fixture — never committed; fresh clone cannot pass) |
| `tools/chaos-interaction-mcp` | 1,690 | 845 | `@modelcontextprotocol/sdk`, `zod` | 38 | 38 pass |
| `tools/chaos-interaction-runner` | 3,258 | 1,315 | none | 69 | 69 pass |
| `tools/chaos-interaction-diagnostics` | 2,666 | 1,088 | none | 65 | 65 pass |
| `extensions/chaos-decision-center` | 2,612 | 835 | none | 49 | 49 pass |
| `tools/chaos-todo-views` / `chaos-parity-check` | 832 / 301 | — | none | 0 | n/a (small, deterministic, well-commented) |
| **Total** | **~13.6k** | **~5.1k** | | **266** | **264 pass / 2 fail (99.2%)** |

All packages: `private: true`, version 0.1.0, unpublished; buildless execution via Node ≥22.6 type-stripping; strict tsconfig (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`).

## 4.2 State model (Observed)

Entities under `.chaos/interactions/`: **sessions** (`sessions/<commandRunId>.json`), **decisions** (`decisions/<id>/decision.json` + `response.json` + per-decision `audit.jsonl`), **locks** (single aggregate `locks.json`), **resume capsules** (`capsules/<commandRunId>.json`), global append-only `audit.jsonl`, derived `active.json`/`index.json` recomputed after every mutation, **runner leases** (`runners/<runnerId>.json`).

State machines are explicit adjacency tables enforced centrally (`InvalidStateTransitionError`): sessions `created → running → waiting-for-decision → ready-to-resume → resumed → running` with terminals `completed/cancelled/expired/failed` plus two documented administrative edges (`ready-to-resume → completed/cancelled`); decisions `created → waiting → answered → consumed` with `cancelled/expired/superseded`. Every artifact carries `schemaVersion: 1` validated on write against JSON Schemas in `.chaos/interactions/schema/`. **No migration code exists anywhere** (grep verified). → Version field: Strong foundation; migration story: **Needs attention before beta** the first time schemaVersion 2 ships.

## 4.3 Atomicity and concurrency

- Single-file writes are atomic and durable-ish: sibling temp file → `fsync` → `renameSync` (Windows MoveFileEx semantics correctly cited); corrupt JSON throws `MalformedStateError` and the bad file is preserved. → **Strong foundation.**
- **No cross-process mutual exclusion exists** — zero `flock`/lockfile/`O_EXCL`/`wx` hits across all of `tools/*/src` (grep verified). Every runtime operation is a multi-file read-modify-write (e.g. `createDecision` writes decision → locks.json → session → audit → index/active). The MCP server, runner, and extension all embed the runtime **in-process** against the same directory: `locks.json` is last-writer-wins; two fresh commands on the same change can both pass `beginCommand` (the change lock is only created later, at `createDecision`); `appendFileSync` audit lines can interleave. Mitigations that exist: the domain change-lock narrows the practical window; derived files self-heal on next mutation. Realistic two-writer case: human answers in the panel while the runner ticks. → **Needs attention before beta** — one per-root advisory lockfile around mutating operations closes nearly all of it (Recommendation → EA-I08).

## 4.4 Lock model

Per-`changeId` granularity (deliberately not per-repo); `changeId: null` work acquires no lock. Acquired/extended on `createDecision`, downgraded to `ready-to-resume` when all decisions answered — deliberately **not** released on answer — released only by `completeCommand`/`cancelCommand`. Read-compatible commands pass through. Staleness is **derived** (owning session missing/terminal), plus a diagnostics age heuristic (24h default). **No automated forced release** — diagnostics "never deletes locks automatically"; cleanup is manual. Agent death leaves the lock active-but-flagged; the runner's TTL heartbeat lease distinguishes live from dead runners without mutating runtime state. → Coherent, safe, janitorial: **Good public-alpha compromise**; add a confirm-gated `release stale lock` operation before beta (EA-I08).

## 4.5 Resume capsules

Semantic summaries, not transcripts: intent, approvedScope, selectedPath, constraints, assumptions, openRisks, confidenceCaps, forbiddenActions, `lastCompletedStep`/`nextStep`, answered/consumed decision IDs, requiredArtifacts, confidence/knowledgeType. Idempotent rebuilds; auto-created when the last blocking decision is answered; discovery returns summaries only; the runner passes capsules by path, never inlined. Weak edges (Observed): `validatesAgainstDecisionHash` is designed but always written `null`; nothing invalidates a capsule whose workspace has drifted since pause; default capsules are skeletal — **all 7 real capsules in the public repo have empty scope/constraint/assumption arrays**, so resume quality currently rides on agent discipline. → **Acceptable technical debt**; wire the hash + a capsule-quality gate before beta (EA-I09).

## 4.6 MCP server

13 tools: begin/complete/cancel command; create/answer/get-active/get-response/mark-consumed decision; create/get capsule; find resume candidates; list locks/sessions. Two-layer validation (zod at the SDK boundary + hand-rolled checks in handlers); exemplary error handling (full detail to stderr, model never sees stack traces; stdout reserved for JSON-RPC). **The state machine is enforced server-side, not trusted to the agent.** Gaps: zod shapes are loose (`z.string()` — no ID pattern/length caps); **read paths do no ID sanitization** (path-traversal probing via `chaos_get_decision_response` with `../`-style IDs); `--no-validate` / `CHAOS_INTERACTION_VALIDATE=0` disables even write-side guards; `chaos_answer_decision` lets the *agent* write a human decision, mitigated only by prose ("MANUAL/DEV/TEST BRIDGE ONLY"). No auth on the boundary — standard local-stdio MCP trust model. → Server craftsmanship: **Strong foundation**; ID regex on reads + env-gating the answer bridge: **Needs attention before beta** (EA-I08).

## 4.7 Runner (live auto-resume)

Step-driven state machine (`tick()` advances one deterministic step — hence 69 tests). Poll-based decision detection (1000ms default) with `fs.watch` as latency optimization. Spawns one long-lived `claude -p --input-format stream-json` session; answers injected as user turns; a decision is consumed **only after a streamed `result` event acknowledges the turn** — an honest end-to-end ack, idempotent if the agent consumed it first. Runaway protection is layered and real: master feature gate **off by default** (this repo opts in via `.chaos/config.yaml` but with `adapter: none`); `maxAutoResumeCycles: 3`; `stopOnNewMaterialDecision`; manual stop-flag file; a pure policy function where **every uncertainty resolves to `READY_FOR_MANUAL_RESUME`**. Runner death: TTL lease expires, cannot refresh, never deletes state; orphaned sessions stay resumable; the top-level tick catch converts unexpected errors into resumable stops. One caution: spawned agent's default permission mode is `acceptEdits`. → **Strong foundation** — the best-engineered part of the codebase.

## 4.8 Decision Center extension

Singleton webview panel + status bar + notification; controller/view-model/message-handlers are vscode-free and DI'd for testability. Reads/writes **only through the runtime library in-process**; responses go through `answerDecision` with schema validation (default on); malformed files degrade to health warnings, never crashes. Notification: FileSystemWatcher + 2s polling fallback, 150ms debounce. Security: strict webview CSP (`default-src 'none'`, crypto-random nonce), careful HTML escaping (incl. U+2028/29), validated webview messages, no arbitrary file writes, resume instruction copied to clipboard rather than executed. → **Strong foundation.** UX gaps and proposed improvements: see [09-developer-experience.md](09-developer-experience.md) §9.4.

## 4.9 Boundaries, duplication, packaging

No copy-paste of runtime logic; sharing is via **relative source imports across sibling packages**, each through exactly one documented bridge file (`src/runtime.ts` re-exporting `../../chaos-interaction-runtime/src/index.ts` — rationale: Node refuses to type-strip under `node_modules`). Build configs reach into the sibling (`rootDir: ".."`), so mcp/extension dists embed a compiled copy of the runtime. No npm workspaces, no root manifest, no version pinning between packages; `.mcp.json` targets an untracked `dist/`. Peripheral scaffolding (config resolvers, loggers, CLI arg parsing) is triplicated across packages. **This layout would not survive npm publication as-is.** → **Good public-alpha compromise / Acceptable technical debt**; formalize (workspaces + `file:` deps + build artifacts) before any external distribution (EA-I19).

## 4.10 Code quality and security

Quality (Observed): exactly 3 real `any` uses in ~13.6k LOC; zero TODO/FIXME/HACK; typed error hierarchy; fail-safe reads; stderr-only leveled logging; deterministic tests (injected clock/ID factory, OS temp dirs); every module opens with a purpose comment citing the contract it mirrors, and intentional deviations are documented at the deviation site. **Top-decile discipline for an alpha.**

Security (threat model: local tooling around an agent that already has repo access):

1. **Path traversal** — IDs schema-validated on write (`^[A-Za-z0-9][A-Za-z0-9._:-]*$`) but not on read paths; `--no-validate` escape hatch. → Needs attention before beta.
2. **Agent-writes-human-decisions** — `chaos_answer_decision` plus unauthenticated local file writes mean any process with FS access can fabricate responses; `selectedBy`/`source` are self-declared. Audit is honest bookkeeping, not tamper-evidence. → Alpha-appropriate; document; env-gate the bridge; DSSE-style attestation is a v1 topic.
3. **Runner spawn hygiene** — operator-configured executable only, array-args, no shell, explicit env; agents cannot influence the spawn line. Real exposure is intended behavior: gate open + `acceptEdits`.

## 4.11 Classification rollup

| Finding | Classification |
|---|---|
| Atomic write layer; typed enforced state machines; schema-on-write; append-only audit; self-healing indexes | **Strong foundation** |
| Runner safety stack (default-off gate, cycle cap, ack-gated consume, TTL lease, uncertainty→manual) | **Strong foundation** |
| Decision Center CSP/escaping/message validation; library-only writes | **Strong foundation** |
| Buildless sibling source-import layout; manual-only stale-lock cleanup; `chaos_answer_decision` bridge; hand-maintained Copilot tree w/ structural parity CI | **Good public-alpha compromise** |
| No migration code; null capsule hash; `.mcp.json`→untracked dist; triplicated package scaffolding; legacy path notes | **Acceptable technical debt** |
| No cross-process mutex (locks.json races, begin-race, audit interleave); unsanitized MCP read IDs + `--no-validate`; 2 fixture-broken tests (dead schema-drift guard); hooks interpreter fragility + posture drift | **Needs attention before beta** |
| Command/skill/agent contract triplication ×2 surfaces; structure-only parity for 79 divergent files; package formalization for distribution | **Needs redesign before v1** |
| — | **Fundamental risk: none found.** Failure modes consistently degrade to "stop and ask," not corruption |

## 4.12 Is file-backed state sufficient?

For the current unit of adoption — one human, one repo, one agent — yes, and it is the right choice: transparent, git-friendly, no daemon (Inferred, Confidence: HIGH). It becomes fragile with: **multiple worktrees** (each worktree gets its own `.chaos/interactions/`; locks don't span worktrees — a real gap given agent-worktree workflows), **multiple developers** (identity is a self-declared string), shared/synced filesystems, and **schema evolution** without migrations. None of these need a database yet; they need the advisory lockfile, a worktree-aware root-resolution story, and migration code. The architecture can evolve without rewrite (Inferred, Confidence: HIGH).
