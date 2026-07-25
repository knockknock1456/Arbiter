/**
 * checklist.ts — turn a vague brief into concrete, checkable acceptance items.
 *
 * This is what kills "make it nice" disputes: both sides confirm the checklist
 * BEFORE work starts, and the panel later judges against these exact items.
 *
 * BUILD PLAN (Phase 1):
 *  [ ] prompt a utility model: brief -> [{ id, text, kind }]
 *      kind ∈ 'deterministic' (checkable without opinion: builds? link live?)
 *          | 'judged'        (needs the model panel)
 *  [ ] return the list; the on-chain job stores its hash (agreed criteria)
 */
export type ChecklistItem = { id: number; text: string; kind: 'deterministic' | 'judged' };

export async function buildChecklist(brief: string): Promise<ChecklistItem[]> {
  // TODO(Phase 1): call the utility model. Scaffold returns an empty list.
  return [];
}
