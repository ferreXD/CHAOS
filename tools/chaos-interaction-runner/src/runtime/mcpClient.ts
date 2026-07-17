/**
 * MCP integration for the runner.
 *
 * Design boundary (important, and deliberately un-magical):
 *
 * - The runner itself does NOT call MCP tools. The *agent* it launches is the MCP
 *   client — the agent calls `chaos_begin_command`, `chaos_create_decision`,
 *   `chaos_mark_decision_consumed`, `chaos_complete_command`, etc.
 * - The runner and the MCP server both sit over the same file-backed runtime, so
 *   the runner observes state by reading the runtime directly (see RuntimeClient).
 *
 * This module's job is therefore narrow and honest: prepare the environment the
 * spawned agent process needs so its MCP server points at the same interaction
 * root the runner is watching. It does not spawn or speak MCP itself.
 */

import type { RunnerConfig } from "../config/runnerConfig.ts";

/** MCP tools the launched agent is expected to use over the shared runtime. */
export const AGENT_MCP_TOOLS = [
  "chaos_begin_command",
  "chaos_create_decision",
  "chaos_get_active_decision",
  "chaos_get_decision_response",
  "chaos_mark_decision_consumed",
  "chaos_complete_command",
  "chaos_find_resume_candidates",
  "chaos_get_resume_capsule",
] as const;

/**
 * Environment variables to merge into the spawned agent process so any MCP server
 * it launches resolves the same `.chaos/interactions` root the runner controls.
 */
export function agentMcpEnv(config: RunnerConfig): Record<string, string> {
  return {
    CHAOS_REPOSITORY_ROOT: config.repositoryRoot,
    CHAOS_INTERACTIONS_ROOT: config.interactionsRoot,
    CHAOS_INTERACTIONS_SCHEMA_DIR: config.schemaDir,
  };
}
