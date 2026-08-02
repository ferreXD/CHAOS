# SC-16 — large-parser-refactor (S8 recast, synthetic subject)

Band: golden (two-axis S8: the canonical breadth-is-not-risk seed — "standard-full, never strict") · Checkpoints: K1, K3
Posture: inline (synthetic template-engine library) · Map: `../assets/path-class-map.json` (no class paths exist in this subject — deliberately)
Wave-2 fixture encoded 2026-08-02 from the frozen manifest row.

## Posture

```markdown
# Architecture — TemplateKit (synthetic fixture subject)

## Module / boundary model
Internal library; public surface is TemplateParser.Parse(string) and the Ast namespace. [FACT]

## Non-goals
- Template execution sandboxing (consumers own it).
- Backward compatibility of INTERNAL parser classes (only Parse + Ast are public contract).
```

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc16-parser-refactor
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Refactor the recursive-descent parser into a tokenizer + Pratt parser to fix precedence handling
and make error recovery testable. Public surface (Parse + Ast) unchanged; internals rewritten.
```

## Scope

```text
scope: src/TemplateKit/Parsing/ (~24 files), tests/TemplateKit.Tests/Parsing/
```

## Diff numstat

```text
210	164	src/TemplateKit/Parsing/Tokenizer.cs
188	241	src/TemplateKit/Parsing/Parser.cs
96	30	src/TemplateKit/Parsing/Precedence.cs
74	11	src/TemplateKit/Parsing/ErrorRecovery.cs
40	87	src/TemplateKit/Parsing/Internal/StateMachine.cs
122	9	tests/TemplateKit.Tests/Parsing/TokenizerTests.cs
141	16	tests/TemplateKit.Tests/Parsing/PrecedenceTests.cs
98	22	tests/TemplateKit.Tests/Parsing/ErrorRecoveryTests.cs
# totals: files=24 loc=1650
```

(Fixture note: abbreviated to 8 representative rows of the ~24-file refactor, ~1,650 changed LOC
total; adds and deletes are asymmetric throughout — NOT rename-shaped. The harness treats the
fixture numstat plus this stated total as the complete diff: 24 files, 1650 LOC.)

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "X1", "by": "scan", "surface": null, "cite": "predicted ~24 files / ~1650 LOC >= review2 thresholds (20 files / 1000 LOC, MR-5)" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 1, "review": 2, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH"
    },
    "K3": {
      "newlyFired": [],
      "scanEcho": ["X1"],
      "scanEchoCite": "numstat: 24 files / 1650 LOC; asymmetric adds/deletes -> not rename-shaped, C-14 guard inactive",
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 1, "review": 2, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH",
      "antiExpectations": "M1 must NOT fire: internal-class compatibility is an EXPLICIT non-goal of the subject — rewriting internals is inside posture. M3 must NOT fire: Parse + Ast unchanged. The largest diff in the corpus earns the deepest mechanical rigor (standalone review) and ZERO materiality dimensions."
    }
  },
  "notes": "S8's two-axis verdict (standard-full, never strict) expressed in C: review 2, breadth evidence, no stop, no spec, no ADR. The double-counting guard (assessment weakness #3) is property P1 here.",
  "properties": ["P1"]
}
```
