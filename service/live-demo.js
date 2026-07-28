import 'dotenv/config';
import { keccak256, toHex, parseUnits, formatUnits } from 'viem';
import { publicClient, evaluatorWallet, ADDRESSES } from './src/chain/arc.js';
import { ERC8183_ABI, ERC20_ABI, JOB_STATUS } from './src/chain/abi.js';
import { reachVerdict } from './src/engine/verdict.js';
import { FIXTURES } from './src/fixtures.js';

/**
 * live-demo — the full loop on Arc testnet, end to end:
 *   create job (evaluator = Arbiter) -> set budget -> fund escrow
 *   -> submit work -> Arbiter judges -> verdict tx moves the USDC.
 *
 * Usage:  node live-demo.js            (honest work, expect ACCEPT)
 *         node live-demo.js cheating   (injection, expect REJECT)
 *         node live-demo.js thin       (lazy work, expect REJECT)
 */

const kind = process.argv[2] || 'good';
const WORK = { good: FIXTURES.goodWork, thin: FIXTURES.badWork, cheating: FIXTURES.cheatingWork }[kind] || FIXTURES.goodWork;
const BUDGET = parseUnits(process.env.DEMO_BUDGET || '1', 6); // 1 USDC

const w = evaluatorWallet();
if (!w) { console.error('EVALUATOR_PRIVATE_KEY missing'); process.exit(1); }
const me = w.account.address;

const line = (s = '') => console.log(s);
const step = (n, s) => console.log(`\n[${n}] ${s}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Poll for a receipt gently — the public Arc RPC rate-limits hard. */
async function receipt(hash, tries = 10) {
  for (let i = 0; i < tries; i++) {
    await sleep(3000);
    try {
      const r = await publicClient.getTransactionReceipt({ hash });
      if (r) return r;
    } catch {
      /* not mined yet, or rate-limited — keep waiting */
    }
  }
  return null;
}

async function send(fn, args, label) {
  // Write directly: simulateContract doubles the RPC load and the public
  // Arc endpoint rate-limits aggressively.
  const hash = await w.client.writeContract({
    address: ADDRESSES.erc8183, abi: ERC8183_ABI, functionName: fn, args,
  });
  const r = await receipt(hash);
  line(`    ${label} → ${hash}  (${r ? r.status : 'sent, receipt pending'})`);
  await sleep(1500);
  return r;
}

line('\n══ ARBITER · live hearing on Arc testnet ══════════════');
line(`wallet   : ${me}`);
line(`contract : ${ADDRESSES.erc8183}`);
line(`case     : ${kind}`);

// ── 1. create the job, naming Arbiter as evaluator ──────────────────────────
step(1, 'Client creates a job — evaluator is Arbiter');
const expiredAt = BigInt(Math.floor(Date.now() / 1000) + 3600); // +1h
const before = await publicClient.readContract({
  address: ADDRESSES.erc8183, abi: ERC8183_ABI, functionName: 'jobCounter',
});
await send('createJob', [me, me, expiredAt, FIXTURES.brief, '0x0000000000000000000000000000000000000000'], 'createJob');
const jobId = await publicClient.readContract({
  address: ADDRESSES.erc8183, abi: ERC8183_ABI, functionName: 'jobCounter',
});
line(`    job id: ${jobId}   (was ${before})`);

// ── 2. budget + escrow ──────────────────────────────────────────────────────
step(2, `Provider proposes ${formatUnits(BUDGET, 6)} USDC, client funds escrow`);
await send('setBudget', [jobId, BUDGET, '0x'], 'setBudget');
const allowance = await publicClient.readContract({
  address: ADDRESSES.usdc, abi: ERC20_ABI, functionName: 'allowance', args: [me, ADDRESSES.erc8183],
});
if (allowance < BUDGET) {
  const h = await w.client.writeContract({
    address: ADDRESSES.usdc, abi: ERC20_ABI, functionName: 'approve',
    args: [ADDRESSES.erc8183, BUDGET * 10n],
  });
  await receipt(h);
  line(`    approve → ${h}`);
}
await send('fund', [jobId, '0x'], 'fund');

// ── 3. provider submits the work ────────────────────────────────────────────
step(3, 'Provider submits the work (hash on-chain)');
const workHash = keccak256(toHex(WORK));
await send('submit', [jobId, workHash, '0x'], 'submit');
line(`    work hash: ${workHash}`);

// ── 4. the court sits ───────────────────────────────────────────────────────
step(4, 'Arbiter reviews the work');
const verdict = await reachVerdict({ brief: FIXTURES.brief, work: WORK });
line(`    criteria  : ${verdict.checklist.length}`);
verdict.reviews.filter((r) => r.ok).forEach((r) => line(`    reviewer  : ${r.model} → ${r.verdict} (${r.confidence}%)`));
line(`    verdict   : ${verdict.accepted ? 'ACCEPTED' : 'REJECTED'}${verdict.manipulationDetected ? '  [manipulation flagged]' : ''}`);
line(`    ${verdict.summary}`);
line(`    report    : ${verdict.reportHash}`);

// ── 5. the verdict IS the settlement ────────────────────────────────────────
step(5, `Settling on-chain: ${verdict.accepted ? 'complete()' : 'reject()'}`);
const settleTx = await send(verdict.accepted ? 'complete' : 'reject', [jobId, verdict.reportHash, '0x'], verdict.accepted ? 'complete' : 'reject');

line('');
line('══ result ════════════════════════════════════════════');
line(`job              : #${jobId}`);
line(`verdict          : ${verdict.accepted ? 'ACCEPTED' : 'REJECTED'}${verdict.manipulationDetected ? '  [manipulation flagged]' : ''}`);
line(`escrow           : ${formatUnits(BUDGET, 6)} USDC ${verdict.accepted ? '→ released to provider' : '→ refunded to client'}`);
line(`evidence hash    : ${verdict.reportHash}`);
try {
  await sleep(2000);
  const job = await publicClient.readContract({
    address: ADDRESSES.erc8183, abi: ERC8183_ABI, functionName: 'getJob', args: [jobId],
  });
  line(`on-chain status  : ${JOB_STATUS[job.status] ?? job.status}`);
} catch {
  line('on-chain status  : (rate-limited, check the explorer)');
}
line(`explorer         : https://testnet.arcscan.app/address/${me}`);
line('══════════════════════════════════════════════════════\n');
