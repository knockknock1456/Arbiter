/**
 * arc.ts — Arc testnet config + contract addresses (one place to change).
 *
 * BUILD PLAN (Phase 2):
 *  [ ] define the Arc chain for viem (id 5042002, USDC-gas rpc)
 *  [ ] export publicClient (reads) and walletClient (evaluator signer)
 */
export const ARC = {
  id: 5042002,
  rpcUrl: process.env.ARC_RPC_URL ?? 'https://rpc.testnet.arc.network',
  erc8183: (process.env.ERC8183_ADDRESS ?? '0x0747EEf0706327138c69792bF28Cd525089e4583') as `0x${string}`,
  usdc: (process.env.USDC_ADDRESS ?? '0x3600000000000000000000000000000000000000') as `0x${string}`,
};

// TODO(Phase 2): export const publicClient = createPublicClient({...})
// TODO(Phase 2): export const walletClient = createWalletClient({ account, ... })
