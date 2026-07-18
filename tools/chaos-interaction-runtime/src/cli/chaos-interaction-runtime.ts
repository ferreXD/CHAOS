#!/usr/bin/env node
/**
 * Minimal CLI for smoke-testing the interaction runtime.
 *
 * Development/validation only — NOT required for normal CHAOS use.
 *
 * Examples:
 *   node src/cli/chaos-interaction-runtime.ts begin-command --command chaos:propose --change request-context-middleware
 *   node src/cli/chaos-interaction-runtime.ts create-decision --run <runId> --title "Choose execution profile" \
 *        --option full-strict --option strict-risk-compact --recommended strict-risk-compact
 *   node src/cli/chaos-interaction-runtime.ts create-decision --run <runId> --title "Provide the value" \
 *        --interaction-type freeform-input     # freeform needs no --option
 *   node src/cli/chaos-interaction-runtime.ts answer-decision --decision <decisionId> --selected strict-risk-compact --by vscode-user
 *   node src/cli/chaos-interaction-runtime.ts get-response --decision <decisionId>
 *   node src/cli/chaos-interaction-runtime.ts list-locks
 *
 * Global flags:
 *   --root <dir>        runtime root (default: .chaos/interactions)
 *   --schema-dir <dir>  schema dir (default: <root>/schema)
 *   --no-validate       disable schema validation on write
 */

import * as path from "node:path";
import { InteractionRuntime } from "../services/interactionRuntime.ts";
import type { DecisionOption, InteractionType } from "../model/decision.ts";

const INTERACTION_TYPES: InteractionType[] = [
  "single-choice-decision",
  "multi-choice-decision",
  "confirmation",
  "freeform-input",
];

function parseInteractionType(value: string | undefined): InteractionType | undefined {
  if (value === undefined) return undefined;
  if (!INTERACTION_TYPES.includes(value as InteractionType)) {
    throw new Error(`--interaction-type must be one of: ${INTERACTION_TYPES.join(", ")}`);
  }
  return value as InteractionType;
}

interface ParsedArgs {
  _: string[];
  flags: Map<string, string[]>;
  bools: Set<string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const _: string[] = [];
  const flags = new Map<string, string[]>();
  const bools = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        bools.add(key);
      } else {
        const list = flags.get(key) ?? [];
        list.push(next);
        flags.set(key, list);
        i++;
      }
    } else {
      _.push(token);
    }
  }
  return { _, flags, bools };
}

function one(args: ParsedArgs, key: string): string | undefined {
  return args.flags.get(key)?.[0];
}

function all(args: ParsedArgs, key: string): string[] {
  return args.flags.get(key) ?? [];
}

function print(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

function main(): number {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const command = args._[0];

  if (!command || args.bools.has("help")) {
    process.stdout.write(
      "Usage: chaos-interaction-runtime <command> [flags]\n" +
        "Commands: begin-command, create-decision, answer-decision, get-active-decision,\n" +
        "          get-response, mark-consumed, complete-command, cancel-command,\n" +
        "          list-locks, create-capsule\n",
    );
    return command ? 0 : 1;
  }

  const root = one(args, "root") ?? path.join(".chaos", "interactions");
  const runtime = new InteractionRuntime({
    root,
    schemaDir: one(args, "schema-dir"),
    validate: !args.bools.has("no-validate"),
  });

  switch (command) {
    case "begin-command": {
      const result = runtime.beginCommand({
        sourceCommand: req(one(args, "command"), "--command"),
        changeId: one(args, "change") ?? null,
        adapter: (one(args, "adapter") as any) ?? "unknown",
        requestedMode: (one(args, "mode") as any) ?? null,
        commandRunId: one(args, "run"),
      });
      print(result);
      return 0;
    }
    case "create-decision": {
      const optionIds = all(args, "option");
      const recommended = one(args, "recommended") ?? null;
      const options: DecisionOption[] = optionIds.map((id) => ({
        id,
        label: id,
        recommended: id === recommended,
      }));
      // --interaction-type single-choice-decision | multi-choice-decision | confirmation | freeform-input.
      // freeform-input needs no --option (a placeholder is supplied).
      const result = runtime.createDecision({
        commandRunId: req(one(args, "run"), "--run"),
        changeId: one(args, "change") ?? null,
        title: req(one(args, "title"), "--title"),
        context: one(args, "context") ?? `Decision created via CLI for ${one(args, "title")}.`,
        interactionType: parseInteractionType(one(args, "interaction-type")),
        options,
        recommendedOptionId: recommended,
        requiresRationale: args.bools.has("requires-rationale"),
      });
      print(result);
      return 0;
    }
    case "answer-decision": {
      const result = runtime.answerDecision({
        decisionId: req(one(args, "decision"), "--decision"),
        selectedOptionId: req(one(args, "selected"), "--selected"),
        selectedBy: one(args, "by") ?? "cli-user",
        rationale: one(args, "rationale") ?? null,
        source: one(args, "source") ?? "cli",
      });
      print(result);
      return 0;
    }
    case "get-active-decision": {
      print(
        runtime.getActiveDecision({
          changeId: one(args, "change") ?? null,
          commandRunId: one(args, "run"),
        }),
      );
      return 0;
    }
    case "get-response": {
      print(runtime.getDecisionResponse(req(one(args, "decision"), "--decision")));
      return 0;
    }
    case "mark-consumed": {
      print(runtime.markDecisionConsumed(req(one(args, "decision"), "--decision")));
      return 0;
    }
    case "complete-command": {
      print(runtime.completeCommand(req(one(args, "run"), "--run")));
      return 0;
    }
    case "cancel-command": {
      print(runtime.cancelCommand(req(one(args, "run"), "--run")));
      return 0;
    }
    case "list-locks": {
      print({ locks: runtime.listLocks() });
      return 0;
    }
    case "create-capsule": {
      print(
        runtime.createResumeCapsule(req(one(args, "run"), "--run"), {
          intent: one(args, "intent"),
          nextStep: one(args, "next-step"),
        }),
      );
      return 0;
    }
    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      return 1;
  }
}

function req(value: string | undefined, flag: string): string {
  if (value === undefined) {
    process.stderr.write(`Missing required flag ${flag}\n`);
    process.exit(2);
  }
  return value;
}

try {
  process.exit(main());
} catch (err) {
  process.stderr.write(
    `ERROR: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}\n`,
  );
  process.exit(1);
}
