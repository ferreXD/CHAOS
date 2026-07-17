/**
 * Lightweight tool-argument validation helpers.
 *
 * These run inside handlers (so they are exercised by unit tests that bypass the
 * SDK/zod boundary) and throw `ToolInputError`, which maps to a VALIDATION_ERROR
 * tool result. The SDK also validates via zod at the transport boundary.
 */

import { ToolInputError } from "./errors.ts";

export type Args = Record<string, unknown>;

export function requireString(args: Args, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ToolInputError(`"${key}" is required and must be a non-empty string.`);
  }
  return value;
}

export function optionalString(args: Args, key: string): string | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ToolInputError(`"${key}" must be a string when provided.`);
  }
  return value;
}

export function optionalBool(args: Args, key: string, fallback: boolean): boolean {
  const value = args[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") {
    throw new ToolInputError(`"${key}" must be a boolean when provided.`);
  }
  return value;
}

export function optionalObject(args: Args, key: string): Record<string, unknown> | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ToolInputError(`"${key}" must be an object when provided.`);
  }
  return value as Record<string, unknown>;
}

/** Accept a string or array of strings; normalise to a string[]. */
export function optionalStringArray(args: Args, key: string): string[] | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value as string[];
  }
  throw new ToolInputError(`"${key}" must be a string or array of strings when provided.`);
}

export interface RawOption {
  id: string;
  label: string;
  description?: string | null;
  consequence?: string | null;
  risk?: string | null;
  recommended?: boolean;
}

function mapRawOptions(value: unknown[]): RawOption[] {
  return value.map((raw, i) => {
    if (typeof raw !== "object" || raw === null) {
      throw new ToolInputError(`options[${i}] must be an object.`);
    }
    const o = raw as Args;
    const id = o["id"];
    const label = o["label"];
    if (typeof id !== "string" || id.trim().length === 0) {
      throw new ToolInputError(`options[${i}].id is required.`);
    }
    if (typeof label !== "string" || label.trim().length === 0) {
      throw new ToolInputError(`options[${i}].label is required.`);
    }
    return {
      id,
      label,
      description: typeof o["description"] === "string" ? (o["description"] as string) : null,
      consequence: typeof o["consequence"] === "string" ? (o["consequence"] as string) : null,
      risk: typeof o["risk"] === "string" ? (o["risk"] as string) : null,
      recommended: o["recommended"] === true,
    };
  });
}

export function requireOptions(args: Args): RawOption[] {
  const value = args["options"];
  if (!Array.isArray(value) || value.length === 0) {
    throw new ToolInputError(`"options" is required and must be a non-empty array.`);
  }
  return mapRawOptions(value);
}

/** Options are optional here (freeform-input decisions may omit them). */
export function optionalOptions(args: Args): RawOption[] | undefined {
  const value = args["options"];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new ToolInputError(`"options" must be an array when provided.`);
  }
  return mapRawOptions(value);
}

export const INTERACTION_TYPES = [
  "single-choice-decision",
  "multi-choice-decision",
  "confirmation",
  "freeform-input",
] as const;

export type InteractionTypeValue = (typeof INTERACTION_TYPES)[number];

export function optionalInteractionType(args: Args): InteractionTypeValue | undefined {
  const value = args["interactionType"];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !INTERACTION_TYPES.includes(value as InteractionTypeValue)) {
    throw new ToolInputError(
      `"interactionType" must be one of: ${INTERACTION_TYPES.join(", ")}.`,
    );
  }
  return value as InteractionTypeValue;
}
