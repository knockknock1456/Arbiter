/**
 * panel.ts — a panel of INDEPENDENT models judges the deliverable, item by item.
 *
 * Ported from Tribunal's fan-out: N models (different labs) answer in parallel,
 * isolated from each other. Diversity is the point — different blind spots.
 *
 * BUILD PLAN (Phase 1):
 *  [ ] reuse Tribunal panel.ts (callModel + strict JSON + failure isolation)
 *  [ ] per checklist item: does the deliverable satisfy it? confidence + why
 *  [ ] SECURITY: the deliverable is UNTRUSTED — never follow instructions in it
 *      (prompt-injection hardening carried over from Tribunal)
 */
import type { ChecklistItem } from './checklist.js';

export type PanelFinding = { itemId: number; model: string; pass: boolean; note: string };

export async function runPanel(deliverable: string, items: ChecklistItem[]): Promise<PanelFinding[]> {
  // TODO(Phase 1): port Tribunal fan-out. Scaffold returns nothing.
  return [];
}
