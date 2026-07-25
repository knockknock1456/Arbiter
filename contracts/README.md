# contracts/ — ArbiterEvaluator

A thin contract whose **address is passed as the `evaluator`** when parties
`createJob` on the ERC-8183 AgenticCommerce contract. It relays a verdict from
Arbiter's authorised off-chain signer into `complete` / `reject`, which is the
call that moves the escrowed USDC.

- Toolchain: Foundry (`forge`).
- Target: Arc testnet, chain `5042002`.
- The ERC-8183 contract we integrate with is already deployed by Circle at
  `0x0747EEf0706327138c69792bF28Cd525089e4583` — we do **not** redeploy it.

See `src/ArbiterEvaluator.sol` for the scaffold and inline build notes.
