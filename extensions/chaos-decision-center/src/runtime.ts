/**
 * Single bridge to the Iteration 1 runtime package.
 *
 * The runtime is consumed from source via a relative path (not a node_modules
 * dependency). This keeps the pure logic modules unit-testable under Node's
 * TypeScript type-stripping, and the extension build compiles the runtime into
 * `dist/` alongside the extension.
 */

export * from "../../../tools/chaos-interaction-runtime/src/index.ts";
