/**
 * Controller interface shared by the command modules and implemented by the
 * extension. Kept in a neutral module to avoid a circular dependency between
 * `extension.ts` and `commands/*`.
 */

export interface DecisionCenterController {
  /** Open/reveal the Decision Center panel. */
  open(focus: boolean): void;
  /** Recompute the projection and update the panel + status bar. */
  refresh(): void;
  /** Cancel the command session owning the active decision (with confirmation). */
  cancelActiveDecision(): Promise<void>;
  /** Pick a ready-to-resume session and copy its resume instruction. */
  copyResumeInstructionInteractive(): Promise<void>;
}
