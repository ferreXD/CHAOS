/**
 * EA-X4 abuse suite — tiny deterministic PRNG (seedable LCG).
 *
 * The abuse suite must be reproducible: every kill point, jitter, and variant
 * choice derives from a per-iteration integer seed that we record in the run
 * log. This is a classic 32-bit LCG (numerical-recipes constants) — good enough
 * to spread kill timing, never used for anything security-sensitive.
 */

export class Prng {
  private state: number;
  constructor(seed: number) {
    // Avoid a zero state; fold the seed into the 32-bit space.
    this.state = (seed >>> 0) === 0 ? 0x9e3779b9 : seed >>> 0;
  }
  /** Next float in [0, 1). */
  next(): number {
    // Numerical Recipes LCG.
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  /** Pick one element. */
  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)]!;
  }
}
