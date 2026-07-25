/**
 * Watches the ERC-8183 AgenticCommerce contract for JobSubmitted events and
 * hands each job to a callback.
 *
 * BUILD PLAN (Phase 2):
 *  [ ] viem publicClient.watchContractEvent on ERC8183_ADDRESS
 *  [ ] on JobSubmitted(jobId, provider, deliverable):
 *        - read the job (getJob) for the brief/description
 *        - resolve the deliverable (hash -> off-chain content: IPFS/URL)
 *        - call onJob({ jobId, brief, deliverable })
 *  [ ] only handle jobs whose evaluator == our ArbiterEvaluator address
 */
export type Job = { jobId: bigint; brief: string; deliverable: string };

export async function watchJobs(onJob: (job: Job) => Promise<void>): Promise<void> {
  // TODO(Phase 2): real event subscription. Placeholder keeps the process alive.
  console.log('watcher: (scaffold) waiting for JobSubmitted events…');
}
