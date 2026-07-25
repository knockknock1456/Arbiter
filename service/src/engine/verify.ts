/**
 * verify.ts — fact-check the deliverable's claims against the LIVE web.
 *
 * Catches confident-but-false work: a report can look complete and still lie.
 * Ported straight from Tribunal (extractor + web search + classify).
 *
 * BUILD PLAN (Phase 1):
 *  [ ] extract load-bearing factual claims from the deliverable
 *  [ ] web search each (Tavily) -> confirmed|outdated|contradicted|unverifiable
 *  [ ] return statuses + source links (evidence for the report)
 */
export type ClaimCheck = { claim: string; status: string; sources: string[] };

export async function verifyClaims(deliverable: string): Promise<ClaimCheck[]> {
  // TODO(Phase 1): port Tribunal verify.ts. Scaffold returns nothing.
  return [];
}
