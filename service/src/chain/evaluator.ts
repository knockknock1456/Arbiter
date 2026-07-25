/**
 * evaluator.ts — send the verdict on-chain (this is the call that moves USDC).
 *
 * BUILD PLAN (Phase 2/3):
 *  [ ] via our ArbiterEvaluator contract, call deliverPass/deliverFail
 *      (which relay complete/reject on ERC-8183)
 *  [ ] pass the reportHash as the on-chain `reason` (evidence anchor)
 *  [ ] must land before the job's expiredAt (SLA in minutes, expiry in hours)
 */
import type { Verdict } from '../engine/judge.js';

export async function settle(jobId: bigint, verdict: Verdict): Promise<void> {
  // TODO(Phase 2/3): send tx via walletClient. Scaffold logs only.
  console.log(`settle: job ${jobId} -> ${verdict.passed ? 'deliverPass' : 'deliverFail'} (${verdict.reportHash})`);
}
