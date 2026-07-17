# Generated Artifacts Contract

`chaos:apply` may create or update (v0 change-scoped layout):

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
