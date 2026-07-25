/**
 * judge.ts — synthesise ONE verdict (pass/fail) + an evidence report.
 *
 * Takes the panel findings + web checks, decides pass/fail, and produces the
 * report whose keccak256 hash goes on-chain as the verdict's `reason`.
 *
 * BUILD PLAN (Phase 1):
 *  [ ] buildChecklist -> runPanel -> verifyClaims -> synthesise verdict
 *  [ ] pass rule: all deterministic items pass AND panel majority pass AND
 *      no load-bearing claim contradicted
 *  [ ] emit { passed, perItem, report, reportHash }
 *  [ ] prompt-injection hardened; report is human-readable "show your work"
 */
import type { Job } from '../watcher.js';
import { buildChecklist } from './checklist.js';
import { runPanel } from './panel.js';
import { verifyClaims } from './verify.js';

export type Verdict = { passed: boolean; reportHash: `0x${string}`; report: string };

export async function runCourt(job: Job): Promise<Verdict> {
  const items = await buildChecklist(job.brief);
  const findings = await runPanel(job.deliverable, items);
  const checks = await verifyClaims(job.deliverable);
  // TODO(Phase 1): combine -> pass/fail + report + keccak256(report) as reportHash
  return { passed: false, reportHash: '0x00', report: '(scaffold)' };
}
