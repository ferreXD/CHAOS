/**
 * CHAOS Interaction Runtime — public API (Iteration 1).
 *
 * File-backed interaction state layer. See README.md and the Iteration 0
 * contracts under `.chaos/interactions/`.
 */

export { InteractionRuntime } from "./services/interactionRuntime.ts";
export type {
  RuntimeOptions,
  BeginCommandInput,
  BeginResult,
  BeginStatus,
  CreateDecisionArgs,
  CreateDecisionResult,
  CreateDecisionStatus,
  AnswerDecisionArgs,
  AnswerResult,
  ActiveDecisionResult,
  DecisionResponseResult,
  LockView,
  Envelope,
} from "./services/interactionRuntime.ts";

export { PathResolver } from "./store/pathResolver.ts";
export { InteractionStore } from "./store/interactionStore.ts";
export {
  MalformedStateError,
  atomicWriteJson,
  readJson,
  readJsonIfExists,
} from "./store/atomicWrite.ts";
export {
  SchemaValidationError,
  validateAgainstSchemaFile,
  validateAgainstSchema,
} from "./store/schemaValidation.ts";
export {
  createIdFactory,
  systemClock,
  slug,
  type Clock,
  type IdFactory,
} from "./services/identifiers.ts";
export {
  RuntimeError,
  InvalidStateTransitionError,
  InvalidDecisionPayloadError,
  NotFoundError,
} from "./services/errors.ts";

export {
  SCHEMA_FILES,
  DEFAULT_COMPATIBLE_COMMANDS,
  DEFAULT_BLOCKED_COMMANDS,
  normalizeCommand,
  isCompatibleWithLock,
} from "./validation/schemas.ts";

// Model types + state machines.
export * from "./model/commandSession.ts";
export * from "./model/decision.ts";
export * from "./model/response.ts";
export * from "./model/lock.ts";
export * from "./model/resumeCapsule.ts";
export * from "./model/auditEvent.ts";
export * from "./model/activeState.ts";
