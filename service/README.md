# service/ — the court

Node + TypeScript-free ESM. Everything Arbiter does at runtime lives here.

```
src/engine/     checklist.js  brief -> acceptance criteria
                review.js     N independent models rule on each criterion
                factcheck.js  the work's claims vs live web sources
                verdict.js    one accept/reject + evidence report (+ hash)
src/chain/      arc.js        Arc testnet client (retries, gentle polling)
                abi.js        ERC-8183 + ERC-20 ABIs
                watch.js      listen for JobSubmitted on jobs we evaluate
                settle.js     send complete() / reject() — this moves the USDC
public/         the courtroom UI
server.js       web server, streams a hearing over SSE
live-demo.js    full loop on Arc testnet
chain-check.js  connection diagnostics
smoke.js        offline hearings on sample work
```

```bash
npm install
npm run smoke        # no chain, no wallet needed
npm start            # UI on :4000
node live-demo.js    # the real thing on Arc testnet
```
