# Build plan — Arbiter

Day-by-day, dependency-ordered. Checkpoint 2 = **Sun 26 Jul** (repo + deck + track).
Final = **Sun 9 Aug** (working MVP on Arc testnet + 3-min video).

Legend: ⬜ todo · 🟡 in progress · ✅ done · ⏭️ post-hackathon

---

## Phase 0 — Checkpoint 2 (by 26 Jul)  ← we are here
- ✅ Repo scaffold (this repository), README, ARCHITECTURE
- ⬜ Push to public GitHub, paste link in Encode form
- ⬜ Slide deck (5–6 slides): problem → solution → how → why-us → stack
- ⬜ Select **Agentic Economy** track in the Checkpoint-2 form

## Phase 1 — Engine (port Tribunal)  [Jul 27–29]
*Lowest risk — this code already exists and works.*
- ⬜ Copy Tribunal pipeline into `service/src/engine/`
- ⬜ Repurpose input: from "a question" → "a deliverable + a checklist"
- ⬜ `checklist.ts`: brief → acceptance items (new small prompt)
- ⬜ `judge.ts`: output shape → `{ verdict: pass|fail, perItem[], reportHash }`
- ⬜ Keep prompt-injection hardening (deliverable is untrusted)
- ⬜ Local test: feed a good deliverable → pass; a bad one → fail

## Phase 2 — Chain read/write  [Jul 30 – Aug 2]
*Highest risk — first time on Arc. Budget extra time here.*
- ⬜ `chain/arc.ts`: viem client for chain 5042002, addresses wired
- ⬜ Fund a burner key from faucet.circle.com
- ⬜ Read path: subscribe to `JobSubmitted` on the ERC-8183 contract
- ⬜ Write path: send `complete(jobId, hash)` / `reject(...)` as evaluator
- ⬜ End-to-end on testnet: create a job (evaluator = our address) → submit
      → our service auto-settles it. Screenshot the tx.

## Phase 3 — ArbiterEvaluator contract  [Aug 3–5]
- ⬜ Minimal contract that authorises our signer and relays complete/reject
- ⬜ (optional) dispute-deposit hold; (optional) ERC-8004 reputation write
- ⬜ Deploy + verify on ArcScan; record address in `docs/deployments.md`

## Phase 4 — Courtroom UI  [Aug 5–7]
- ⬜ Read a job → render brief, deliverable, checklist, verdict, evidence
- ⬜ Reuse Tribunal's visual language (panel cards, verdict, evidence links)
- ⬜ Deploy (Render/Vercel) for a public link

## Phase 5 — Submission polish  [Aug 7–9]
- ⬜ Scripted demo: honest-agent job passes; cheating agent (injection in the
      deliverable) gets caught and rejected — the money-shot
- ⬜ Record 3-min video (problem → live demo → why Arbiter)
- ⬜ Final README pass, deck update, submit

---

## Known risks (name them, don't hide them)
1. **Arc deploy is new to us** — Phase 2/3 may need debugging. Extra buffer built in.
2. **No built-in evaluator fee** — revenue is our own layer (dispute deposit), not "in the standard." Keep the pitch honest.
3. **Neighbour project `bonded`** already ships bonds+escrow on Arc. We differ by
   *judging work quality* (panel + web check) where they use a fixed-arbiter stub.
   One sentence of differentiation in the deck.
4. **Solo + ~2.5 weeks** — scope discipline: engine + one clean end-to-end demo
   beats a half-built everything. "Quality of execution over complexity" (their rubric).
