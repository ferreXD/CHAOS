# Decision events — enforce-title-max-length

Append-only ledger (`chaos-shared/reference/change-template.md` §2). `TRG-*` headings are
trigger events, not decision entries, and are excluded from the §2 scan rule.

## PROP-DEC-001 — Approve the framed contract: cap task titles at 200 characters, enforced at the HTTP endpoint boundary?

- status: RESOLVED-IN-ARM (resolved-in-arm — no live human; Stage-C step-5 mechanized run, 2026-08-03)
- approves-change: true
- options: A Approve as framed — reject >200-character titles with 400 at POST /tasks and PUT /tasks/{id}, measuring length with .NET `string.Length` (UTF-16 code units), enforced in `Endpoints/TaskEndpoints.cs` next to the existing blank-title guard · B Approve but enforce in the domain/store instead of the endpoint · C Reject / reframe — treat the bound as a persistence-model concern
- recommendation: A — the architecture posture puts validation at the endpoint boundary and keeps the domain free of HTTP concerns (R-004), and the task pins the contract exactly
- answer: A
- why-material: it is the change's single approval gate (C-11 floor stop) and it fixes two things a maintainer owns — the enforcement layer (endpoint vs domain, i.e. the R-004 boundary) and the interpretation of "200 characters" as UTF-16 code units rather than text elements
- knowledge: FACT · confidence: HIGH
- sync-action: NONE
- classification: K1 fired zero triggers (dimension vector all 0, stops 1 = the C-11 floor); no materiality questions were folded in beyond the two named above
- folded-questions: (1) enforcement layer — endpoint boundary, per `.chaos/architecture.md` boundary posture and R-004; (2) length semantics — `string.Length` (UTF-16 code units) is the .NET-idiomatic reading of "at most 200 characters"; recorded as an ASSUMPTION with the contract pinned by the task brief
- rationale: Maintainer-style resolution recorded in this measurement arm because no live human is available. Option A is the only reading consistent with (a) the pinned task contract — 400 above 200, 201/200 at exactly 200, blank-title 400 preserved — and (b) the recorded posture that new behaviour belongs at the endpoint/query boundary, not in the store's public shape. B would push HTTP-shaped validation into `Domain/**` and violate R-004; C contradicts the brief's explicit "no persistence-model change". Length semantics: `string.Length` is chosen over grapheme/rune counting because the brief gives a flat character budget for an input-validation convenience and no posture line guards text-element semantics; the assumption is recorded rather than silently taken.

## TRG-001 — trigger fired: X1 blast-radius

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-apply-enforce-title-max-length-9d431b
- trigger: X1 · by: scan · surface: none
- cite: numstat: 8 files / 360 LOC meets review1 threshold (K3, `git diff --numstat -- src tests .chaos/changes/enforce-title-max-length`)
- dimensions-after: stops 1 · evidence.targeted 0 · evidence.breadth 1 · review 1 · verify 1 · openspec 0 · adr 0
