# Retro Depth Selector

Modes control governance strictness. Retro depth controls how deeply the command analyzes the lifecycle.

## Depths

```text
QUICK_TACTICAL_RETRO
STANDARD_LIFECYCLE_RETRO
DEEP_PROCESS_RETRO
AGENT_WORKFLOW_IMPROVEMENT_RETRO
```

## Inference rules

Use `QUICK_TACTICAL_RETRO` when:

- Low-risk change.
- Clean verification.
- No waivers.
- No material decision events.

Use `STANDARD_LIFECYCLE_RETRO` when:

- Normal feature/change lifecycle.
- Some useful learning signals exist.

Use `DEEP_PROCESS_RETRO` when:

- Archived with debt.
- Verification confidence capped.
- Multiple decisions happened during apply.
- Scope drift occurred.
- Sync debt exists.
- A blocker was overridden.

Use `AGENT_WORKFLOW_IMPROVEMENT_RETRO` when:

- Agent missed material context.
- Prompt/question bank was insufficient.
- C# specialist drifted outside task boundaries.
- Review/verify produced repeated false positives or late findings.

Always show the recommended depth and let the user change it.
