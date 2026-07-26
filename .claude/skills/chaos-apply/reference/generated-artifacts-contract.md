# Generated Artifacts Contract

On a `change.md`-based change (any mode — light, standard, strict), the writable set is:

```text
.chaos/changes/<change-id>/change.md          # §Delivery dashboard + frontmatter lifecycle state
.chaos/changes/<change-id>/decision-events.md # entries (incl. ESC-* on escalation)
.chaos/changes/<change-id>/lifecycle.md       # generated-view stub, Deliver row
.chaos/changes/<change-id>/appendix/          # standard/strict overflow only (section > ~80 lines)
```

No `apply-report.md`, no `verification.md` on `change.md` changes.

Legacy fallback — only when `change.md` is absent (old change), `chaos:apply` may create or
update (v0 change-scoped layout):

```text
.chaos/changes/<change-id>/apply-report.md
.chaos/changes/<change-id>/decision-events.md
.chaos/changes/<change-id>/lifecycle.md   # Apply row, with confirmation
```

Legacy `.chaos/apply-reports/<change-id>-apply-report.md` is read-only for compatibility.

It may update code and tests only within the implementation boundary.

It may propose updates to:

```text
openspec/changes/<change-id>/tasks.md
openspec/changes/<change-id>/specs/
```

but must ask before modifying OpenSpec artifacts when the modification represents an amendment or decision.

It must not silently modify:

```text
.chaos/constitution.md
.chaos/decisions/index.md
.chaos/rules/index.md
docs/adr/**
AGENTS.md
```

Use `chaos:sync` later to promote Decision Events into governance updates.
