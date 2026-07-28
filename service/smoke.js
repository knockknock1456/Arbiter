import 'dotenv/config';
import { reachVerdict } from './src/engine/verdict.js';
import { FIXTURES } from './src/fixtures.js';

/**
 * Smoke test — runs the court on three sample jobs and prints the verdicts.
 * Usage:  npm run smoke        (uses the fixtures)
 * With live models set PROVIDER_API_KEY + USE_MOCK=0 in .env
 */
const cases = [
  ['good work', FIXTURES.goodWork],
  ['thin work', FIXTURES.badWork],
  ['work with a prompt injection', FIXTURES.cheatingWork],
];

for (const [label, work] of cases) {
  const v = await reachVerdict({ brief: FIXTURES.brief, work });
  console.log(`\n=== ${label}`);
  console.log(`    ${v.accepted ? 'ACCEPTED' : 'REJECTED'}${v.manipulationDetected ? '   [manipulation flagged]' : ''}`);
  console.log(`    checklist ${v.checklist.length} · reviewers ${v.reviews.filter((r) => r.ok).length} · claims ${v.checks.length} · ${(v.elapsedMs / 1000).toFixed(1)}s`);
  console.log(`    ${v.summary}`);
  console.log(`    report ${v.reportHash.slice(0, 20)}…`);
  v.reviews.forEach((r) => console.log(`      · ${r.model}: ${r.ok ? r.verdict + ' (' + r.confidence + '%)' : 'FAILED'}`));
  if (v.checklist.length) v.checklist.forEach((i) => console.log(`      ✓ [${i.kind}] ${i.text}`));
}
