# Human Friction and Agent Effectiveness

`chaos:retro` must capture what cannot be inferred from files: human friction and agent usefulness.

## Human friction prompts

Ask selectively, not always exhaustively:

```text
1. Which step felt most useful?
2. Which step felt too heavy?
3. Which question or prompt was unclear?
4. Did the workflow prevent a real mistake?
5. Did the workflow slow you down without adding value?
6. What should become smoother next time?
```

## Agent effectiveness prompts

For each relevant command/agent:

```text
- Did it ask the right questions?
- Did it miss important context?
- Did it over-report minor issues?
- Did it under-report major risks?
- Did it stay within its role?
- Should its prompt, checklist, question bank, or contract be updated?
```

## Agent effectiveness table

```markdown
| Agent / Command | Helpfulness | Issue | Improvement |
|---|---:|---|---|
| chaos:propose | High | Missed persistence detail | Add persistence ownership prompt |
| chaos:review | Medium | Caught test gap late | Add test mapping gate |
| C# specialist | High | Needed scope reminder | Strengthen task delegation prompt |
```
