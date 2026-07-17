# Skill Applicability Policy

A project skill is applicable when one or more of these are true:

- `AGENTS.md` explicitly requires it for this code area.
- The reviewed code falls inside the domain declared by the skill description.
- The user explicitly asks to validate against that skill.
- The skill defines mandatory architectural or implementation rules for the technology being reviewed.

A project skill is not applicable when:

- the code is outside the skill's domain,
- the skill is only listed as optional tooling,
- applying it would contradict `AGENTS.md`,
- there is insufficient evidence that the reviewed code belongs to that domain.

## Missing skill handling

If an applicable mandatory skill is referenced but missing:

```text
Decision required: Missing mandatory skill

Context:
AGENTS.md references <skill-name>, but I could not locate it at <path-or-search-result>.

Recommended option:
1. Provide or install the skill before review, because it is project authority.

Options:
1. Provide/install the skill — review continues with full authority.
2. Continue without it — review proceeds with capped confidence and records the missing skill.
3. Stop.

Select one option to continue.
```

Do not silently continue when a mandatory skill is missing.
