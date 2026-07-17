/**
 * Resolves all runtime storage paths under a runtime root.
 *
 * Canonical layout (ADR + README):
 *   <root>/active.json
 *   <root>/index.json
 *   <root>/locks.json
 *   <root>/audit.jsonl
 *   <root>/sessions/<commandRunId>.json
 *   <root>/decisions/<decisionId>/decision.json
 *   <root>/decisions/<decisionId>/response.json
 *   <root>/decisions/<decisionId>/audit.jsonl
 *   <root>/capsules/<commandRunId>.json
 *   <root>/schema/*.schema.json
 */

import * as path from "node:path";

export class PathResolver {
  readonly root: string;
  readonly schemaDir: string;

  constructor(root: string, schemaDir?: string) {
    this.root = path.resolve(root);
    this.schemaDir = schemaDir ? path.resolve(schemaDir) : path.join(this.root, "schema");
  }

  active(): string {
    return path.join(this.root, "active.json");
  }

  index(): string {
    return path.join(this.root, "index.json");
  }

  locks(): string {
    return path.join(this.root, "locks.json");
  }

  repositoryAudit(): string {
    return path.join(this.root, "audit.jsonl");
  }

  sessionsDir(): string {
    return path.join(this.root, "sessions");
  }

  session(commandRunId: string): string {
    return path.join(this.sessionsDir(), `${commandRunId}.json`);
  }

  decisionsDir(): string {
    return path.join(this.root, "decisions");
  }

  decisionDir(decisionId: string): string {
    return path.join(this.decisionsDir(), decisionId);
  }

  decision(decisionId: string): string {
    return path.join(this.decisionDir(decisionId), "decision.json");
  }

  response(decisionId: string): string {
    return path.join(this.decisionDir(decisionId), "response.json");
  }

  decisionAudit(decisionId: string): string {
    return path.join(this.decisionDir(decisionId), "audit.jsonl");
  }

  capsulesDir(): string {
    return path.join(this.root, "capsules");
  }

  capsule(commandRunId: string): string {
    return path.join(this.capsulesDir(), `${commandRunId}.json`);
  }

  schema(schemaFileName: string): string {
    return path.join(this.schemaDir, schemaFileName);
  }

  /** Repo-relative-ish path for storing in index/session references. */
  relative(absolutePath: string): string {
    return path.relative(this.root, absolutePath).split(path.sep).join("/");
  }
}
