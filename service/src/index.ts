/**
 * Arbiter service — entrypoint.
 *
 * Wires the whole court together:
 *   watcher (JobSubmitted) -> engine (panel+verify+judge) -> chain (settle).
 *
 * BUILD PLAN (Phase 2): implement watchJobs() and settle().
 */
import 'dotenv/config';
import { watchJobs } from './watcher.js';
import { runCourt } from './engine/judge.js';
import { settle } from './chain/evaluator.js';

async function main() {
  console.log('⚖️  Arbiter court starting…');
  await watchJobs(async (job) => {
    // job = { jobId, brief, deliverable }
    const verdict = await runCourt(job);           // { passed, reportHash, perItem }
    await settle(job.jobId, verdict);              // complete or reject on-chain
    console.log(`Job ${job.jobId}: ${verdict.passed ? 'PASS' : 'FAIL'}`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
