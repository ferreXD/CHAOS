/**
 * Single bridge to the Iteration 1 runtime package.
 *
 * The runtime is consumed from source via a relative path (NOT a node_modules
 * dependency) because Node's built-in TypeScript type-stripping refuses to strip
 * types for files under node_modules. Keeping the import relative lets the runner
 * run headlessly with zero build step, exactly like the runtime and MCP packages.
 *
 * All other runner modules import runtime types/values from here so the
 * cross-package path is defined in exactly one place.
 */

export * from "../../chaos-interaction-runtime/src/index.ts";
