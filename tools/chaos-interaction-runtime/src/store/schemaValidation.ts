/**
 * Pragmatic JSON Schema validator.
 *
 * This is NOT a full JSON Schema (2020-12) implementation. It deliberately
 * supports only the keyword subset used by the Iteration 0 schemas under
 * `.chaos/interactions/schema/`, so that runtime artifacts are validated
 * against the authoritative schemas without pulling in a heavy dependency.
 *
 * Supported: type (incl. array-of-types + "null"), const, enum, minLength,
 * maxLength, minItems, pattern, format ("date-time", advisory), properties,
 * required, additionalProperties (boolean | schema), items, and local
 * "$ref": "#/$defs/..." resolution.
 *
 * Limitation: keywords outside this subset are ignored. This is documented in
 * the README and PATCH-SUMMARY as an intentional, contract-scoped fallback.
 */

import { readJson } from "./atomicWrite.ts";

export interface ValidationError {
  path: string;
  message: string;
}

export class SchemaValidationError extends Error {
  readonly errors: ValidationError[];
  readonly artifact: string;
  constructor(artifact: string, errors: ValidationError[]) {
    super(
      `Schema validation failed for ${artifact}:\n` +
        errors.map((e) => `  - ${e.path || "<root>"}: ${e.message}`).join("\n"),
    );
    this.name = "SchemaValidationError";
    this.errors = errors;
    this.artifact = artifact;
  }
}

type JsonSchema = Record<string, any>;

// Accepts both trailing-Z and numeric-offset ISO-8601 date-times.
const DATE_TIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function matchesType(value: unknown, type: string): boolean {
  switch (type) {
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "number":
      return typeof value === "number";
    case "string":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
    case "object":
      return typeOf(value) === "object";
    case "array":
      return Array.isArray(value);
    case "null":
      return value === null;
    default:
      return false;
  }
}

function resolveRef(root: JsonSchema, ref: string): JsonSchema {
  if (!ref.startsWith("#/")) {
    throw new Error(`Unsupported $ref (only local refs are supported): ${ref}`);
  }
  const segments = ref.slice(2).split("/");
  let node: any = root;
  for (const seg of segments) {
    const key = seg.replace(/~1/g, "/").replace(/~0/g, "~");
    node = node?.[key];
    if (node === undefined) throw new Error(`Cannot resolve $ref: ${ref}`);
  }
  return node as JsonSchema;
}

function validateNode(
  root: JsonSchema,
  schema: JsonSchema,
  value: unknown,
  path: string,
  errors: ValidationError[],
): void {
  if (schema.$ref) {
    validateNode(root, resolveRef(root, schema.$ref), value, path, errors);
    return;
  }

  // type
  if (schema.type !== undefined) {
    const types: string[] = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(value, t))) {
      errors.push({ path, message: `expected type ${types.join(" | ")}, got ${typeOf(value)}` });
      return; // further checks are meaningless on a type mismatch
    }
  }

  // const
  if ("const" in schema && value !== schema.const) {
    errors.push({ path, message: `must equal const ${JSON.stringify(schema.const)}` });
  }

  // enum
  if (Array.isArray(schema.enum) && !schema.enum.some((e: unknown) => e === value)) {
    errors.push({ path, message: `must be one of ${JSON.stringify(schema.enum)}` });
  }

  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) {
      errors.push({ path, message: `shorter than minLength ${schema.minLength}` });
    }
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) {
      errors.push({ path, message: `longer than maxLength ${schema.maxLength}` });
    }
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern).test(value)) {
      errors.push({ path, message: `does not match pattern ${schema.pattern}` });
    }
    if (schema.format === "date-time" && !DATE_TIME_RE.test(value)) {
      errors.push({ path, message: `is not a valid date-time` });
    }
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      errors.push({ path, message: `has fewer than minItems ${schema.minItems}` });
    }
    if (schema.items) {
      value.forEach((item, i) => validateNode(root, schema.items, item, `${path}[${i}]`, errors));
    }
  }

  if (typeOf(value) === "object") {
    const obj = value as Record<string, unknown>;
    const props: Record<string, JsonSchema> = schema.properties ?? {};

    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in obj)) errors.push({ path, message: `missing required property "${key}"` });
      }
    }

    for (const [key, val] of Object.entries(obj)) {
      const childPath = path ? `${path}.${key}` : key;
      if (props[key]) {
        validateNode(root, props[key], val, childPath, errors);
      } else if (schema.additionalProperties === false) {
        errors.push({ path: childPath, message: `additional property not allowed` });
      } else if (typeOf(schema.additionalProperties) === "object") {
        validateNode(root, schema.additionalProperties, val, childPath, errors);
      }
    }
  }
}

const schemaCache = new Map<string, JsonSchema>();

export function loadSchema(schemaPath: string): JsonSchema {
  const cached = schemaCache.get(schemaPath);
  if (cached) return cached;
  const schema = readJson<JsonSchema>(schemaPath);
  schemaCache.set(schemaPath, schema);
  return schema;
}

/** Validate `data` against the schema at `schemaPath`. Throws on failure. */
export function validateAgainstSchemaFile(
  artifactLabel: string,
  schemaPath: string,
  data: unknown,
): void {
  const schema = loadSchema(schemaPath);
  const errors: ValidationError[] = [];
  validateNode(schema, schema, data, "", errors);
  if (errors.length > 0) throw new SchemaValidationError(artifactLabel, errors);
}

/** Test seam: validate against an in-memory schema object. */
export function validateAgainstSchema(
  artifactLabel: string,
  schema: JsonSchema,
  data: unknown,
): ValidationError[] {
  const errors: ValidationError[] = [];
  validateNode(schema, schema, data, "", errors);
  return errors;
}
