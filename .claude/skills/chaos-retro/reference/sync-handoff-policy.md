# Sync Handoff Policy

`chaos:retro` identifies improvements. `chaos:sync` promotes durable governance changes.

## Handoff section

Every retro report must include a sync handoff.

```markdown
## Sync Handoff

Recommended command:
chaos:sync --change <change-id> --rules --gates

Sync candidates:
- RETRO-ACTION-001: GATE_UPDATE
- RETRO-ACTION-002: PROMPT_UPDATE
- RETRO-ACTION-003: VALIDATION_POLICY_UPDATE
```

## Durable update routing

```text
Rule/gate/index updates -> chaos:sync
ADR/decision-log promotion -> chaos:sync
Agent/prompt/question-bank updates -> chaos:sync or manual kit update
OpenSpec follow-up -> chaos:propose
Code/test follow-up -> chaos:apply after proposal/review
```

## Do not silently promote

Retro may create draft recommendations, but it must not silently alter durable governance files.
