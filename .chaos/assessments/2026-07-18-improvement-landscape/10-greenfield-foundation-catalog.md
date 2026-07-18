# 10 — Greenfield foundation catalog v1

Part of the CHAOS improvement-landscape assessment · 2026-07-18 · [Index](README.md) · Design: [09-greenfield-foundation-design.md](09-greenfield-foundation-design.md)
Catalog contract: options are technology-agnostic, opinionated, and consequential — every selection changes constraints, encouraged/discouraged practices, and derived governance. IDs are stable and versioned (`F1-A@1`). 19 options across FA-1/2/3/C/4. Poor-fit warnings are as load-bearing as best-fit claims.

Field key per option: **Principles** · **Constraints** (introduced, agent-enforced via propose/review) · **Encourages / Discourages** · **Best fit / Poor fit** · **Complexity** · **Ops** (operational implications) · **Testing** · **Evolution** (likely path) · **Misuse** (common failure) · **Combines** / **Risky with** · **Recommend when** (default conditions + evidence the agent should seek before recommending).

---

## FA-1 · System topology & deployment

*Catalog decision on the candidate set:* four candidates were proposed (monolith, deployable services, full microservices, event-driven/plugin). **Three survive.** "Event-driven" is a communication posture, not a topology — it lives in FA-C. "Plugin-oriented" is a specialization of internal structure with an extensibility requirement — it is noted as an FA-2 variant, not a topology. Merging "independently deployable services" and "full microservices" was considered and rejected: the operational cliff between *a few deliberate services* and *a service platform* is exactly the distinction teams most need to confront.

### F1-A@1 · Structured modular monolith
One deployable unit; internally partitioned into explicit modules with enforced boundaries and published contracts. *The default posture for most greenfields.*
- **Principles:** one unit of deployment, many units of ownership; boundaries by contract, not by network.
- **Constraints:** module map is explicit; dependencies point only at module contracts (never internals); each module declares its public surface; extraction-readiness is a design test ("could this module leave?").
- **Encourages:** in-process contracts, single transactional context, fast refactors across boundaries *via governed contract changes*. **Discourages:** shared "utils" dumping grounds, cross-module reach-ins, premature network seams.
- **Best fit:** teams ≤ ~10, single product, unclear domain boundaries, runway pressure. **Poor fit:** genuinely independent scaling/compliance domains; multiple teams shipping on independent cadences.
- **Complexity:** low-medium. **Ops:** one pipeline, one runtime to observe; simplest on-call. **Testing:** module-contract tests + whole-app integration cheaply.
- **Evolution:** extract highest-pressure module to a service (→ F1-B) when evidence arrives (scaling, team, compliance). **Misuse:** "monolith" without the *structured* part — no boundaries, big ball of mud with a good conscience.
- **Combines:** F2-B/C/D, F3-A/B, C-D, any F4. **Risky with:** F3-C (forbidden), C-B as primary (forbidden — async-first inside one deployable is accidental complexity).
- **Recommend when:** default absent contrary evidence. Seek: team size, deploy-cadence needs, stated scaling/compliance drivers, third-party integration pressure.

### F1-B@1 · Deliberate few services (2–5)
A small, named set of independently deployable units, each justified by an operational boundary (scale, cadence, compliance, buy-vs-build), everything else stays consolidated.
- **Principles:** a service must earn its network seam; count them on one hand.
- **Constraints:** each service has a written justification; inter-service contracts versioned; no new service without a governed decision.
- **Encourages:** explicit API/contract ownership, per-service pipelines, consumer-driven contract thinking. **Discourages:** service-per-entity, shared mutable databases across services (see F3), synchronous chains > 2 hops.
- **Best fit:** one clear separable pressure (e.g. ingestion vs core app; partner API vs product), 1–3 teams. **Poor fit:** teams unable to run >1 pipeline/runtime; fully uniform load.
- **Complexity:** medium. **Ops:** N pipelines, inter-service failure modes appear (timeouts, retries, partial outage); observability across boundaries required. **Testing:** contract tests become first-class; end-to-end tests get expensive — budget for it.
- **Evolution:** either re-consolidate (cheap if contracts were honest) or grow toward F1-C with platform investment. **Misuse:** the count silently creeping past 5 without decisions.
- **Combines:** F2-C/D, F3-B/C, C-A/C-C. **Risky with:** F3-A shared DB across services (legal, warned: couples deployments; record the warning).
- **Recommend when:** evidence of one concrete separable pressure exists — never on ambition alone. Seek: which specific capability has divergent scale/cadence/compliance, team topology.

### F1-C@1 · Distributed service platform
Many services on shared platform machinery (delivery, observability, service discovery, deployment automation) as an explicit product.
- **Principles:** the platform is a first-class internal product; autonomy over consistency; org structure and architecture co-designed.
- **Constraints:** platform capabilities (golden pipelines, telemetry, deployment) exist *before* service count grows; every service owns its data (F3-C mandatory); service creation is templated and governed.
- **Encourages:** team autonomy, independent scaling, blast-radius isolation. **Discourages:** shared databases, synchronous many-hop call graphs, snowflake services.
- **Best fit:** multiple teams shipping independently, proven scale, dedicated platform capacity. **Poor fit:** small teams, unproven products, anyone without on-call maturity — *the catalog's strongest poor-fit warning; never recommended from vague scale ambitions* (anti-goal honored).
- **Complexity:** high→very high. **Ops:** distributed tracing, chaos of partial failure, cost management — a standing platform team. **Testing:** contract + resilience testing mandatory; full-system E2E impractical — invest in production observability instead.
- **Evolution:** rarely reversed; entrenchment is the point and the risk. **Misuse:** microservices as résumé-driven default; distributed monolith (services + shared DB + sync chains).
- **Combines:** F2-C/D, F3-C (+F3-D selectively), C-B/C-C, F4-D. **Risky with:** F3-A (forbidden), F4-A (pragmatic delivery posture cannot fund a platform).
- **Recommend when:** ≥3 teams needing independent cadence *today*, platform staffing committed. Seek: org chart, current deploy frequency pain, ops maturity evidence.

---

## FA-2 · Internal structure & domain organization

*Not false opposites:* these options can coexist at different granularities (slices inside DDD modules; a hexagonal core inside one slice). The question asked is **"what is the primary organizing principle of the top-level structure?"** — the thing dependency rules are written against. Per-option notes state what it governs and what it leaves free. A plugin/extension requirement is handled as a variant note on F2-C/F2-D, not a separate option.

### F2-A@1 · Pragmatic layered
Thin, conventional layers (interface → application → data) with transaction-script-friendly logic; ceremony deliberately minimal.
- **Principles:** boring beats clever; structure should never cost more than the domain complexity it manages.
- **Constraints:** layer dependency direction only (downward); no domain framework abstractions until pain is demonstrated.
- **Encourages:** straightforward request handlers, thin services, SQL close to use. **Discourages:** speculative abstraction, repository-over-repository patterns, DDD vocabulary without DDD need.
- **Best fit:** CRUD-heavy products, small teams, well-understood domains. **Poor fit:** rich invariants, long-lived complex domains — logic smears across layers.
- **Complexity:** low. **Ops:** neutral. **Testing:** endpoint/integration tests dominate; unit seams are few — accept it.
- **Evolution:** refactor hot areas toward F2-B/F2-C when complexity arrives; the low structure makes this cheap early and expensive late — revisit at first signs of domain logic duplication. **Misuse:** staying layered after the domain outgrew it.
- **Combines:** F1-A, F3-A. **Risky with:** F1-C (distributed + thin structure = logic in the network).
- **Recommend when:** domain is genuinely simple and the team says so out loud. Seek: invariant complexity, domain-language richness in the user's description.

### F2-B@1 · Vertical slices / feature modules
Code organized by capability; each slice owns its handling, logic, and data access end-to-end; cross-slice reuse is explicit and rare.
- **Principles:** cohesion over layering; a feature's code lives together; duplication is cheaper than the wrong abstraction.
- **Constraints:** slices do not reach into other slices' internals; shared kernel is small, named, and governed; cross-slice calls go through published handlers/contracts.
- **Encourages:** feature-scoped tests, independent evolution, easy deletion. **Discourages:** horizontal service layers, god-services, premature shared abstractions.
- **Best fit:** product teams shipping features continuously; agent-assisted development (slices bound agent blast radius naturally — a CHAOS-relevant advantage). **Poor fit:** heavily shared domain invariants spanning many features.
- **Complexity:** low-medium. **Ops:** neutral. **Testing:** slice-level integration tests as the backbone (pairs with G-TEST gates).
- **Evolution:** slices cluster into modules/bounded contexts (→ F2-D) as domain structure emerges. **Misuse:** slices secretly sharing persistence models until they're coupled anyway.
- **Combines:** F1-A/B, F3-A/B, C-D. **Risky with:** F3-D (event-sourced slices need the discipline of F2-C/D cores).
- **Recommend when:** product-feature-driven work dominates; default for pragmatic-product preset. Seek: whether requirements arrive as features vs domain rules.

### F2-C@1 · Ports & adapters core
A dependency-inverted core (domain + application logic) with all I/O behind ports; adapters at the edges. (Hexagonal/clean family; plugin-oriented systems are this option with ports promoted to a public extension surface.)
- **Principles:** the domain is the asset; frameworks and I/O are details; dependencies point inward.
- **Constraints:** core references no framework/adapter types; every external system behind a port; adapters replaceable in tests.
- **Encourages:** fast in-memory core tests, integration swap-ability, long-lived domain code. **Discourages:** framework types in domain signatures, adapter logic leaking inward.
- **Best fit:** integration-heavy systems, long-horizon domains, teams that will outlive their frameworks; plugin/extension products (variant). **Poor fit:** thin CRUD (pure ceremony), throwaway prototypes.
- **Complexity:** medium. **Ops:** neutral; adapter seams aid incident isolation. **Testing:** the payoff — core tested in memory at high speed; adapters tested thin against real infra.
- **Evolution:** stable; cores survive topology changes (a strength when F1 evolves). **Misuse:** port/adapter ceremony applied to everything including trivia; interfaces-with-one-implementation sprawl.
- **Combines:** any F1, F3-B/C/D, any C. **Risky with:** F2-A instincts (mixing both halves confuses dependency rules — pick one primary).
- **Recommend when:** user names domain longevity, integration count, or extensibility as drivers. Seek: number of external systems, expected system lifetime, plugin requirements.

### F2-D@1 · Domain-driven modules
Bounded contexts as first-class top-level modules, each with its own model and ubiquitous language; strategic design governs the map.
- **Principles:** the domain map is the architecture; language boundaries are module boundaries; models don't leak.
- **Constraints:** context map maintained as an artifact; cross-context communication only via published contracts/events; no shared domain entities across contexts.
- **Encourages:** deep domain modeling where it pays, anti-corruption layers at legacy/partner edges. **Discourages:** one canonical enterprise model, entity reuse across contexts.
- **Best fit:** genuinely complex domains (billing, logistics, insurance…), multiple teams aligned to subdomains. **Poor fit:** simple domains (DDD tax without DDD payoff), teams without domain access.
- **Complexity:** medium-high. **Ops:** neutral at F1-A; aligns naturally with service boundaries at F1-B/C. **Testing:** per-context model tests + contract tests at seams.
- **Evolution:** contexts are the natural extraction seams — the smoothest F1-A→F1-B path in the catalog. **Misuse:** tactical-pattern cargo culting (aggregates everywhere) without strategic design.
- **Combines:** F1-A/B/C, F3-B/C, C-C/C-D. **Risky with:** F2-A instincts inside contexts (fine, but declare it per-context).
- **Recommend when:** domain complexity is the stated challenge and the user can name candidate subdomains. Seek: subdomain list from the user, domain-expert availability.

---

## FA-3 · Data ownership & consistency

*Catalog stance:* event sourcing is deliberately positioned as a **selective qualifier**, never a general default — F3-D requires a named domain list and pairs with strong poor-fit warnings (anti-goal honored). Options are filtered by FA-1 (F1-A hides F3-C; F1-C requires it).

### F3-A@1 · Shared transactional core
One relational schema, ACID transactions, joins allowed; simplicity as a feature.
- **Principles:** strong consistency is the cheapest correctness tool ever shipped; use it while you can.
- **Constraints:** schema changes are governed (migration discipline); modules may share tables but ownership of *write paths* is declared.
- **Encourages:** transactions across features, reporting via SQL, boring backups. **Discourages:** premature data segregation, distributed transactions later regretted.
- **Best fit:** F1-A products, invariants spanning features, small teams. **Poor fit:** anticipated module extraction (schema coupling is the extraction killer), divergent data lifecycles.
- **Complexity:** low. **Ops:** one database to run, tune, back up. **Testing:** transactional test fixtures straightforward.
- **Evolution:** carve module schemas out (→ F3-B) before any service extraction; do it while joins are still greppable. **Misuse:** "temporary" cross-module joins becoming load-bearing.
- **Combines:** F1-A, F2-A/B. **Risky with:** F1-B (warned), F1-C (forbidden).
- **Recommend when:** F1-A + no stated extraction ambition. Seek: extraction/partner-API plans (if present, steer F3-B — see worked example).

### F3-B@1 · Module-owned schemas
Each module owns its schema/storage area inside shared infrastructure; cross-module data access only via module contracts — no foreign joins.
- **Principles:** data ownership follows module ownership; the join boundary is the future service boundary.
- **Constraints:** no cross-schema joins; cross-module reads via contract queries/read models; migrations owned per module.
- **Encourages:** extraction-readiness, clear stewardship, per-module read models. **Discourages:** integration-by-database, shared mutable reference tables (replicate or serve instead).
- **Best fit:** structured monoliths with extraction ambitions; F1-B services sharing infra. **Poor fit:** heavy cross-cutting reporting needs without read-model investment.
- **Complexity:** medium. **Ops:** still one database engine; more schemas/migration streams. **Testing:** per-module data fixtures; contract-query tests.
- **Evolution:** the natural bridge — F3-A→F3-B→F3-C as topology evolves. **Misuse:** contract queries so chatty they reinvent joins over RPC.
- **Combines:** F1-A/B, F2-B/C/D. **Risky with:** none structural; discipline-dependent.
- **Recommend when:** extraction ambition stated, or F2-D chosen (contexts want owned data). Seek: reporting requirements (plan read models), stated future partner/API plans.

### F3-C@1 · Service-owned stores, eventual consistency
Every service owns its database outright; integration via events/APIs; cross-service workflows use sagas/outbox patterns; consistency is designed, not assumed.
- **Principles:** autonomy requires data ownership; consistency is a spectrum you choose per interaction.
- **Constraints:** no shared databases, ever; every cross-service workflow names its consistency strategy (saga/outbox/idempotent retry); event schemas versioned.
- **Encourages:** designed idempotency, explicit failure compensation, per-service storage fit. **Discourages:** distributed transactions, synchronous consistency simulations.
- **Best fit:** F1-C mandatory; F1-B where the seam justifies it. **Poor fit:** anything that can still afford a transaction — the tax is real and permanent.
- **Complexity:** high. **Ops:** N stores, dead-letter queues, reconciliation jobs — standing operational surface. **Testing:** contract + saga tests; eventual-consistency test harnesses; production observability as a test substitute.
- **Evolution:** effectively one-way; re-consolidation is a rewrite. **Misuse:** eventual consistency adopted without compensation design ("we'll deal with failures later").
- **Combines:** F1-B/C, F2-C/D, C-B/C-C, F3-D per-domain. **Risky with:** F4-A (this posture needs reliability investment).
- **Recommend when:** F1-C selected, or an F1-B seam has divergent storage/scale needs — with the one-way-door warning attached (strict decision class).

### F3-D@1 · Selective event sourcing (qualifier)
Named domains persist state as event streams (with projections); everything else stays state-stored. **Attaches to F3-B/F3-C for specific domains; never repo-wide.**
- **Principles:** when the history *is* the business (ledgers, audit, temporal queries), store the history; elsewhere, don't.
- **Constraints:** applies only to an explicit domain list recorded in the foundation; projections rebuildable; event schema evolution strategy required upfront.
- **Encourages:** audit-grade domains (billing, ledger), temporal analytics where justified. **Discourages:** ES-by-default, CRUD domains event-sourced for fashion, framework-driven adoption — *the catalog's second-strongest poor-fit warning.*
- **Best fit:** ledger-like, compliance-heavy, or genuinely temporal domains. **Poor fit:** nearly everything else; teams new to ES on deadline.
- **Complexity:** high (for the named domains). **Ops:** stream storage, projection rebuild machinery, versioned event archives. **Testing:** given-events-then assertions are excellent; projection tests mandatory.
- **Evolution:** per-domain adoption/retirement; keep the list short. **Misuse:** the list growing without decisions; events as a message bus rather than as storage.
- **Combines:** F3-B/C host it; F2-C/D cores handle it best; pairs naturally with D-C regulated overlay. **Risky with:** F2-A (transaction scripts + event streams end badly).
- **Recommend when:** the user names a domain whose history has direct business/compliance value. Seek: audit/temporal requirements stated in the user's own words — never infer from "we like events."

---

## FA-C · Communication & integration (conditional area)

*Relation to topology (the brief's question):* for F1-A this area nearly answers itself — **C-D is auto-defaulted** and the question is asked only if the user opts in or external edges are complex; for F1-B/C the choice is real and mandatory. Options are filtered accordingly. This is why FA-C is conditional rather than a false fifth question for monolith teams.

### C-A@1 · Synchronous API-first
Request/response contracts as the backbone; async only at named edges.
- **Principles:** call graphs you can read; latency budgets explicit; timeouts/retries designed, not defaulted.
- **Constraints:** every inter-unit call declares timeout/retry/idempotency; call-chain depth budget (≤2 hops) enforced at review.
- **Encourages:** contract-first design, gateway discipline. **Discourages:** hidden fan-out chains, sync-over-async simulation.
- **Best fit:** F1-B with user-facing request flows; teams fluent in HTTP/RPC. **Poor fit:** long workflows, spiky load absorption.
- **Complexity:** low-medium. **Ops:** simplest tracing. **Testing:** contract tests per API; failure-injection for timeouts. **Evolution:** introduce async for workflows as they appear (→ C-C). **Misuse:** distributed monolith via deep sync chains. **Combines:** F1-B, F3-B/C. **Risky with:** F1-C at scale (chains). **Recommend when:** request/response dominates the domain's interactions.

### C-B@1 · Messaging-first
Events/commands as the backbone; at-least-once delivery; idempotency as a universal discipline; sync reserved for queries.
- **Principles:** temporal decoupling by default; consumers own their pace; every handler idempotent.
- **Constraints:** message schemas versioned; dead-letter handling designed per queue; no business flow depends on exactly-once.
- **Encourages:** load leveling, workflow resilience, audit-friendly event flow. **Discourages:** request/response emulation over queues, unversioned payloads.
- **Best fit:** F1-C, integration/workflow-heavy domains, spiky ingestion. **Poor fit:** simple request-driven products (ceremony), teams without messaging ops experience.
- **Complexity:** medium-high. **Ops:** broker as tier-1 infrastructure; DLQ triage rotas. **Testing:** consumer contract tests, idempotency tests, chaos on redelivery. **Evolution:** stable once established. **Misuse:** the anti-goal case — messaging adopted for fashion inside what is really one deployable (hence forbidden as primary with F1-A). **Combines:** F1-B/C, F3-C/D. **Risky with:** F1-A (forbidden as primary), F4-A. **Recommend when:** workflows/integrations dominate and ops maturity exists.

### C-C@1 · Deliberate hybrid
A written rule assigns each interaction class: sync for queries and immediacy-needing commands; async for workflows, integrations, and load absorption.
- **Principles:** neither style is a religion; the *rule* is the architecture.
- **Constraints:** the interaction-class table is a foundation artifact (becomes rule `R-COM-*`); new interaction types classify before implementation.
- **Encourages:** fit-for-purpose choices with a paper trail. **Discourages:** per-developer style drift — the failure this option exists to prevent.
- **Best fit:** F1-B/C real systems (most mature distributed systems are hybrids — making it explicit beats pretending purity). **Poor fit:** F1-A (the table degenerates to C-D + edges).
- **Complexity:** medium. **Ops:** both toolchains, consciously budgeted. **Testing:** per class. **Evolution:** table evolves by governed edits — the healthiest long-term posture for F1-B/C. **Misuse:** the table existing but unenforced (review must cite it). **Combines:** F1-B/C, F3-B/C. **Risky with:** none structural. **Recommend when:** F1-B/C with mixed interaction needs — the default recommendation for distributed picks.

### C-D@1 · In-process contracts (single-deployable default)
Module boundaries honored through in-process interfaces and internal events; network communication only at true external edges.
- **Principles:** the cheapest correct call is a function call; boundaries are logical until evidence demands physical.
- **Constraints:** cross-module calls via published module contracts (pairs with R-DEP rules); internal events for decoupling where useful, in-process only; external edges (APIs consumed/exposed) declared and contract-tested.
- **Encourages:** contract discipline without network tax; future-proof seams. **Discourages:** in-process "microservice cosplay" (queues between modules of one binary).
- **Best fit:** F1-A always. **Poor fit:** anything distributed (auto-hidden).
- **Complexity:** low. **Ops:** none added. **Testing:** module-contract tests; external-edge contract tests. **Evolution:** contracts become network APIs at extraction — the seam was pre-paid. **Misuse:** treating "in-process" as license to skip contracts entirely. **Combines:** F1-A, F2-B/C/D, F3-A/B. **Risky with:** — . **Recommend when:** F1-A (auto-default; question shown only on opt-in).

---

## FA-4 · Delivery & operational posture

*Catalog decision (the brief's alternative):* quality, testing, observability, and security are **downstream policies derived from one posture selection**, not separate foundation areas — one question sets their defaults; each is individually overridable later through rules. Separate areas would balloon the wizard for choices that cluster tightly in practice. This area also tunes **CHAOS's own defaults** (mode inference, gates) — the foundation configuring the governor.

### D-A@1 · Pragmatic product delivery
Ship fast; test the risky bits well; observability basics; debt accepted *consciously* (recorded as waivers, not amnesia).
- **Principles:** speed is a feature; rigor is spent where failure hurts.
- **Constraints/derived:** gates: behavioral change needs slice-level tests (G-TEST); waiver lifecycle active (IL-TR4); CHAOS default mode standard, light freely available. **Encourages:** thin E2E smoke, feature flags, fast rollback. **Discourages:** coverage theater, process for its own sake.
- **Best fit:** early products, small teams, F1-A. **Poor fit:** money-moving/regulated paths (upgrade those paths via rules, or pick D-B/D-C).
- **Complexity:** low. **Ops:** basic metrics/logs/alerts. **Testing:** risk-targeted. **Evolution:** → D-B as blast radius grows. **Misuse:** "pragmatic" as euphemism for "none". **Combines:** F1-A, F3-A/B. **Risky with:** F1-C, F3-C, C-B. **Recommend when:** default for pragmatic-product preset; runway pressure stated.

### D-B@1 · Reliability-first
SLOs and error budgets steer pace; strong testing pyramid; progressive rollout; incident discipline.
- **Principles:** reliability is a feature users feel; budgets make the speed/reliability trade explicit.
- **Constraints/derived:** gates: tests required for behavioral change (strict-blocking), rollout plan required for risky changes; CHAOS mode inference leans strict on persistence/contract paths; observability rules (structured logs, RED metrics) derived.
- **Best fit:** systems with real users depending daily; F1-B. **Poor fit:** pre-product-market-fit exploration (budgets without users are fiction).
- **Complexity:** medium. **Ops:** SLO dashboards, on-call rotation, postmortem practice (feeds chaos:retro naturally). **Testing:** pyramid enforced via gates. **Evolution:** stable; tighten budgets with growth. **Misuse:** SLOs defined, never consulted. **Combines:** any F1, F3-B/C. **Risky with:** — . **Recommend when:** the user names uptime/user-trust as a top-3 concern.

### D-C@1 · Regulated / auditable
Traceability mandatory; change control evidenced; retention governed. (Also reachable as the **regulated overlay** on any preset.)
- **Principles:** if it isn't recorded, it didn't happen; evidence is a deliverable.
- **Constraints/derived:** CHAOS strict mode default for standard+ changes; waivers require expiry + owner; decision/outcome records retained (ties IL-TR4/TR5); gates: validation evidence attached to every behavioral change; artifact metadata stamping mandatory.
- **Best fit:** finance/health/gov contexts; audits expected. **Poor fit:** everything else — the tax is real; never recommend without named compliance drivers.
- **Complexity:** medium-high (process, not code). **Ops:** retention, access discipline. **Testing:** evidence-producing tests (reports retained). **Evolution:** rarely relaxed. **Misuse:** compliance theater — artifacts produced, never read; CHAOS's readable-trail work (IL-PF9) is the antidote. **Combines:** any topology; F3-D affinity. **Risky with:** D-A instincts. **Recommend when:** the user names a regulation/auditor — evidence: which one, in their words.

### D-D@1 · Platform / scale-oriented
Multi-team enablement: API stability, versioning discipline, deprecation policy, paved-road tooling.
- **Principles:** other teams are the users; stability contracts beat speed locally.
- **Constraints/derived:** public contracts versioned with deprecation windows (rule); breaking-change gate (strict decision class); paved-road templates maintained; CHAOS strict on contract-touching changes.
- **Best fit:** F1-C, internal platforms, API products. **Poor fit:** single-team products (pure overhead).
- **Complexity:** high. **Ops:** version telemetry, deprecation comms. **Testing:** compatibility suites across supported versions. **Evolution:** stable. **Misuse:** platform posture without platform users. **Combines:** F1-B/C, C-C, F2-C. **Risky with:** F1-A single-team. **Recommend when:** ≥2 consumer teams exist today (count them; don't accept "someday").
