# 03 — Architecture review

## What is genuinely good

1. **The runtime's storage design is right for its job** (Observed, HIGH). Plain JSON files
   under `.chaos/interactions/`, nine schemas, atomic temp-file writes, a global write lock,
   reconcile-on-read, content-hashed capsules. No daemon, no database, no network; state is
   inspectable with `cat` and diffable in git when a repo chooses to track it. The abuse
   suite (concurrent workers, kill-mid-write) is the kind of test infrastructure most OSS
   never builds.
2. **Validate-before-persist is now real.** The B3-era defect class (error returned, state
   persisted anyway, duplicate questions downstream) was closed by ordering the transition
   check before any write, and the schema-rejection path proved the atomicity again on live
   terrain (B3-lean: rejected create, nothing on disk).
3. **The MCP boundary is clean.** 14 tools, thin wrappers over one runtime class, structured
   statuses (`WAITING_FOR_USER_DECISION`, `PENDING_DECISION_EXISTS`, `ANSWERED_DECISION_
   EXISTS`, `INVALID_STATE_TRANSITION`) with instructive messages that double as agent
   protocol. The runtime is usable without MCP (CLI verbs exist), which kept it testable.
4. **Read-only diagnostics.** `chaos:doctor` observes and suggests; nothing auto-repairs.
   After watching this codebase's own history of state bugs, that conservatism is earned.
5. **The instrument is independent.** chaos-stopwatch reads runtime-written timestamps the
   measured arm cannot influence, and its falsification check (self-report must be ≤
   measured) caught real under-reporting. Few projects measure themselves this carefully.

## Structural weaknesses (ranked)

1. **The product is prose, and prose is not executable** (Observed, HIGH). The 246 lines of
   `chaos-run` + runtime-protocol SKILL are interpreted by a model, per run. Today's B-rows
   show Opus 5 following them faithfully; nothing *enforces* the loop order, the honest-
   verify rule, or "never tick what you did not verify". Model drift, a weaker model, or a
   competing system prompt silently changes the product. The one mechanical content check
   that existed (the 6,000-char cap) was removed yesterday. The diagnostics' static contract
   tests (19 assertions over the skill text) are the only guardrail, and they check
   *wording*, not behaviour. This is the deepest architectural bet in the system: **the
   state machine is enforced in code; the discipline is enforced by vibes** (Inferred, HIGH).
2. **Same-name protocol, three encodings.** The stop protocol lives as skill prose, as MCP
   tool descriptions, and as runtime semantics. They drifted before (resume flip, twin
   rules) and were re-synced by hand each time. Today's runner deadlock is the canonical
   case: the runtime's twin semantics changed for the *agent* flow and silently broke the
   *runner* flow, because the runner's consume-on-ack contract lived in a different package
   with a suite nobody ran (fixed today: the answered-twin guard now applies only while the
   session still owes the answer). Cross-package integration tests exist now only as that
   one regression test (Observed, HIGH).
3. **Distribution by file copy.** The three benchmark workspaces are aligned by a Python
   script copying files from the strip commit; version identity is a commit hash in a
   commit message. There is no package, no version number, no manifest, no update path.
   For one operator this is survivable; for any second user it is disqualifying (04).
4. **The human surface is VS Code or nothing.** The Decision Center is a webview panel;
   answering a stop from a phone, a browser, Slack, or a PR is impossible. The measured
   humanWait (1–3 min when the operator is at the desk; 70 min when not, B2-apparatus) says
   the *notification and reach* of the stop, not its content, is the real latency risk
   (Inferred, HIGH).
5. **Windows-shaped development.** CRLF warnings on every commit, `python` vs `py -3`
   landmines, `cp1252` traps, MSYS path quirks — all handled by session lore rather than
   repo configuration (`.gitattributes` is incomplete). A Linux/macOS contributor hits
   friction the author no longer sees (Observed, MEDIUM).
6. **The runner is 4.6k lines of optional.** Headless auto-resume is the largest package
   in the repo, ships `adapter: none`, and its live `claude-code` adapter has never been
   exercised in any measured run. It is well-tested dormant complexity — either a future
   bet (07) or deletion fodder under the project's own falsification ethic (Inferred,
   MEDIUM).

## Verdict

The load-bearing 40% (runtime, MCP, Decision Center, stopwatch) is genuinely
production-grade for a single-user tool — better tested than most shipped SaaS. The
remaining 60% is either dormant (runner), advisory (diagnostics), or prose whose
enforcement is a model's goodwill. Sound machine, soft contract.
