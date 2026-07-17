/**
 * Clock + identifier generation.
 *
 * Both are injectable so tests can be fully deterministic. Generated IDs
 * satisfy the schema `id` pattern `^[A-Za-z0-9][A-Za-z0-9._:-]*$`.
 */

export interface Clock {
  now(): Date;
}

export interface IdFactory {
  runId(sourceCommand: string, changeId: string | null): string;
  decisionId(changeId: string | null, sourceCommand: string, title: string): string;
  lockId(changeId: string): string;
  eventId(): string;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** Slugify arbitrary text into an id-safe fragment. */
export function slug(text: string, max = 40): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return s.length > 0 ? s : "x";
}

function datePart(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function rand(len = 6): string {
  let out = "";
  while (out.length < len) out += Math.random().toString(16).slice(2);
  return out.slice(0, len);
}

/** Default id factory (timestamp + slug + short random suffix). */
export function createIdFactory(clock: Clock): IdFactory {
  return {
    runId(sourceCommand, changeId) {
      const parts = ["RUN", datePart(clock.now()), slug(sourceCommand)];
      if (changeId) parts.push(slug(changeId));
      parts.push(rand());
      return parts.join("-");
    },
    decisionId(changeId, sourceCommand, title) {
      const key = changeId ?? sourceCommand;
      return ["DEC", datePart(clock.now()), slug(key), slug(title, 24), rand(4)].join("-");
    },
    lockId(changeId) {
      return ["LOCK", datePart(clock.now()), slug(changeId), rand(4)].join("-");
    },
    eventId() {
      return ["EVT", datePart(clock.now()), rand(8)].join("-");
    },
  };
}
