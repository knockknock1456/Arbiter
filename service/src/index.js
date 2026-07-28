import 'dotenv/config';
import { watchSubmissions } from './chain/watch.js';
import { settle } from './chain/settle.js';
import { reachVerdict } from './engine/verdict.js';
import { evaluatorWallet, ADDRESSES } from './chain/arc.js';

/**
 * Arbiter — the court, running.
 * Listens for submitted work on jobs that named us evaluator, reviews it,
 * and sends the verdict transaction that settles the escrow.
 */

async function resolveDeliverable(hashOrUri) {
  // Phase 1: the demo passes the work inline via DELIVERABLE_TEXT.
  // Phase 2: resolve IPFS/HTTP content and verify it hashes to the on-chain value.
  return process.env.DELIVERABLE_TEXT || '(no deliverable content available)';
}

async function main() {
  const w = evaluatorWallet();
  console.log('\n  ARBITER — the court is in session');
  console.log(`  evaluator : ${w ? w.account.address : '(no key set — read-only)'}`);
  console.log(`  contract  : ${ADDRESSES.erc8183}`);
  console.log('  waiting for submitted work…\n');

  watchSubmissions(async (job) => {
    console.log(`\n▸ job ${job.jobId} submitted by ${job.provider}`);
    const work = await resolveDeliverable(job.deliverableHash);
    const verdict = await reachVerdict({ brief: job.brief, work });

    console.log(`  checklist : ${verdict.checklist.length} items`);
    console.log(`  panel     : ${verdict.reviews.filter((r) => r.ok).length} reviewers`);
    console.log(`  facts     : ${verdict.checks.length} claims checked`);
    console.log(`  verdict   : ${verdict.accepted ? 'ACCEPTED' : 'REJECTED'}${verdict.manipulationDetected ? '  [manipulation flagged]' : ''}`);
    console.log(`  ${verdict.summary}`);

    const tx = await settle(job.jobId, verdict);
    console.log(`  settled   : ${tx.fn}() → ${tx.txHash} (${tx.status})`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
