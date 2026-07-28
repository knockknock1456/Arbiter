import 'dotenv/config';
import { createPublicClient, createWalletClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * Arc testnet wiring. One place for the chain, the RPC and the contract
 * addresses, so nothing else in the codebase hardcodes them.
 */

export const ARC_TESTNET = defineChain({
  id: Number(process.env.ARC_CHAIN_ID || 5042002),
  name: 'Arc Testnet',
  // Gas on Arc is USDC (6 decimals in the ERC-20 view, 18 in the native view).
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
});

export const ADDRESSES = {
  // Circle's ERC-8183 AgenticCommerce reference implementation on Arc testnet.
  erc8183: (process.env.ERC8183_ADDRESS || '0x0747EEf0706327138c69792bF28Cd525089e4583'),
  usdc: (process.env.USDC_ADDRESS || '0x3600000000000000000000000000000000000000'),
};

// The public Arc RPC rate-limits hard, so we retry with backoff and space
// requests out. Set ARC_RPC_URL to a private endpoint for heavier use.
const transport = http(undefined, {
  retryCount: 6,
  retryDelay: 1200,
  batch: false,
  timeout: 30_000,
});

export const publicClient = createPublicClient({
  chain: ARC_TESTNET,
  transport,
  pollingInterval: 4_000,
});

/** Wallet client for the evaluator (only when a key is configured). */
export function evaluatorWallet() {
  const pk = process.env.EVALUATOR_PRIVATE_KEY;
  if (!pk) return null;
  const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
  return {
    account,
    client: createWalletClient({ account, chain: ARC_TESTNET, transport }),
  };
}
