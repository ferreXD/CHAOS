/** JSON reporter: the full structured health report. */

import type { InteractionRuntimeHealthReport } from "../model/healthReport.ts";

export function renderJson(report: InteractionRuntimeHealthReport): string {
  return JSON.stringify(report, null, 2) + "\n";
}
