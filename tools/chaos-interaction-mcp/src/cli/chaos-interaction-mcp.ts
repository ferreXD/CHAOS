#!/usr/bin/env node
/**
 * CHAOS Interaction MCP server — stdio entrypoint.
 *
 * Starts the MCP server over stdio. stdout is the protocol channel; ALL logging
 * goes to stderr.
 *
 * Usage:
 *   node src/cli/chaos-interaction-mcp.ts [--root <dir>] [--schema-dir <dir>]
 *        [--repo-root <dir>] [--no-validate] [--log-level <level>] [--config <file>]
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { resolveConfig } from "../config.ts";
import { createLogger } from "../logger.ts";
import { createRuntime } from "../runtimeFactory.ts";
import { autoSeedSchemas, ensureWorkspace, seedSchemas } from "../schemaSeed.ts";
import { createMcpServer, SERVER_NAME, SERVER_VERSION } from "../server.ts";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.includes("--help") || argv.includes("-h")) {
    process.stderr.write(
      `${SERVER_NAME} v${SERVER_VERSION} (stdio MCP server)\n` +
        "Flags: --root <dir> --schema-dir <dir> --repo-root <dir> --no-validate " +
        "--log-level <debug|info|warn|error|silent> --config <file>\n" +
        "Modes: --seed-schemas [--force] (write embedded schemas to the schema dir and exit)\n",
    );
    return;
  }

  const config = resolveConfig(argv);

  if (argv.includes("--seed-schemas")) {
    const result = seedSchemas(config.schemaDir, { force: argv.includes("--force") });
    process.stderr.write(
      `[${SERVER_NAME}] seeded schemas into ${config.schemaDir} ` +
        `(written: ${result.written.length}, skipped existing: ${result.skipped.length})\n`,
    );
    return;
  }

  const logger = createLogger(config.logLevel);
  logger.info("Starting CHAOS Interaction MCP server", {
    root: config.root,
    schemaDir: config.schemaDir,
    validate: config.validate,
  });

  const seeded = autoSeedSchemas(config.root, config.schemaDir);
  if (seeded && seeded.written.length > 0) {
    logger.info("Seeded missing interaction schemas", {
      schemaDir: config.schemaDir,
      written: seeded.written.length,
    });
  }

  const runtime = createRuntime(config);
  const server = createMcpServer(runtime, logger, {
    ensureWorkspace: () => {
      const seeded = ensureWorkspace(config.root, config.schemaDir);
      if (seeded.written.length > 0) {
        logger.info("Materialised the interaction workspace", {
          root: config.root,
          schemasWritten: seeded.written.length,
        });
      }
    },
  });
  const transport = new StdioServerTransport();

  await server.connect(transport);
  logger.info("MCP server connected over stdio. Waiting for requests.");
}

main().catch((err) => {
  process.stderr.write(
    `[chaos-interaction-mcp] FATAL ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}\n`,
  );
  process.exit(1);
});
