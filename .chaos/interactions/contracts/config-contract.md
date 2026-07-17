---
chaosMetadata:
  schemaVersion: 1
  artifactType: config-contract
  artifactScope: repository
  changeId: null
  sourceCommand: iteration-0-design
  lastWrittenAt: "2026-07-06T17:30:00+02:00"
  lastWrittenBy: "chaos-iteration-0"
  lastAuditedAt: "2026-07-06T17:30:00+02:00"
  lastAuditedBy: "chaos-iteration-0"
  repositoryContext:
    provider: unknown
    branch: unknown
    reviewRequest: null
    contextSource: generated-artifact
    confidence: LOW
  metadata:
    identitySource: generated-artifact
    timestampSource: local-system
    confidence: MEDIUM
---

# Interaction Runtime Config Contract

This snippet is intended for the future `.chaos/config.yaml` contract. It is not applied automatically in Iteration 0.

```yaml
paths:
  interactions: .chaos/interactions
  interactionSessions: .chaos/interactions/sessions
  interactionDecisions: .chaos/interactions/decisions
  interactionCapsules: .chaos/interactions/capsules
  interactionSchemas: .chaos/interactions/schema

policies:
  interactionRuntime:
    enabled: true
    mode: vscode-decision-center # prompt | html-static | vscode-decision-center
    requireRuntimeForMaterialDecisions: false
    fallbackToPromptDecisionProtocol: true
    interactionsPath: .chaos/interactions
    oneActiveDecisionPerCommandRun: true
    oneBlockingLockPerChangeId: true
    responseValidation: strict
    staleDecisionTtlHours: 24
    ui:
      decisionPanelMode: persistentDecisionCenter
      autoOpenOnPendingDecision: true
      afterSubmit: switchToDashboard # closeDecisionPanel | keepPanelOpen | switchToDashboard
      showStatusBar: true
    resume:
      allowAutoResumeWhenRunnerActive: true
      allowAutoResumeAcrossDeadSessions: false
      requireExplicitResumeForDeadSessions: true
      maxAutoResumeCycles: 3
      stopOnNewMaterialDecision: true
      stopOnUnsafeWriteRiskEscalation: true
    mcp:
      enabled: true
      serverName: chaos-interaction-runtime
      requiredForStrictMode: false
    html:
      externalAssetsAllowed: false
      requireContentSecurityPolicy: true
```

## Rollout posture

For initial rollout, keep:

```yaml
requireRuntimeForMaterialDecisions: false
fallbackToPromptDecisionProtocol: true
```

After the runtime proves stable, strict mode may require the runtime for material decisions.
