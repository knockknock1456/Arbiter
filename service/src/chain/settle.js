import { publicClient, evaluatorWallet, ADDRESSES } from './arc.js';
import { ERC8183_ABI } from './abi.js';

/**
 * SETTLEMENT — the verdict transaction. This is the call that actually moves
 * the escrowed USDC: `complete` pays the provider, `reject` refunds the client.
 * The report hash rides along as `reason`, anchoring the evidence on-chain.
 */

export async function settle(jobId, verdict) {
  const w = evaluatorWallet();
  if (!w) throw new Error('EVALUATOR_PRIVATE_KEY is not set — cannot send the verdict.');

  const fn = verdict.accepted ? 'complete' : 'reject';
  const reason = verdict.reportHash; // bytes32 sha256 of the evidence report

  const { request } = await publicClient.simulateContract({
    address: ADDRESSES.erc8183,
    abi: ERC8183_ABI,
    functionName: fn,
    args: [BigInt(jobId), reason, '0x'],
    account: w.account,
  });

  const hash = await w.client.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { fn, txHash: hash, status: receipt.status, blockNumber: receipt.blockNumber };
}
