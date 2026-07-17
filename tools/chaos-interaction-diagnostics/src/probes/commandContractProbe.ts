/**
 * Probe 12: command-contract integration (read-only, additive-diagnostic only).
 *
 * This probe does NOT rewrite command contracts. It reports whether write-capable
 * commands reference the interaction runtime / mustStop / decision protocol, and
 * flags any contract that appears to instruct bypassing a pending decision.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { finding, type HealthFinding } from "../model/healthFinding.ts";
import { exists, rel, type ProbeContext } from "./probeContext.ts";
import { commandIntegrationCandidate } from "./todoHelpers.ts";

/** Write-capable commands that most benefit from runtime awareness. */
const WRITE_COMMANDS = ["chaos-apply", "chaos-verify", "chaos-archive"];

const RUNTIME_KEYWORDS = [
  "interaction runtime",
  "muststop",
  "pending decision",
  "chaos:resume",
  "decision center",
];

const BYPASS_PATTERNS = [
  /ignore (the )?pending decision/i,
  /bypass (the )?(pending )?decision/i,
  /proceed despite (a )?pending decision/i,
];

export function commandContractProbe(ctx: ProbeContext): HealthFinding[] {
  const out: HealthFinding[] = [];
  const commandsDir = path.join(ctx.config.repositoryRoot, ".claude", "commands");

  // Opt-out (policies.interactionRuntime.commands.enabled = false): integration is a
  // valid choice, not a gap. Still confirm chaos:resume exists.
  if (!ctx.config.commandsEnabled) {
    const resumeExists = exists(path.join(commandsDir, "chaos-resume.md"));
    return [
      finding({
        id: "IR-CMD-INTEGRATION-DISABLED",
        severity: "INFO",
        category: "command-contract",
        title: "Command runtime integration disabled by config",
        message:
          "policies.interactionRuntime.commands.enabled is false — CHAOS commands use " +
          "classic in-chat decisions. This is an accepted opt-out, not a gap." +
          (resumeExists ? "" : " (Note: chaos:resume command file is missing.)"),
        evidence: [".chaos/config.yaml → policies.interactionRuntime.commands.enabled=false"],
        recommendedActions: ["No action; runtime command integration is intentionally off."],
        confidence: "HIGH",
      }),
    ];
  }

  // chaos:resume must exist (Iteration 4).
  const resume = path.join(commandsDir, "chaos-resume.md");
  if (!exists(resume)) {
    out.push(
      finding({
        id: "IR-CMD-RESUME-MISSING",
        severity: "WARN",
        category: "command-contract",
        title: "chaos:resume command is missing",
        message: `Expected ${rel(ctx, resume)} (Iteration 4).`,
        evidence: [rel(ctx, resume)],
        affectedArtifacts: [rel(ctx, resume)],
        recommendedActions: ["Restore the chaos:resume command contract."],
      }),
    );
  }

  const integrated: string[] = [];
  const notIntegrated: string[] = [];
  for (const base of WRITE_COMMANDS) {
    const file = path.join(commandsDir, `${base}.md`);
    if (!exists(file)) continue;
    const text = fs.readFileSync(file, "utf8").toLowerCase();

    if (RUNTIME_KEYWORDS.some((k) => text.includes(k))) integrated.push(base);
    else notIntegrated.push(base);

    for (const re of BYPASS_PATTERNS) {
      if (re.test(text)) {
        out.push(
          finding({
            id: `IR-CMD-BYPASS-${base}`,
            severity: "ERROR",
            category: "command-contract",
            title: `${base} appears to instruct bypassing a pending decision`,
            message: `${rel(ctx, file)} contains language that may bypass the decision protocol.`,
            evidence: [rel(ctx, file)],
            affectedArtifacts: [rel(ctx, file)],
            recommendedActions: ["Review and remove any bypass-pending-decision guidance."],
            confidence: "MEDIUM",
          }),
        );
      }
    }
  }

  const considered = integrated.length + notIntegrated.length;
  if (considered > 0 && notIntegrated.length > 0) {
    // Report integration coverage. Material only when write commands lack any
    // runtime awareness (Iteration 6 integration incomplete).
    out.push(
      finding({
        id: "IR-CMD-INTEGRATION-PARTIAL",
        severity: "INFO",
        category: "command-contract",
        title: `Runtime integration ${integrated.length}/${considered} write commands`,
        message:
          `Referencing runtime: ${integrated.join(", ") || "(none)"}. ` +
          `Not referencing: ${notIntegrated.join(", ")}. (Iteration 6 integration.)`,
        evidence: notIntegrated.map((b) => rel(ctx, path.join(commandsDir, `${b}.md`))),
        affectedArtifacts: notIntegrated,
        recommendedActions: [
          "This diagnostic does not rewrite command contracts.",
          "Align write commands with the runtime/decision protocol in a scoped change (Iteration 6).",
        ],
        todoCandidate:
          integrated.length === 0
            ? commandIntegrationCandidate(
                ctx,
                path.join(commandsDir, `${notIntegrated[0]}.md`),
                notIntegrated[0]!.replace("chaos-", "chaos:"),
              )
            : undefined,
        confidence: "MEDIUM",
      }),
    );
  } else if (considered > 0) {
    out.push(
      finding({
        id: "IR-CMD-INTEGRATION-OK",
        severity: "OK",
        category: "command-contract",
        title: "Write commands reference the runtime",
        message: `All ${considered} inspected write command(s) reference the interaction runtime/decision protocol.`,
        evidence: integrated.map((b) => rel(ctx, path.join(commandsDir, `${b}.md`))),
      }),
    );
  }

  return out;
}
