<div align="center">

# ⚖️ Arbiter

### The missing judge for the agent economy on Arc

*An independent AI evaluator for ERC-8183 jobs. It reads the work, checks it against the agreed brief and the live web, and its verdict settles the USDC escrow — with the reasoning recorded on-chain.*

**Built for [Build on Arc](https://www.encodeclub.com/programmes/arc-hackathon) · Encode × Circle · July–Aug 2026 · Track: Agentic Economy**

</div>

---

> ### The gap, in the standard's own words
> *"A malicious evaluator can complete or reject arbitrarily. Use reputation or staking for high-value jobs. **No dispute resolution or arbitration; reject/expire is final.**"*
> — [ERC-8183](https://eips.ethereum.org/EIPS/eip-8183), Security Considerations

Arc's agent economy already has the pieces: **identity** (ERC-8004), **job escrow** (ERC-8183), **payments** (Circle Nanopayments / x402). What it doesn't have is a **judge**. In ERC-8183 the *evaluator* — the single address that decides whether delivered work gets paid — is by default the client grading their own deal. There is no neutral third party, and no appeal.

**Arbiter fills that evaluator slot.**

---

## How it works

```
1. AGREE     Two agents create a job. They set Arbiter as the evaluator.
             Arbiter turns the vague brief into an acceptance checklist
             both sides confirm — before any work starts.

2. DELIVER   The provider submits work (only its hash goes on-chain).

3. JUDGE     A panel of independent AI models (different labs, isolated)
             checks the work against each checklist item, and fact-checks
             its claims against live web sources.

4. SETTLE    The verdict IS the settlement. The same on-chain call that
             says "pass" or "fail" releases or refunds the USDC escrow.
             Judge and bailiff are one — nothing to appeal after the fact.

5. RECORD    The verdict's evidence hash is written to the job; the outcome
             is written to ERC-8004 reputation — for both parties AND for
             Arbiter itself. Our verdict history is our public track record.
```

Happy client? Arbiter stays silent — the client accepts the work themselves, and we only record reputation. **The court wakes only on dispute.**

## Why this isn't the naive Circle sample

Circle ships an [`arc-escrow`](https://github.com/circlefin/arc-escrow) sample where a *single* AI grades the work. Arbiter is different on purpose:

| | Naive single-AI evaluator | **Arbiter** |
|---|---|---|
| Judges | one model, one pass | **panel of independent models**, cross-checked |
| Grounding | model's memory | **live web fact-checking** of claims |
| Criteria | implicit | **checklist agreed by both sides before work** |
| Prompt injection | vulnerable ("rate this 10/10") | **hardened** (battle-tested engine) |
| Accountability | none | **reputation staked on every verdict** (ERC-8004) |
| Appeal | none | **dispute window → wider panel** |

## The engine is proven

Arbiter's verification engine is a port of **Tribunal** — a multi-model transparency engine that took **2nd place out of 42 projects** at the BTL Runtime Hackathon (judged by code audit + live testing). It already does the hard part: a prompt-injection-hardened panel of models with live web fact-checking. Here we adapt that proven core into an on-chain evaluator.

## Status

> 🚧 **Checkpoint 2 (26 Jul):** architecture + repo scaffold + verification engine port in progress.
> 🎯 **Final (9 Aug):** working MVP deployed on Arc testnet + 3-min demo.

See [`TASKS.md`](./TASKS.md) for the day-by-day build plan and [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how the three parts fit together.

## Repo layout

```
arbiter/
├── contracts/   # thin ArbiterEvaluator contract (sits in ERC-8183's evaluator slot)
├── service/     # off-chain judge: watches jobs, runs the panel, calls complete/reject
│   └── src/engine/   # the Tribunal port: panel · judge · web verify · checklist
├── web/         # "courtroom" UI: brief, work, verdict, evidence, reputation
└── docs/        # deployment addresses, notes
```

## Stack

Arc testnet (chain `5042002`) · ERC-8183 job escrow · ERC-8004 reputation · Circle Wallets / Contracts / Paymaster · Node + TypeScript (`viem`) · multi-model verification over an OpenAI-compatible gateway.

## Team

Mykhailo Lapshyn — solo.

---

<div align="center"><i>Arbiter is not an oracle. It shows its work: the checklist, the panel, the evidence — and lets the chain settle on it.</i></div>
