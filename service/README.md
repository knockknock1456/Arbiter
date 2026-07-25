# service/ — the off-chain judge

Node + TypeScript. This is Arbiter's brain. It:
1. watches the ERC-8183 contract for `JobSubmitted`,
2. pulls the brief (job description) and the deliverable,
3. runs the **engine** (`src/engine/`) — the ported Tribunal pipeline,
4. sends the verdict transaction via `src/chain/evaluator.ts`.

```
src/
├── index.ts            entrypoint: wire watcher → engine → settlement
├── watcher.ts          subscribe to JobSubmitted, dispatch each job
├── engine/             THE TRIBUNAL PORT (already-proven core)
│   ├── checklist.ts    brief → acceptance checklist
│   ├── panel.ts        N independent models judge each item
│   ├── verify.ts       fact-check the deliverable's claims vs live web
│   └── judge.ts        synthesise pass/fail + evidence report
└── chain/
    ├── arc.ts          viem client + Arc testnet addresses
    └── evaluator.ts    build & send complete/reject as the evaluator
```

Run (once implemented): `npm install && npm run dev`
