/**
 * Builds the compact, structured resume message the runner sends into a live
 * agent session when a decision is answered.
 *
 * Hard rule: reference paths, never inline large artifact bodies. The message is
 * a pointer into runtime state (the source of truth), not a transcript replay.
 */

export interface ResumeMessageInput {
  commandRunId: string;
  changeId: string | null;
  sourceCommand: string;
  decisionId: string;
  selectedOptionId: string;
  selectedOptionLabel?: string | null;
  rationale?: string | null;
  capsulePath: string | null;
  nextStep: string | null;
  cycle: number;
}

export interface AgentResumeInput {
  decisionId: string;
  selectedOptionId: string;
  message: string;
}

/** Cap on the rationale echoed back — keep the message compact. */
const MAX_RATIONALE = 280;

export function buildResumeMessage(input: ResumeMessageInput): string {
  const lines: string[] = [];
  lines.push("CHAOS decision answered.");
  lines.push("");
  lines.push(`Decision ID: ${input.decisionId}`);
  lines.push(
    `Selected option: ${input.selectedOptionId}` +
      (input.selectedOptionLabel ? ` (${clamp(input.selectedOptionLabel, 120)})` : ""),
  );
  if (input.rationale && input.rationale.trim()) {
    lines.push(`Rationale: ${clamp(input.rationale.trim(), MAX_RATIONALE)}`);
  }
  lines.push("");
  lines.push("Resume from runtime state (the interaction runtime is the source of truth):");
  lines.push(`- commandRunId: ${input.commandRunId}`);
  lines.push(`- changeId: ${input.changeId ?? "(none)"}`);
  lines.push(`- sourceCommand: ${input.sourceCommand}`);
  lines.push(`- capsule: ${input.capsulePath ?? "(none — reconstruct from session state)"}`);
  if (input.nextStep) lines.push(`- nextStep: ${clamp(input.nextStep, 240)}`);
  lines.push(`- autoResumeCycle: ${input.cycle}`);
  lines.push("");
  lines.push(
    "Continue the original command from the capsule nextStep. Do not reread the entire " +
      "repository unless the source command contract requires it. Do not invent context.",
  );
  return lines.join("\n");
}

export function buildAgentResumeInput(input: ResumeMessageInput): AgentResumeInput {
  return {
    decisionId: input.decisionId,
    selectedOptionId: input.selectedOptionId,
    message: buildResumeMessage(input),
  };
}

function clamp(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) + "…" : value;
}
