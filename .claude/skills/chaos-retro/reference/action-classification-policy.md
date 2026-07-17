# Retro Action Classification Policy

Every retro output must classify actions explicitly.

## Action types

```text
RULE_UPDATE
GATE_UPDATE
PROMPT_UPDATE
AGENT_CONTRACT_UPDATE
QUESTION_BANK_UPDATE
VALIDATION_POLICY_UPDATE
ADR_RECOMMENDATION
DECISION_LOG_RECOMMENDATION
FOLLOW_UP_CHANGE
DEVEX_IMPROVEMENT
NO_ACTION
```

## Action register fields

```text
Action ID
Type
Priority: LOW | MEDIUM | HIGH
Owner command
Target file or artifact
Sync required: YES | NO
Confidence: HIGH | MEDIUM | LOW
Rationale
Source signal(s)
Overfitting classification
```

## Example

```markdown
### RETRO-ACTION-001 — Add test-task gate to chaos:review

Type: GATE_UPDATE  
Priority: HIGH  
Target: .chaos/gates/index.md  
Owner command: chaos:review  
Sync required: YES  
Confidence: HIGH  

Rationale:
Review identified missing test tasks after proposal generation. This is preventable before implementation.
```
