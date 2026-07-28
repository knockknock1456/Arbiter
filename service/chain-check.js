import 'dotenv/config';
import { publicClient, evaluatorWallet, ADDRESSES, ARC_TESTNET } from './src/chain/arc.js';
import { ERC8183_ABI, JOB_STATUS } from './src/chain/abi.js';
import { formatUnits } from 'viem';

/**
 * chain-check — proves Arbiter can talk to Arc before we try to settle anything.
 * Reads: chain id, wallet balance, the ERC-8183 contract, and the latest jobs.
 */

console.log('\n── Arbiter · Arc connection check ─────────────────────');

const w = evaluatorWallet();
console.log(`evaluator : ${w ? w.account.address : '(NO KEY SET)'}`);
console.log(`rpc       : ${ARC_TESTNET.rpcUrls.default.http[0]}`);
console.log(`contract  : ${ADDRESSES.erc8183}`);
console.log('───────────────────────────────────────────────────────');

try {
  const id = await publicClient.getChainId();
  console.log(`chain id      : ${id} ${id === 5042002 ? '✓' : '✗ (expected 5042002)'}`);

  const block = await publicClient.getBlockNumber();
  console.log(`latest block  : ${block}`);

  if (w) {
    const bal = await publicClient.getBalance({ address: w.account.address });
    console.log(`gas balance   : ${formatUnits(bal, 18)} USDC (native view)`);
  }

  const code = await publicClient.getBytecode({ address: ADDRESSES.erc8183 });
  console.log(`contract code : ${code && code !== '0x' ? `present (${code.length} bytes) ✓` : 'NOT FOUND ✗'}`);

  // How many jobs exist? jobCounter is public in the reference implementation.
  try {
    const counter = await publicClient.readContract({
      address: ADDRESSES.erc8183,
      abi: [{ type: 'function', name: 'jobCounter', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }],
      functionName: 'jobCounter',
    });
    console.log(`jobs on chain : ${counter}`);

    // peek at the last few jobs so we can see real data shapes
    const from = counter > 3n ? counter - 2n : 1n;
    for (let i = from; i <= counter; i++) {
      const j = await publicClient.readContract({
        address: ADDRESSES.erc8183, abi: ERC8183_ABI, functionName: 'getJob', args: [i],
      });
      console.log(`  job ${i}: ${JOB_STATUS[j.status] ?? j.status} · budget ${formatUnits(j.budget, 6)} USDC · evaluator ${j.evaluator.slice(0, 10)}…`);
      if (j.description) console.log(`         brief: ${j.description.slice(0, 70)}${j.description.length > 70 ? '…' : ''}`);
    }
  } catch (e) {
    console.log(`jobs on chain : could not read (${e.shortMessage || e.message})`);
  }

  console.log('\nResult: Arc connection WORKS. Ready to create a job and settle it.\n');
} catch (e) {
  console.log(`\n✗ connection failed: ${e.shortMessage || e.message}\n`);
  process.exit(1);
}
