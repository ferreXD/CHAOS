# CHAOS Archive Question Bank

Use one-by-one prompts. Do not dump questions unless non-interactive mode requires it.

## Mode inference

```text
I inferred --strict because this change includes <risk factors>.
Continue with --strict, choose another mode, or stop?
```

## Verification missing

```text
No chaos:verify report was found for <change-id>.

Options:
1. Stop and run chaos:verify
2. Continue in light mode with low confidence
3. Record waiver and continue
```

## Verification blocked

```text
chaos:verify returned BLOCKED because <reason>.

Options:
1. Stop and resolve through chaos:apply/chaos:verify
2. Use --force-waiver and record governance override
3. Cancel archive
```

## Archive with debt

```text
There is classified unresolved debt.

Options:
1. Archive with debt
2. Stop and resolve first
3. Create follow-up change recommendation
4. Route to retro/sync only
```

## Decision event unclassified

```text
Decision event <ID> has no closure classification.
Suggested classification: <classification>
Why: <reason>

Options:
1. Accept suggested classification
2. Choose another classification
3. Defer with rationale
4. Stop archive
```

## Waiver classification

```text
Waiver <ID> exists.
Archive impact: <impact>.

Options:
1. Archive with debt
2. Stop and resolve waiver
3. Create follow-up change recommendation
4. Force governance override
```

## No retro despite triggers

```text
Retro is recommended because <reasons>.
You passed --no-retro.

Options:
1. Keep retro recommendation
2. Suppress retro and record rationale
3. Stop archive
```

## Source-of-truth unconfirmed

```text
OpenSpec archive ran, but source-of-truth update could not be fully confirmed.

Options:
1. Mark ARCHIVED_BUT_UNCONFIRMED
2. Stop and inspect manually
3. Run status/list commands again
```
