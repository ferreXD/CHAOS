# Sync and Retro Routing

`chaos:archive` must prepare the handoff to `chaos:sync` and `chaos:retro`.

It does not directly rewrite ADRs, rules, decisions, or architecture files.

## Sync impact preview

Before archive, produce:

```markdown
## Sync Impact Preview

Likely sync actions:
- Promote APP-DEC-003 to decision log.
- Review whether persistence pattern should become a rule.
- Update .chaos/decisions/index.md with archived change reference.
- No ADR required unless pattern repeats.
```

## Sync triggers

Recommend `chaos:sync` when:

```text
decision events require ADR/log/rule classification
OpenSpec archive updated source-of-truth specs
ADR/rule/architecture indexes may be stale
waivers or accepted risks need governance tracking
parallel changes or long-running branches exist
```

## Retro trigger analysis

Recommend `chaos:retro` when:

```text
verification required accepted risk
integration tests/build were waived
apply introduced implementation-time decisions
review missed important task/spec gaps
scope drift occurred
force-waiver/governance override was used
significant rework occurred
process friction was observed
```

## `--no-retro`

If user passes `--no-retro` but retro triggers exist, challenge:

```text
Retro is strongly recommended because <reasons>.
Continue with --no-retro and record rationale?
```

## Follow-up change recommendations

When deferred work exists, generate recommendations, not full changes by default:

```markdown
## Follow-up Change Recommendation

Suggested change: <slug>
Reason: <why>
Recommended next command:
chaos:propose "<intent>"
```
