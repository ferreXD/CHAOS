# Retro Dashboard Contract

`chaos:retro` must show a compact dashboard in the chat before asking the user to make retro decisions.

## Required dashboard fields

```markdown
## CHAOS Retro Dashboard

Scope: <change-id | period | since-ref | all>
Mode: <light|standard|strict> (<explicit|inferred>)
Lifecycle outcome: <archive/verification status if known>
Verification confidence: <HIGH|MEDIUM|LOW|UNKNOWN>
Waivers / accepted risks: <count>
Decision events: <count>
Sync debt: <count>
Scope drift: <none|bounded|unrecorded|unknown>
Proposal amendments during review: <count>
Apply-time decisions: <count>
Retro recommended: <YES|NO>
Recommended retro depth: <quick|standard|deep|agent/workflow>

Main learning signals:
- <signal 1>
- <signal 2>
- <signal 3>
```

## Required chat prompt after dashboard

```text
Proceed to retro analysis?
1. Run guided retro
2. Generate draft retro only
3. Focus only on process improvements
4. Focus only on rules/gates
5. Focus only on agents/prompts
6. Stop
```

The dashboard must be visible before the command starts the one-by-one improvement loop.
