#!/usr/bin/env node
/**
 * CLI for the CHAOS Interaction Diagnostics package (Iteration 7).
 *
 * Read-only. Usable by `chaos:doctor` and `chaos:status`.
 *
 *   doctor   Markdown "Interaction Runtime" doctor report/section.
 *   status   Compact Interaction Runtime status block.
 *   json     Full structured health report.
 *
 * Flags: --root, --schema-dir, --repo-root, --runtime-dir, --section (doctor only),
 * --stale-lock-age-hours, --stale-decision-age-hours, --no-todo-candidates, --config.
 */

import { resolveDiagnosticsConfig } from "../config/diagnosticsConfig.ts";
import { generateHealthReport } from "../probes/registry.ts";
import { renderJson } from "../reporters/jsonReporter.ts";
import { renderStatusSummary } from "../reporters/statusSummaryReporter.ts";
import { renderDoctorSection } from "../reporters/markdownReporter.ts";
import { renderDoctorReport } from "../reporters/doctorReporter.ts";

function main(): number {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === "--help" || command === "help") {
    process.stdout.write(
      "Usage: chaos-interaction-diagnostics <doctor|status|json> [flags]\n" +
        "  doctor [--section]   Markdown Interaction Runtime report (or embeddable section)\n" +
        "  status               Compact Interaction Runtime status block\n" +
        "  json                 Full structured health report\n" +
        "Read-only: never mutates runtime state, never performs repair.\n",
    );
    return command ? 0 : 1;
  }

  const config = resolveDiagnosticsConfig(argv.slice(1));
  const report = generateHealthReport(config);

  switch (command) {
    case "doctor":
      process.stdout.write(
        argv.includes("--section") ? renderDoctorSection(report) + "\n" : renderDoctorReport(report) + "\n",
      );
      return 0;
    case "status":
      process.stdout.write(renderStatusSummary(report));
      return 0;
    case "json":
      process.stdout.write(renderJson(report));
      return 0;
    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      return 1;
  }
}

try {
  process.exit(main());
} catch (err) {
  process.stderr.write(
    `ERROR: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}\n`,
  );
  process.exit(1);
}
