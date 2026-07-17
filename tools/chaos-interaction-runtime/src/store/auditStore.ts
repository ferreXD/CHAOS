/**
 * Append-only audit persistence.
 *
 * Every mutating operation appends an event to the repository-level audit log
 * (`.chaos/interactions/audit.jsonl`). Decision-scoped events are additionally
 * appended to `.chaos/interactions/decisions/<decisionId>/audit.jsonl`.
 */

import type { AuditEvent } from "../model/auditEvent.ts";
import { SCHEMA_FILES } from "../validation/schemas.ts";
import { appendJsonl, readJsonl } from "./atomicWrite.ts";
import type { PathResolver } from "./pathResolver.ts";
import { validateAgainstSchemaFile } from "./schemaValidation.ts";

export class AuditStore {
  private readonly paths: PathResolver;
  private readonly validate: boolean;
  constructor(paths: PathResolver, validate: boolean) {
    this.paths = paths;
    this.validate = validate;
  }

  append(event: AuditEvent): void {
    if (this.validate) {
      validateAgainstSchemaFile(
        `audit-event ${event.eventId}`,
        this.paths.schema(SCHEMA_FILES.auditEvent),
        event,
      );
    }
    appendJsonl(this.paths.repositoryAudit(), event);
    if (event.decisionId) {
      appendJsonl(this.paths.decisionAudit(event.decisionId), event);
    }
  }

  readRepositoryAudit(): AuditEvent[] {
    return readJsonl<AuditEvent>(this.paths.repositoryAudit());
  }

  readDecisionAudit(decisionId: string): AuditEvent[] {
    return readJsonl<AuditEvent>(this.paths.decisionAudit(decisionId));
  }
}
