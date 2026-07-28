import { publicClient, ADDRESSES, evaluatorWallet } from './arc.js';
import { ERC8183_ABI } from './abi.js';

/**
 * WATCHER — listen for work submissions on jobs where WE are the evaluator,
 * then hand the job to the court.
 */

export async function readJob(jobId) {
  return publicClient.readContract({
    address: ADDRESSES.erc8183,
    abi: ERC8183_ABI,
    functionName: 'getJob',
    args: [BigInt(jobId)],
  });
}

export function watchSubmissions(onJob) {
  const w = evaluatorWallet();
  const me = w?.account?.address?.toLowerCase();

  return publicClient.watchContractEvent({
    address: ADDRESSES.erc8183,
    abi: ERC8183_ABI,
    eventName: 'JobSubmitted',
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const jobId = log.args.jobId;
          const job = await readJob(jobId);
          // only judge jobs that named us as the evaluator
          if (me && job.evaluator?.toLowerCase() !== me) continue;
          await onJob({
            jobId,
            brief: job.description,
            deliverableHash: log.args.deliverable,
            client: job.client,
            provider: job.provider,
            budget: job.budget,
            expiredAt: job.expiredAt,
          });
        } catch (e) {
          console.error('watcher: failed to handle a log —', e.message);
        }
      }
    },
    onError: (e) => console.error('watcher error:', e.message),
  });
}
