# 01 — Executive verdict

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Evidence labels: **Observed** (read/ran directly) · **Reported (author)** (author testimony, not independently verifiable) · **Inferred** · **Hypothesis** · **Recommendation** · **Unknown**

## Verdict

> **Continue with a narrower focus** — elevate the interaction runtime to the product's center, compress the methodology around it, and stabilize before expanding.

## Amendments incorporated after initial review (2026-07-18)

1. **Author clarification (Reported):** the full workflow *was* exercised — on CHAOS itself, on the demo, and on a real company brownfield project — with good results. Artifacts were deliberately excluded from the public repository to keep it artifact-free (only `chaos:todo` items/views were kept). This moves the lifecycle gap from **executional** ("never proven") to **evidentiary** ("proven privately, unverifiable publicly"). The repo's own forensics corroborate the testimony: the OSS-readiness audit (2026-07-01, sixteen days before the initial public commit) describes CHAOS as embedded in one private client repository and calls the entire gap "presentational/packaging, not workflow."
2. **Decision taken (Observed — user decision in this assessment):** adopt **Option 2 — a showcase location holding one complete, real, sanitized lifecycle trail**, linked prominently from the README. Variant to finalize: orphan branch vs in-tree `showcase/` directory. **Recommendation:** orphan branch (e.g. `showcase/task-tracker-strict-change`) honors the artifact-free-main preference; mitigate its discoverability cost with a prominent README deep-link and a short docs page embedding key excerpts. This redefines roadmap item **EA-V1** (see [14-roadmap.md](14-roadmap.md)) as *capture and publish existing validation*, not create it.

What the amendment does **not** change: external verifiability is still unmet (CHAOS's own standard is "a reviewer can reconstruct from disk alone what changed, why, and who decided"); the validation experiments stand, because creator-run validation structurally cannot answer cold-start usability, counterfactual value, or adversarial resilience; all measured findings (token economics, ceremony counts, architecture, first-run breakage) are untouched.

## The ten questions, answered directly

**What has actually been built?** Two products sharing one name (Observed):

1. An **interaction runtime** — ~13.6k LOC of zero-dependency, strictly-typed TypeScript across five packages (state store, MCP server, auto-resume runner, diagnostics, VS Code Decision Center) that makes human decisions durable, file-backed, resumable runtime state. 264/266 tests pass; the public repo contains 8 real human-answered decision cycles including a captured 11-minute pause → Decision Center answer → resume → consume → lock-release loop.
2. A **prompt-encoded SDLC methodology** — 17 commands expressed as ~1.2 MB of instruction markdown (mirrored in a second ~1.1 MB Copilot tree) wrapping OpenSpec in governance: archaeology, proposals, reviews, verification, archives, syncs, retros, todos, confidence doctrine, modes. Exercised privately with good results (Reported); publicly, only 3 of 17 commands have runtime evidence and no artifact trail exists on disk (Observed).

**Is it good?** The runtime is top-decile alpha engineering (Observed). The methodology is coherent, honest, and unusually well-documented — but its measured cost is extreme (~196k instruction tokens and ~11–14 human stops per standard change) and its value is privately validated, publicly invisible.

**Is it useful?** For a solo senior engineer making risky brownfield changes with Claude Code: plausibly yes — now supported by the author's reported real-world results, still awaiting third-party confirmation. As a daily driver for normal changes: not at current ceremony cost (Inferred, Confidence: HIGH).

**Is it genuinely differentiated?** In one place, yes: repo-local, git-versionable, durable human-decision state for CLI coding agents, with semantic resume. Research (2026-07-18) found no mainstream equivalent. The spec-driven lifecycle itself is commodity (Spec Kit 122k★, OpenSpec 61.5k★, BMAD ~49k★).

**Is it state-of-the-art?** State-of-the-art **in concept** (decisions-as-runtime-state) and **in a specific capability** (the decision runtime niche); **promising but immature** overall; **behind** on adoption, packaging, and multi-agent reach. A unique combination of known ideas whose combination does real work — resumability and auditability are emergent properties of the assembly.

**Is it worth continuing?** Yes. The runtime alone justifies continuation; the regulatory wind (EU AI Act high-risk provisions August 2026, auditors asking for AI-code provenance) blows toward the audit-trail thesis.

**Who is it for?** First: solo staff-level engineers and consultants doing high-risk brownfield work in Claude Code. Second: consulting/migration teams for whom the trail is client-billable evidence. Not "all developers."

**What is currently holding it back?**

1. The **evidence gap** — the framework that sells auditability shows no audited change publicly (now addressed by the showcase decision, EA-V1).
2. **Ceremony/token economics** — measured, not assumed.
3. **First-run breakage** — missing `openspec init` path, `.mcp.json` → unbuilt `dist/`, `py -3` hook fragility, 2 tests failing on a never-committed fixture — two of these fail *silently*.
4. **Claude Code hard dependency.**
5. **Incomplete sanitization** that the roadmap claims is done.

**What should happen next?** The stabilization sprint (sanitize, first-run, CI, security policy — days), then the showcase trail (EA-V1), then the cold-start/value/resume experiments, then compression (risk × execution-profile model, single-sourced contracts) and preparation of the runtime for standalone extraction as the hedge against platform absorption.

**What should not be built yet?** Team/multi-user features, enterprise integrations, Copilot parity investment beyond freezing it as experimental-but-honest, additional providers, additional lifecycle commands, remote approvals.

## One-paragraph summary

CHAOS at public alpha is a real and unusually well-engineered decision runtime wearing a methodology several sizes too heavy for its *public* evidence. The most valuable observed fact: the decision loop it promises actually ran, survived an 11-minute human pause, and honored the recorded rationale. The most damaging observed fact — that no audited change is visible anywhere — turned out to be presentational rather than executional (Reported), which makes the fix cheap and the irony instructive: the framework's next release should let its own product speak — commit the trail, then compress the ceremony around the runtime that earns it.
