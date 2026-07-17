# CHAOS Archaeology Question Bank

Ask one focused question at a time. Open questions are fallback, not default.

## Scope narrowing

```text
The topic appears broad. I found possible scopes:
1. <scope A>
2. <scope B>
3. <scope C>

Recommended: <scope>
Choose scope or provide a custom one.
```

## Entry point ambiguity

```text
I found multiple possible entry points:
1. <entrypoint A>
2. <entrypoint B>
3. <entrypoint C>

Which should be treated as primary?
```

## Index missing

```text
No archaeology index was found.
I can create or build it during this run.
Options:
1. Create new index and add this report
2. Build index from existing reports
3. Continue without index
4. Stop
```

## Evidence threshold reached

```text
Evidence threshold reached for <mode>.
Current confidence: <confidence>.
Proposal readiness: <verdict>.
Options:
1. Stop and write report
2. Continue deeper
3. Switch to strict
4. Add user context
```

## User context injection

```text
I could not determine <unknown> from repo evidence.
Do you know the intended/current behaviour?
Options:
1. <answer A>
2. <answer B>
3. Unknown; record as assumption
4. Defer to chaos:propose
```

## Index update

```text
The archaeology report is ready.
Update .chaos/archaeology/index.md with a reference to this report?
Options:
1. Update index
2. Update index with custom topic/status
3. Skip with rationale
4. Stop before writing
```
