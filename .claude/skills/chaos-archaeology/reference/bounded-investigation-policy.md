# Investigation Budget Policy

Before deep inspection, `chaos:archaeology` must show an investigation budget in chat.

Example:

```md
## Archaeology Budget

Mode: standard
Max files: 35
Max depth: 2
Focus: data, side-effects
Expected output: proposal-ready evidence report

Investigation style:
- bounded flow reconstruction
- no full repository sweep
- stop on major ambiguity
```

Then ask:

```text
Proceed?
1. Continue
2. Narrow scope
3. Increase/decrease depth
4. Switch mode
5. Stop
```

## Early stop

Stop when the selected mode has enough evidence for the next command.

Do not continue digging just because more files exist.

If more evidence could improve confidence, ask:

```text
Evidence threshold reached.
Current confidence: MEDIUM.
Proposal readiness: READY_WITH_RISKS.
Continue deeper, switch to strict, or write report?
```
