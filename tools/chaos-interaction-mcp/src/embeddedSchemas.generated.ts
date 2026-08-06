/**
 * GENERATED FILE — do not edit by hand.
 *
 * Canonical source: .chaos/interactions/schema/*.json (repo root).
 * Regenerate with: node scripts/generate-embedded-schemas.mjs
 *
 * Embedded so the published bundle can seed schemas into a repository that
 * has no CHAOS checkout (see schemaSeed.ts). Parity with the canonical files
 * is enforced by test/embeddedSchemaParity.test.ts.
 */

export const EMBEDDED_SCHEMAS: Readonly<Record<string, unknown>> = {
  "active.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://chaos.local/schema/interaction-runtime/1/chaos-active-interaction-state.schema.json",
    "title": "CHAOS Active Interaction State",
    "description": "Workspace-level pointer to active interactions and resumable sessions.",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "schemaVersion": {
        "type": "integer",
        "const": 1
      },
      "state": {
        "type": "string",
        "enum": [
          "ready",
          "waiting-for-user-decision",
          "ready-to-resume",
          "blocked",
          "unknown"
        ]
      },
      "activeDecisionId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "activeCommandRunId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "activeChangeId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "pendingDecisionIds": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/id"
        }
      },
      "readyToResumeCommandRunIds": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/id"
        }
      },
      "updatedAt": {
        "$ref": "#/$defs/isoDateTime"
      },
      "metadata": {
        "type": "object",
        "additionalProperties": true
      }
    },
    "required": [
      "schemaVersion",
      "state",
      "pendingDecisionIds",
      "readyToResumeCommandRunIds",
      "updatedAt"
    ],
    "$defs": {
      "confidence": {
        "type": "string",
        "enum": [
          "HIGH",
          "MEDIUM",
          "LOW"
        ]
      },
      "knowledgeType": {
        "type": "string",
        "enum": [
          "FACT",
          "INFERENCE",
          "ASSUMPTION",
          "UNKNOWN",
          "CONFLICT"
        ]
      },
      "isoDateTime": {
        "type": "string",
        "format": "date-time"
      },
      "id": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
      },
      "path": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500
      }
    }
  },
  "audit-event.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://chaos.local/schema/interaction-runtime/1/chaos-interaction-audit-event.schema.json",
    "title": "CHAOS Interaction Audit Event",
    "description": "Append-only audit event for interaction runtime transitions.",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "schemaVersion": {
        "type": "integer",
        "const": 1
      },
      "eventId": {
        "$ref": "#/$defs/id"
      },
      "eventType": {
        "type": "string",
        "enum": [
          "session-created",
          "command-started",
          "decision-created",
          "decision-answered",
          "decision-cancelled",
          "decision-expired",
          "decision-consumed",
          "capsule-created",
          "lock-acquired",
          "lock-released",
          "command-completed",
          "command-cancelled",
          "command-failed",
          "auto-resume-started",
          "auto-resume-stopped",
          "runtime-warning"
        ]
      },
      "commandRunId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "decisionId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "changeId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "timestamp": {
        "$ref": "#/$defs/isoDateTime"
      },
      "actor": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "source": {
        "type": "string",
        "enum": [
          "mcp",
          "vscode-decision-center",
          "chaos-command",
          "hook",
          "manual",
          "unknown"
        ]
      },
      "message": {
        "type": "string",
        "minLength": 1
      },
      "data": {
        "type": "object",
        "additionalProperties": true
      }
    },
    "required": [
      "schemaVersion",
      "eventId",
      "eventType",
      "timestamp",
      "source",
      "message"
    ],
    "$defs": {
      "confidence": {
        "type": "string",
        "enum": [
          "HIGH",
          "MEDIUM",
          "LOW"
        ]
      },
      "knowledgeType": {
        "type": "string",
        "enum": [
          "FACT",
          "INFERENCE",
          "ASSUMPTION",
          "UNKNOWN",
          "CONFLICT"
        ]
      },
      "isoDateTime": {
        "type": "string",
        "format": "date-time"
      },
      "id": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
      },
      "path": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500
      }
    }
  },
  "decision.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://chaos.local/schema/interaction-runtime/1/chaos-decision.schema.json",
    "title": "CHAOS Decision",
    "description": "A material human decision created by a CHAOS command.",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "schemaVersion": {
        "type": "integer",
        "const": 1
      },
      "decisionId": {
        "$ref": "#/$defs/id"
      },
      "commandRunId": {
        "$ref": "#/$defs/id"
      },
      "changeId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "sourceCommand": {
        "type": "string",
        "minLength": 1
      },
      "interactionType": {
        "type": "string",
        "enum": [
          "single-choice-decision",
          "multi-choice-decision",
          "confirmation",
          "freeform-input"
        ]
      },
      "state": {
        "type": "string",
        "enum": [
          "created",
          "waiting",
          "answered",
          "consumed",
          "cancelled",
          "expired",
          "superseded"
        ]
      },
      "title": {
        "type": "string",
        "minLength": 1
      },
      "context": {
        "type": "string",
        "minLength": 1
      },
      "recommendation": {
        "type": [
          "string",
          "null"
        ]
      },
      "recommendedOptionId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 120
      },
      "options": {
        "type": "array",
        "minItems": 1,
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "id": {
              "$ref": "#/$defs/id"
            },
            "label": {
              "type": "string",
              "minLength": 1
            },
            "description": {
              "type": [
                "string",
                "null"
              ]
            },
            "consequence": {
              "type": [
                "string",
                "null"
              ]
            },
            "risk": {
              "type": [
                "string",
                "null"
              ]
            },
            "recommended": {
              "type": "boolean",
              "default": false
            }
          },
          "required": [
            "id",
            "label"
          ]
        }
      },
      "requiresRationale": {
        "type": "boolean",
        "default": false
      },
      "independent": {
        "type": "boolean",
        "default": false
      },
      "blocks": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/id"
        }
      },
      "unlocksOn": {
        "type": "object",
        "additionalProperties": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/id"
          }
        }
      },
      "createdAt": {
        "$ref": "#/$defs/isoDateTime"
      },
      "expiresAt": {
        "type": [
          "string",
          "null"
        ],
        "format": "date-time"
      },
      "createdBy": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "metadata": {
        "type": "object",
        "additionalProperties": true
      }
    },
    "required": [
      "schemaVersion",
      "decisionId",
      "commandRunId",
      "sourceCommand",
      "interactionType",
      "state",
      "title",
      "context",
      "options",
      "createdAt"
    ],
    "$defs": {
      "confidence": {
        "type": "string",
        "enum": [
          "HIGH",
          "MEDIUM",
          "LOW"
        ]
      },
      "knowledgeType": {
        "type": "string",
        "enum": [
          "FACT",
          "INFERENCE",
          "ASSUMPTION",
          "UNKNOWN",
          "CONFLICT"
        ]
      },
      "isoDateTime": {
        "type": "string",
        "format": "date-time"
      },
      "id": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
      },
      "path": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500
      }
    }
  },
  "index.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://chaos.local/schema/interaction-runtime/1/chaos-interaction-index.schema.json",
    "title": "CHAOS Interaction Index",
    "description": "Workspace index of sessions, decisions, and locks.",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "schemaVersion": {
        "type": "integer",
        "const": 1
      },
      "sessions": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "commandRunId": {
              "$ref": "#/$defs/id"
            },
            "path": {
              "$ref": "#/$defs/path"
            },
            "state": {
              "type": "string"
            },
            "changeId": {
              "type": [
                "string",
                "null"
              ]
            },
            "sourceCommand": {
              "type": "string"
            }
          },
          "required": [
            "commandRunId",
            "path",
            "state",
            "sourceCommand"
          ]
        }
      },
      "decisions": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "decisionId": {
              "$ref": "#/$defs/id"
            },
            "path": {
              "$ref": "#/$defs/path"
            },
            "state": {
              "type": "string"
            },
            "commandRunId": {
              "$ref": "#/$defs/id"
            },
            "changeId": {
              "type": [
                "string",
                "null"
              ]
            }
          },
          "required": [
            "decisionId",
            "path",
            "state",
            "commandRunId"
          ]
        }
      },
      "locksPath": {
        "$ref": "#/$defs/path"
      },
      "updatedAt": {
        "$ref": "#/$defs/isoDateTime"
      }
    },
    "required": [
      "schemaVersion",
      "sessions",
      "decisions",
      "locksPath",
      "updatedAt"
    ],
    "$defs": {
      "confidence": {
        "type": "string",
        "enum": [
          "HIGH",
          "MEDIUM",
          "LOW"
        ]
      },
      "knowledgeType": {
        "type": "string",
        "enum": [
          "FACT",
          "INFERENCE",
          "ASSUMPTION",
          "UNKNOWN",
          "CONFLICT"
        ]
      },
      "isoDateTime": {
        "type": "string",
        "format": "date-time"
      },
      "id": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
      },
      "path": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500
      }
    }
  },
  "lock.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://chaos.local/schema/interaction-runtime/1/chaos-change-lock.schema.json",
    "title": "CHAOS Change Lock",
    "description": "A change-scoped lock caused by a pending/resumable command session.",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "schemaVersion": {
        "type": "integer",
        "const": 1
      },
      "lockId": {
        "$ref": "#/$defs/id"
      },
      "changeId": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160
      },
      "lockedByCommandRunId": {
        "$ref": "#/$defs/id"
      },
      "lockedByCommand": {
        "type": "string",
        "minLength": 1
      },
      "reason": {
        "type": "string",
        "enum": [
          "waiting-for-user-decision",
          "ready-to-resume",
          "command-running",
          "manual-hold",
          "unknown"
        ]
      },
      "state": {
        "type": "string",
        "enum": [
          "active",
          "released",
          "expired",
          "stale"
        ]
      },
      "blockingDecisionIds": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/id"
        }
      },
      "compatibleCommands": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "createdAt": {
        "$ref": "#/$defs/isoDateTime"
      },
      "expiresAt": {
        "type": [
          "string",
          "null"
        ],
        "format": "date-time"
      },
      "releasedAt": {
        "type": [
          "string",
          "null"
        ],
        "format": "date-time"
      },
      "metadata": {
        "type": "object",
        "additionalProperties": true
      }
    },
    "required": [
      "schemaVersion",
      "lockId",
      "changeId",
      "lockedByCommandRunId",
      "lockedByCommand",
      "reason",
      "state",
      "blockingDecisionIds",
      "compatibleCommands",
      "createdAt"
    ],
    "$defs": {
      "confidence": {
        "type": "string",
        "enum": [
          "HIGH",
          "MEDIUM",
          "LOW"
        ]
      },
      "knowledgeType": {
        "type": "string",
        "enum": [
          "FACT",
          "INFERENCE",
          "ASSUMPTION",
          "UNKNOWN",
          "CONFLICT"
        ]
      },
      "isoDateTime": {
        "type": "string",
        "format": "date-time"
      },
      "id": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
      },
      "path": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500
      }
    }
  },
  "response.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://chaos.local/schema/interaction-runtime/1/chaos-decision-response.schema.json",
    "title": "CHAOS Decision Response",
    "description": "A human response to a CHAOS decision.",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "schemaVersion": {
        "type": "integer",
        "const": 1
      },
      "decisionId": {
        "$ref": "#/$defs/id"
      },
      "commandRunId": {
        "$ref": "#/$defs/id"
      },
      "selectedOptionId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 120
      },
      "selectedOptionIds": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/id"
        }
      },
      "freeformValue": {
        "type": [
          "string",
          "null"
        ]
      },
      "rationale": {
        "type": [
          "string",
          "null"
        ]
      },
      "selectedBy": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160
      },
      "selectedAt": {
        "$ref": "#/$defs/isoDateTime"
      },
      "source": {
        "type": "string",
        "enum": [
          "vscode-decision-center",
          "prompt-fallback",
          "mcp-tool",
          "manual-file",
          "unknown"
        ]
      },
      "validatesAgainstDecisionHash": {
        "type": [
          "string",
          "null"
        ],
        "pattern": "^sha256:[a-fA-F0-9]{64}$"
      },
      "metadata": {
        "type": "object",
        "additionalProperties": true
      }
    },
    "required": [
      "schemaVersion",
      "decisionId",
      "commandRunId",
      "selectedBy",
      "selectedAt",
      "source"
    ],
    "$defs": {
      "confidence": {
        "type": "string",
        "enum": [
          "HIGH",
          "MEDIUM",
          "LOW"
        ]
      },
      "knowledgeType": {
        "type": "string",
        "enum": [
          "FACT",
          "INFERENCE",
          "ASSUMPTION",
          "UNKNOWN",
          "CONFLICT"
        ]
      },
      "isoDateTime": {
        "type": "string",
        "format": "date-time"
      },
      "id": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
      },
      "path": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500
      }
    }
  },
  "resume-capsule.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://chaos.local/schema/interaction-runtime/1/chaos-resume-capsule.schema.json",
    "title": "CHAOS Resume Capsule",
    "description": "Minimal structured context required to resume a paused CHAOS command.",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "schemaVersion": {
        "type": "integer",
        "const": 1
      },
      "commandRunId": {
        "$ref": "#/$defs/id"
      },
      "sourceCommand": {
        "type": "string",
        "minLength": 1
      },
      "changeId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "state": {
        "type": "string",
        "enum": [
          "waiting-for-decision",
          "ready-to-resume",
          "resumed",
          "completed",
          "cancelled",
          "expired",
          "failed"
        ]
      },
      "lastCompletedStep": {
        "type": [
          "string",
          "null"
        ]
      },
      "nextStep": {
        "type": "string",
        "minLength": 1
      },
      "answeredDecisionIds": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/id"
        }
      },
      "consumedDecisionIds": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/id"
        }
      },
      "requiredArtifacts": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/path"
        }
      },
      "contextCapsule": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "intent": {
            "type": "string",
            "minLength": 1
          },
          "approvedScope": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "selectedPath": {
            "type": [
              "string",
              "null"
            ]
          },
          "constraints": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "assumptions": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "openRisks": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "confidenceCaps": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "forbiddenActions": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "intent",
          "approvedScope",
          "constraints",
          "openRisks"
        ]
      },
      "confidence": {
        "$ref": "#/$defs/confidence"
      },
      "knowledgeType": {
        "$ref": "#/$defs/knowledgeType"
      },
      "createdAt": {
        "$ref": "#/$defs/isoDateTime"
      },
      "updatedAt": {
        "$ref": "#/$defs/isoDateTime"
      },
      "metadata": {
        "type": "object",
        "additionalProperties": true
      }
    },
    "required": [
      "schemaVersion",
      "commandRunId",
      "sourceCommand",
      "state",
      "nextStep",
      "answeredDecisionIds",
      "consumedDecisionIds",
      "requiredArtifacts",
      "contextCapsule",
      "confidence",
      "knowledgeType",
      "createdAt",
      "updatedAt"
    ],
    "$defs": {
      "confidence": {
        "type": "string",
        "enum": [
          "HIGH",
          "MEDIUM",
          "LOW"
        ]
      },
      "knowledgeType": {
        "type": "string",
        "enum": [
          "FACT",
          "INFERENCE",
          "ASSUMPTION",
          "UNKNOWN",
          "CONFLICT"
        ]
      },
      "isoDateTime": {
        "type": "string",
        "format": "date-time"
      },
      "id": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
      },
      "path": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500
      }
    }
  },
  "runner-lease.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://chaos.local/schema/interaction-runtime/1/chaos-runner-lease.schema.json",
    "title": "CHAOS Runner Lease",
    "description": "Liveness lease written by a live CHAOS interaction runner (Iteration 5). Presence of a non-expired lease is what distinguishes a live, auto-resumable session from a dead one that must fall back to chaos:resume.",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "schemaVersion": {
        "type": "integer",
        "const": 1
      },
      "runnerId": {
        "$ref": "#/$defs/id"
      },
      "commandRunId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "changeId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "sourceCommand": {
        "type": "string",
        "minLength": 1
      },
      "processId": {
        "type": [
          "integer",
          "null"
        ]
      },
      "state": {
        "type": "string",
        "enum": [
          "created",
          "starting",
          "running",
          "waiting-for-decision",
          "auto-resuming",
          "completed",
          "cancelled",
          "failed",
          "abandoned",
          "ready-for-manual-resume"
        ]
      },
      "startedAt": {
        "$ref": "#/$defs/isoDateTime"
      },
      "lastHeartbeatAt": {
        "$ref": "#/$defs/isoDateTime"
      },
      "leaseExpiresAt": {
        "$ref": "#/$defs/isoDateTime"
      },
      "autoResumeCyclesUsed": {
        "type": "integer",
        "minimum": 0
      },
      "maxAutoResumeCycles": {
        "type": "integer",
        "minimum": 0
      },
      "metadata": {
        "type": "object",
        "additionalProperties": true
      }
    },
    "required": [
      "schemaVersion",
      "runnerId",
      "sourceCommand",
      "state",
      "startedAt",
      "lastHeartbeatAt",
      "leaseExpiresAt",
      "autoResumeCyclesUsed",
      "maxAutoResumeCycles"
    ],
    "$defs": {
      "isoDateTime": {
        "type": "string",
        "format": "date-time"
      },
      "id": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
      }
    }
  },
  "session.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://chaos.local/schema/interaction-runtime/1/chaos-command-session.schema.json",
    "title": "CHAOS Command Session",
    "description": "A resumable command execution session.",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "schemaVersion": {
        "type": "integer",
        "const": 1
      },
      "commandRunId": {
        "$ref": "#/$defs/id"
      },
      "sourceCommand": {
        "type": "string",
        "minLength": 1
      },
      "changeId": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 160
      },
      "adapter": {
        "type": "string",
        "enum": [
          "claude",
          "copilot",
          "unknown"
        ]
      },
      "state": {
        "type": "string",
        "enum": [
          "created",
          "running",
          "waiting-for-decision",
          "ready-to-resume",
          "resumed",
          "completed",
          "cancelled",
          "expired",
          "failed"
        ]
      },
      "requestedMode": {
        "type": [
          "string",
          "null"
        ],
        "enum": [
          "light",
          "standard",
          "strict",
          null
        ]
      },
      "activeDecisionIds": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/id"
        }
      },
      "answeredDecisionIds": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/id"
        }
      },
      "consumedDecisionIds": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/id"
        }
      },
      "lastCompletedStep": {
        "type": [
          "string",
          "null"
        ]
      },
      "nextStep": {
        "type": [
          "string",
          "null"
        ]
      },
      "lockIds": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/id"
        }
      },
      "resumeCapsulePath": {
        "type": [
          "string",
          "null"
        ],
        "maxLength": 500
      },
      "createdAt": {
        "$ref": "#/$defs/isoDateTime"
      },
      "lastSeenAt": {
        "$ref": "#/$defs/isoDateTime"
      },
      "expiresAt": {
        "type": [
          "string",
          "null"
        ],
        "format": "date-time"
      },
      "metadata": {
        "type": "object",
        "additionalProperties": true
      }
    },
    "required": [
      "schemaVersion",
      "commandRunId",
      "sourceCommand",
      "adapter",
      "state",
      "activeDecisionIds",
      "answeredDecisionIds",
      "consumedDecisionIds",
      "createdAt",
      "lastSeenAt"
    ],
    "$defs": {
      "confidence": {
        "type": "string",
        "enum": [
          "HIGH",
          "MEDIUM",
          "LOW"
        ]
      },
      "knowledgeType": {
        "type": "string",
        "enum": [
          "FACT",
          "INFERENCE",
          "ASSUMPTION",
          "UNKNOWN",
          "CONFLICT"
        ]
      },
      "isoDateTime": {
        "type": "string",
        "format": "date-time"
      },
      "id": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
      },
      "path": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500
      }
    }
  },
};
