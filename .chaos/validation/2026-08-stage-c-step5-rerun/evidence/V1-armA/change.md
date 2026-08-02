---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: secure-api-underspecified
  mode: light
  escalatedFrom: null
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-08-02T23:10:37Z"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-02T23:10:37Z"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: unknown
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: records
    confidence: MEDIUM
    bodyHash: "sha256:49c359901a7cc8303f85e8ca769c3dde94f8806db8f94419955cfc43f1d02afb"
  lifecycle:
    status: Framed
    phases:
      frame:   { status: complete, at: "2026-08-02T23:10:37Z", run: "RUN-2026-08-02-frame-01", mode: light, verdict: READY_FOR_REVIEW }
      review:  { status: pending, at: null, run: null, mode: null, verdict: null }
      deliver: { status: pending, at: null, run: null, mode: null, verdict: null }
      verify:  { status: pending, at: null, run: null, mode: null, verdict: null }
      sync:    { status: pending, at: null, run: null, mode: null, verdict: null }
      archive: { status: pending, at: null, run: null, mode: null, verdict: null }
    current:
      tests: null
      contract: null
      decisions: 4
      traceability: null
      syncState: null
      archiveReadiness: null
---

# secure-api-underspecified — Secure the Task Tracker API with an API key before public exposure

## Intent

The API is about to be exposed on the public internet and every `/tasks` route currently accepts any caller.
Enforce an `X-Api-Key` credential on `/tasks` routes (liveness `GET /` stays anonymous), with the key supplied by configuration and never committed.
Keep `dotnet build` clean and the `dotnet test` baseline green (R-003).

## Contract

**Enforcement**

- [ ] A request to any `/tasks` route without an `X-Api-Key` header returns `401 Unauthorized` and no task data.
- [ ] A request to any `/tasks` route with a non-matching `X-Api-Key` returns `401 Unauthorized` and leaves the store unchanged.
- [ ] A `/tasks` request carrying the configured key behaves exactly as before the change (same status codes and payloads for CRUD).
- [ ] `GET /` returns `200` with the service/status payload without any `X-Api-Key` header (liveness stays anonymous).

**Provisioning**

- [ ] The key is read from configuration `Security:ApiKey`; no usable key value is committed to the repository.
- [ ] Startup fails with a clear error when `Security:ApiKey` is absent or blank; no route serves task data unauthenticated.

**Governance**

- [ ] `dotnet build` is warning/error-clean and `dotnet test` is green, with the 5 existing integration tests updated to send the key (R-003).
- [ ] The accepted auth posture crossing is recorded as an ADR (`docs/adr/2026-08-02-api-key-authentication.md`) and `.chaos/architecture.md` no longer states auth is a non-goal, before verify returns READY (adr dimension 2).

OpenSpec: `openspec/changes/secure-api-underspecified/` · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Configured OpenSpec command: `openspec` CLI 1.6.0 (.chaos/config.yaml project.specEngine=openspec)

Actual invocation: openspec CLI, delta-only depth (Stage-C openspec dimension 1 — delta spec, nothing more)

Generated OpenSpec artifacts:

- `openspec/changes/secure-api-underspecified/.openspec.yaml`
- `openspec/changes/secure-api-underspecified/specs/api-authentication/spec.md`

`openspec status --change secure-api-underspecified --json` reports `isComplete: false`; `openspec status --change secure-api-underspecified` reports 1/4 artifacts (specs complete; proposal/design/tasks absent). Deliberate: the classified `openspec` dimension is 1 (delta spec only) because M1 and M2 both fired on the SAME surface class `auth`, which is correlated and owes a delta, not the full set (design C-13)..

Validation command: `openspec validate secure-api-underspecified --strict`

Validation result: **PASS**

Confidence impact: None — the delta validated strictly; the absent proposal/design/tasks are the classified depth, not a degradation.

## Framing record

verdict: READY_FOR_REVIEW · confidence: MEDIUM · evidence_coverage: PARTIAL · assumption_load: MEDIUM

Confidence limiters:

- `[ASSUMPTION · MEDIUM]` All four PROP-DEC entries were resolved in-arm (no live human; Stage-C step-5 mechanized run) — the approval is mechanized, not maintainer-given.
- `[INFERENCE · MEDIUM]` M1 fired by adjudication, not scan; classification confidence is MEDIUM per the classifier verdict.
