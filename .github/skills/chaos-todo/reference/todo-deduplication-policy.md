# CHAOS Todo Deduplication Policy

Deduplication runs **before** any write (`dedupeBeforeWrite: true`) and before recommending
candidates in the dashboard.

## Match signals

Treat two candidates (or a candidate and an existing item) as the same underlying gap when
**any** of these match:

- same `sourceIds` (e.g. both cite `RM-010`);
- same roadmap item ID;
- same finding ID;
- same `sourceArtifactPath` and substantially overlapping description;
- normalized-title similarity (case-fold, strip punctuation/stopwords, compare tokens) above a
  conservative threshold;
- same `target` **and** same `closureCriteria` (or closure criteria that fully overlap);
- same underlying capability gap, even when phrased differently (e.g. "adapter parity" vs
  "adapter mirror missing" for the same adapter).

## Worked example (from a repository's own roadmap)

Four raw candidates:

```text
F-08  Copilot adapter missing chaos:doctor
F-13  chaos:doctor has no Copilot mirror
RM-010 Validate/harden Copilot adapter
RM-011 Complete chaos:doctor implementation (Claude wrapper + Copilot mirror)
```

`F-08` and `F-13` describe the same gap (no Copilot mirror for `chaos:doctor`); `RM-010` and
`RM-011` are the corresponding roadmap promotions, and `RM-011` is really a sub-scope of
`RM-010`. Deduplication should produce **one or two** todo items, not four:

- `TODO-...-add-copilot-doctor-mirror` — `sourceIds: [F-08, F-13, RM-011]`, `type: adapter`.
- Optionally a second, broader item `TODO-...-harden-copilot-adapter` — `sourceIds: [RM-010]`,
  if the user wants the wider adapter-hardening scope tracked separately from the narrower
  doctor-mirror gap. Ask (see below) rather than assume.

## Ambiguous cases

When match signals conflict (e.g. same finding ID but clearly different scopes, or a
borderline title-similarity score), do not silently merge or silently split. Ask, one decision
at a time, using the interactive decision protocol:

```text
Decision required: Possible duplicate todo candidates

Context: <candidate A> and <candidate B> may describe the same underlying gap
(<shared signal, e.g. "both reference RM-010">).

Recommended option:
1. Merge into one todo item (recommended when closure criteria fully overlap).

Options:
1. Merge into one item.
2. Keep as separate items (they address different scopes).
3. Show more detail before deciding.
4. Stop.

Select one option to continue.
```

## Updating vs creating

If a candidate matches an existing **open** item, update that item (`sourceArtifacts`/
`sourceIds` union, refresh `lastSeenAt`, append `## History`) instead of creating a new one. If
it matches a **closed** (`done`/`wont-do`/`superseded`) item, ask whether to reopen or create a
new item referencing the closed one — do not silently reopen closed work.

## Related

- `todo-candidate-contract.md`
- `todo-write-policy.md`
- `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`
