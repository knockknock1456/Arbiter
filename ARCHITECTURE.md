# Architecture

Arbiter is three parts around one idea: **the evaluator in an ERC-8183 job is
a smart-contract address we control, and behind that address sits an AI court.**

```
                         ARC TESTNET (chain 5042002)
                ┌──────────────────────────────────────────┐
                │   ERC-8183  AgenticCommerce (Circle's)    │
                │   0x0747EEf0706327138c69792bF28Cd525089e4583
                │                                            │
   client ─────▶│  createJob(provider, EVALUATOR=Arbiter,…) │
   provider ───▶│  submit(jobId, deliverableHash)           │
                │            │                               │
                │            │ emits JobSubmitted            │
                └────────────┼───────────────────────────────┘
                             │ (event)
                             ▼
        ┌────────────────────────────────────────────────┐
        │           SERVICE  (off-chain judge, Node/TS)   │
        │                                                 │
        │  watcher ──▶ fetch brief + deliverable          │
        │      │                                          │
        │      ▼                                          │
        │  ENGINE  (ported from Tribunal)                 │
        │   ├ checklist  turn brief → acceptance items    │
        │   ├ panel      N independent models judge each  │
        │   ├ verify     fact-check claims vs live web    │
        │   └ judge      synthesise pass / fail + report  │
        │      │                                          │
        │      ▼                                          │
        │  chain/evaluator ──▶ complete(jobId, hash)      │
        │                  or  reject(jobId, hash)        │
        └───────────────────────┼─────────────────────────┘
                                 │ (tx, as the evaluator address)
                                 ▼
                ┌──────────────────────────────────────────┐
                │  ERC-8183 releases / refunds USDC escrow  │
                │  ERC-8004 reputation ← outcome written    │
                └──────────────────────────────────────────┘
                                 │
                                 ▼
              WEB  "courtroom" UI reads it all back:
              brief · deliverable · checklist · verdict · evidence · reputation
```

## The three parts

### 1. `contracts/` — ArbiterEvaluator
A thin Solidity contract deployed on Arc. Its address is what parties pass as
`evaluator` when they `createJob`. It exposes exactly what the court needs:
- receive a verdict from our authorised off-chain signer,
- call `complete(jobId, reasonHash)` or `reject(jobId, reasonHash)` on the
  ERC-8183 contract (this is the call that moves the USDC),
- (optional, v1.1) hold a dispute deposit and write ERC-8004 reputation.

> **Honest note on money:** the reference ERC-8183 contract does **not** bake in
> an evaluator fee. Arbiter's revenue is therefore its own layer — a dispute
> deposit ("loser pays") and/or an optional service fee in our wrapper — **not**
> a fee "built into the standard." Say it that way in the pitch.

### 2. `service/` — the off-chain judge (the heart)
Node + TypeScript. Watches the ERC-8183 contract for `JobSubmitted`, pulls the
brief and the deliverable, runs the **engine**, and sends the verdict tx.

`service/src/engine/` is the **Tribunal port** — the part that already works:
- `checklist.ts` — brief → concrete, checkable acceptance items.
- `panel.ts` — ask N independent models (different labs) to judge the work,
  item by item, in parallel and isolated from each other.
- `verify.ts` — extract the deliverable's factual claims and check them against
  live web sources (confirmed / outdated / contradicted / unverifiable).
- `judge.ts` — synthesise one verdict (pass/fail) + an evidence report;
  prompt-injection hardened (the deliverable is untrusted input).

`service/src/chain/` — everything that talks to Arc:
- `arc.ts` — chain config + contract addresses (real testnet values).
- `evaluator.ts` — build & send the `complete` / `reject` transaction.

### 3. `web/` — the courtroom
A simple UI that reads a job and shows the whole proceeding: the brief, the
submitted work, the agreed checklist, the panel's per-item findings, the final
verdict with its evidence, and the reputation written on-chain. This is the
"show your work" surface — the opposite of a black-box grade.

## Data flow, one sentence
A job names Arbiter as evaluator → provider submits → our service hears the
event, runs the panel + web check → the verdict transaction itself settles the
escrow and writes reputation → the web UI shows every step.

## Design rules (carry into the code)
- **Court wakes only on dispute** — happy path settles without us.
- **Mutual agreement beats the verdict** — if both sides agree, their will wins.
- **Judge by the checklist, not by taste** — start with work classes where
  acceptance is objective (code, data, research, spec-bound content).
- **Public code of conduct** — refuse grey briefs (spam/fraud/malware) at
  assignment time, before escrow is funded.
- **Verdict must beat the clock** — jobs have `expiredAt`; anyone can trigger a
  refund after it. Our SLA (verdict in ~1–2 min) must be well under job expiry.
