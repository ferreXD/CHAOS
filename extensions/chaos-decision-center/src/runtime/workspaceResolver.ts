/**
 * Resolve the interaction runtime root + schema directory from the workspace
 * folder and configuration. Pure (no vscode) so it is unit-testable.
 */

import * as path from "node:path";
import * as fs from "node:fs";

export interface ResolvedPaths {
  root: string;
  schemaDir: string;
}

/**
 * @param workspaceFolder Absolute path of the active workspace folder, or undefined.
 * @param interactionsRoot Config value (relative to workspace, or absolute).
 * @param schemaDir Config value (relative to workspace, or absolute).
 */
export function resolveInteractionPaths(
  workspaceFolder: string | undefined,
  interactionsRoot: string,
  schemaDir: string,
): ResolvedPaths {
  const base = workspaceFolder ?? process.cwd();
  const root = path.isAbsolute(interactionsRoot)
    ? interactionsRoot
    : path.resolve(base, interactionsRoot);
  const resolvedSchema = path.isAbsolute(schemaDir)
    ? schemaDir
    : path.resolve(base, schemaDir);
  return { root, schemaDir: resolvedSchema };
}

/**
 * Locate the interaction runtime, tolerating the case where the workspace folder
 * is a sub-directory of the repository (or the dev host opened an ancestor).
 *
 * For a relative `interactionsRoot`, this walks up from `workspaceFolder` and
 * returns the first ancestor whose `<ancestor>/<interactionsRoot>` exists. If
 * none exists (or the config is absolute), it falls back to the direct
 * resolution against the workspace folder, so callers can report the primary
 * path that was checked. `exists` is injectable for testing.
 */
export function findInteractionPaths(
  workspaceFolder: string | undefined,
  interactionsRoot: string,
  schemaDir: string,
  exists: (p: string) => boolean = fs.existsSync,
): ResolvedPaths {
  if (path.isAbsolute(interactionsRoot)) {
    return resolveInteractionPaths(workspaceFolder, interactionsRoot, schemaDir);
  }
  const base = workspaceFolder ?? process.cwd();
  let dir = base;
  // Walk up ancestors looking for <dir>/<interactionsRoot>.
  for (;;) {
    const candidate = path.resolve(dir, interactionsRoot);
    if (exists(candidate)) {
      const resolvedSchema = path.isAbsolute(schemaDir)
        ? schemaDir
        : path.resolve(dir, schemaDir);
      return { root: candidate, schemaDir: resolvedSchema };
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Not found anywhere — return the primary candidate against the workspace.
  return resolveInteractionPaths(workspaceFolder, interactionsRoot, schemaDir);
}
