# OpenSpec Integration Contract

`chaos:apply` wraps OpenSpec implementation semantics; it does not replace OpenSpec.

## OpenSpec inputs

Expected change folder:

```text
openspec/changes/<change-id>/
  proposal.md
  design.md
  specs/
  tasks.md
```

`design.md` and `specs/` requirements may vary by OpenSpec workflow profile and change complexity, but `tasks.md` is required for implementation.

## OpenSpec command relationship

CHAOS may instruct or invoke host-specific OpenSpec implementation commands such as:

```text
/opsx:apply <change-id>
openspec validate <change-id> --strict
```

Host support varies. If direct invocation is not available, `chaos:apply` must still follow the OpenSpec artifacts as source of truth.

## Task boundary

`tasks.md` is the implementation boundary.

If implementation requires tasks not listed:

1. Classify the discovery.
2. Ask user how to proceed.
3. Record Decision Event.
4. Amend OpenSpec now or mark for `chaos:sync`.

## Task completion

Do not silently mark tasks complete. When marking a task complete, record evidence:

- files changed
- tests/validation run
- specialist result
- user-approved waiver, if any

## After apply

Recommend:

```text
chaos:verify <change-id>
```

Do not archive from `chaos:apply`.
