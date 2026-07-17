# Approach Alignment Contract

`chaos:propose` must not assume the implementation approach silently.

Before generating the final OpenSpec change, it must present an Approach Alignment Checkpoint.

## Required checkpoint shape

```md
# Approach Alignment Checkpoint

## Detected intent
<what the user appears to want>

## Change classification
- Type: ...
- Risk: ...
- Mode: ...

## Evidence summary
- Evidence found: ...
- Evidence missing: ...
- Confidence limiters: ...

## Relevant constraints
- ADR/rule/context constraints...

## Candidate approaches

### Option A — Conservative
...

### Option B — Balanced
...

### Option C — Strategic
...

## Recommended approach
...

## Confidence
- Overall confidence: ...
- Assumption load: ...

## User decision required
Does this approach align with your intent?

Choose one:
1. Proceed with recommended approach.
2. Choose another option.
3. Modify constraints.
4. Add missing context.
5. Run archaeology first.
6. Cancel.
```

## Exception

In `--light` mode, the checkpoint may be compact, but it must still exist unless the user explicitly requested automatic generation.

## No silent generation rule

The command may not write the final OpenSpec change before this checkpoint unless:

- the user passed an explicit auto-confirm flag; or
- the command is running in a scripted context where user interaction is unavailable and the output is clearly marked draft/unconfirmed.


## Runtime resolution before final write

If the checkpoint exposes missing scope, design, persistence, task, evidence, or test decisions, the command must run the Runtime Decision Loop before writing final OpenSpec artefacts.

The checkpoint is not a passive report. It is a human alignment moment.

Required behaviour:

1. Present candidate approaches.
2. Ask the user whether the recommended approach aligns.
3. If the user adds context, re-evaluate approaches.
4. Record the selected approach as a `PROP-DEC-*` Decision Event.
5. Apply the selected approach to OpenSpec artefacts only after confirmation.

If the user defers approach selection, generate only a pre-proposal brief or mark the proposal as `NEEDS_MORE_CONTEXT`.
