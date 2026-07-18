# 09 — Developer experience and onboarding

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown

## 9.1 First-run reality (Observed)

Prerequisites (explicit and correct in `docs/installation.md`): Claude Code, Node ≥22.6, npm, git, OpenSpec CLI (`@fission-ai/openspec`), VS Code ≥1.90 (optional), .NET SDK (demo only). Path to first value: clone → build MCP (`npm install && npm run build`) → build Decision Center → F5/VSIX → `chaos:doctor` → demo. Roughly 5–6 command groups plus a VS Code launch; **1–2 hours for an expert who dodges the traps** (Inferred).

The traps — two of which fail **silently**:

1. **No `openspec init` step and no `openspec/` ships** — a stranger's `chaos:propose` has no OpenSpec project to wrap (the biggest silent gap). → EA-S2
2. `.mcp.json` points at an untracked `dist/` — MCP wiring is dead on fresh clone until a build runs. → EA-S2
3. Hooks hardcode `py -3` — observed silently no-op'ing on a machine with a broken launcher. → EA-I03
4. Fresh clone fails 2 runtime tests (never-committed fixture). → EA-S2
5. `cd -` bash-isms in build snippets on a Windows-primary repo (minor).

Concept count at full depth is high (~15 commands, 3 modes, 3 paths, capsules, locks, decision events, confidence labels, two artifact trees) — the one-page `docs/overview.md` genuinely mitigates it (Observed: it is an unusually good conceptual doc).

## 9.2 Aha moments vs abandonment moments (Hypothesis — no external users exist yet)

**Aha:**

1. The agent *stops* instead of guessing, and the panel shows a decision with consequences spelled out.
2. Answering, walking away, and watching the same session continue with the rationale honored.
3. Reading `decision-events.md` a week later and finding the *why* still there.
4. `chaos:doctor` accurately diagnosing a broken setup.

**Abandonment:**

1. A silent first-run failure (MCP dead, hooks no-op) with no error to search for.
2. The 4th–12th decision stop on a change the developer considers small.
3. A chat that appears hung for up to 30 minutes (the Stop-hook wait, invisible).
4. The 6th generated report restating the 5th.
5. Discovering prompts drifted from behavior with no CI to catch it.

**Emotional read** (Hypothesis): on strict-risk brownfield work the ceremony reads as *safety* and CHAOS feels empowering; on everyday work it reads as *bureaucracy*. Trust is built by the honest confidence labels and destroyed by any single hallucinated report section — and nothing mechanical currently prevents one. "Teams mandate it, developers route around it" is the realistic failure shape at current weight.

**Would a developer voluntarily continue after week one?** Everyday changes: no (Confidence: MEDIUM-HIGH). Strict-risk slice: plausibly yes — now supported by the author's reported sustained use on a real project (Reported), pending third-party confirmation (EA-X6).

## 9.3 Highest-leverage DX changes (Recommendation)

1. Fix the silent first-run failures (EA-S2) — before any promotion.
2. Ship risk × profile (EA-B1) so small changes stop paying full ceremony.
3. Consolidated single-report compact output (EA-B1).
4. Surface decision batching in the panel; batch stops into one visit (EA-I11).
5. Visible wait-state instead of a hung chat (EA-I12).
6. One-command install via Claude Code plugin packaging (EA-B4).
7. Make `chaos:doctor` the guided-setup hero (it nearly is).
8. Lazy reference loading (EA-I13) — faster starts, cheaper runs.

## 9.4 Decision Center UX assessment and improvements

What works (Observed in architecture): singleton panel + status bar + toast; watcher + polling fallback; validated writes; graceful degradation on malformed state; copy-resume-instruction.

Concerns (Inferred): users won't keep the panel open — trust transfers to notifications that exist only while VS Code runs; no decision **history** view (consumed decisions vanish from the UI — but "what did I approve and why?" is the product's core promise); no queue triage; rationale capture is free-text with no prompt for the *why* that `chaos:sync` later promotes; the hung-looking Stop-hook wait.

Proposed improvements (Recommendation → EA-I11/EA-I12/EA-B5):

1. **History tab** — searchable consumed decisions with rationale, latency, links to the change ledger.
2. **Batch queue** — `batch-independent` decisions presented as a queue with "answer all" flow.
3. **Rendered context** — markdown + clickable file links in decision context (currently escaped text).
4. **Wait-state visibility** — "waiting on DEC-…; in-session hold 22:41 remaining — answer or release."
5. **One-click resume** — run the resume command in the integrated terminal, not just clipboard.
6. **Stale/age badges** + confirm-gated force-release for orphaned locks.
7. **"Answer in chat instead"** escape hatch that writes through the same runtime API (state stays canonical).
8. Later: read-only static/web fallback for non-VS Code users.
