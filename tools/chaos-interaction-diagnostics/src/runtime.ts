/**
 * Single bridge to the Iteration 1 runtime package.
 *
 * Consumed from source via a relative path (NOT a node_modules dependency)
 * because Node's built-in TypeScript type-stripping refuses to strip types for
 * files under node_modules. Same pattern as the MCP and runner packages.
 *
 * Diagnostics is READ-ONLY: it uses the runtime's read APIs and schema validator;
 * it never mutates runtime state.
 */

export * from "../../chaos-interaction-runtime/src/index.ts";
