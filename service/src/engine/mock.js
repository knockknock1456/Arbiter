import { CONFIG } from './config.js';

/**
 * MOCK PROVIDER
 * Lets the entire pipeline (panel -> judge -> extract -> verify -> skeptic)
 * run with no API key and zero credits, so the demo works today. Answers are
 * synthetic but the SHAPE matches real replies exactly, and we deliberately
 * inject disagreement + a fact-check flip so the UI has something honest to show.
 *
 * Recommended demo question (built-in flip, EN/RU/DE/ES):
 *   "How many moons does Jupiter have?"  /  "Сколько у Юпитера лун?"
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function fakeHeaders(model) {
  const h = hash(model);
  const saved = (0.0012 + (h % 40) / 10000).toFixed(4);
  const charge = (0.0005 + (h % 25) / 10000).toFixed(4);
  const bench = (Number(saved) + Number(charge)).toFixed(4);
  const tiers = ['hot', 'warm', 'cold'];
  return {
    'x-btl-saved': `$${saved}`,
    'x-btl-cache-tier': tiers[h % 3],
    'x-btl-benchmark-cost': `$${bench}`,
    'x-btl-customer-charge': `$${charge}`,
  };
}

const short = (q) => (q || '').trim().replace(/\s+/g, ' ').slice(0, 70);

function jupiterPanelist(model) {
  const options = [
    { n: 79, conf: 88 },
    { n: 95, conf: 83 },
    { n: 92, conf: 80 },
    { n: 88, conf: 72 },
  ];
  const pick = options[hash(model) % options.length];
  return {
    answer: `Jupiter has ${pick.n} known moons.`,
    confidence: pick.conf,
    key_claims: [
      `Jupiter has ${pick.n} confirmed moons.`,
      `Jupiter is the largest planet in the Solar System.`,
    ],
  };
}

function genericPanelist(model, question) {
  const dissenter = hash(model) % 4 === 0;
  const q = short(question) || 'the question';
  if (dissenter) {
    return {
      answer: `I'd push back here. On "${q}" the confident consensus overlooks an important exception, so my answer differs from the others.`,
      confidence: 58 + (hash(model) % 8),
      key_claims: [
        `The mainstream claim about "${q}" has a notable exception.`,
        `At least one detail here is time-sensitive and worth verifying.`,
      ],
    };
  }
  return {
    answer: `Short answer: the mainstream position on "${q}" holds, with the usual caveats.`,
    confidence: 74 + (hash(model) % 12),
    key_claims: [
      `The core claim in "${q}" is generally accepted.`,
      `There is at least one commonly-cited figure worth double-checking.`,
    ],
  };
}

function jupiterJudge() {
  return {
    final_answer:
      "The panel agrees Jupiter is the largest planet in the Solar System, but the models disagree on the exact number of known moons — answers ranged across roughly 79 to 95. Moon counts rise as new satellites are confirmed, so the precise figure is time-sensitive and should be checked against a current source before relying on it.",
    agreement_score: 58,
    agreements: [
      'Jupiter is the largest planet in the Solar System.',
      'Jupiter has dozens of known moons (a large, growing set).',
    ],
    disagreements: [
      {
        point: 'Exact number of known moons',
        positions: ['one draft: 79', 'one draft: 95', 'one draft: 92', 'one draft: 88'],
      },
    ],
  };
}

function genericJudge(question) {
  const q = short(question) || 'the question';
  return {
    final_answer:
      `Synthesizing the panel: the drafts broadly agree on the main thrust of "${q}", but one model dissents on a key detail. Treat the consensus as provisional until that disputed point is checked against a source.`,
    agreement_score: 66,
    agreements: [
      'Most models converge on the main claim.',
      'The overall framing is shared across the drafts.',
    ],
    disagreements: [
      {
        point: 'A key detail flagged by one model',
        positions: ['3 drafts: mainstream view', '1 draft: important exception'],
      },
    ],
  };
}

// ---- Level 2 mocks ---------------------------------------------------------
// Multilingual detection so the demo flip fires in EN/RU/DE/ES.
const RE_JUP = /jupiter|júpiter|юпитер/i;
const RE_MOON = /moon|luna|lunas|mond|monde|лун/i;
const isJupiterQ = (q) => RE_JUP.test(q || '') && RE_MOON.test(q || '');
const isMoonClaim = (c) => RE_MOON.test(c || '') && /\d/.test(c || '');
const isLargestClaim = (c) => /largest planet|planeta más grande|größt|крупнейш/i.test(c || '');

function extractorPayload(question) {
  if (isJupiterQ(question)) {
    return { claims: ['Jupiter has 79 known moons.', 'Jupiter is the largest planet in the Solar System.'] };
  }
  const q = short(question) || 'the question';
  return { claims: [`The mainstream answer to "${q}" is correct.`, `A key figure cited for "${q}" is current.`] };
}

function verifierPayload(claim) {
  if (isMoonClaim(claim)) {
    return { status: 'outdated', note: 'Older counts like 79 are superseded — ~95 moons confirmed as of 2023.' };
  }
  if (isLargestClaim(claim)) {
    return { status: 'confirmed', note: 'Well established across sources.' };
  }
  return hash(claim) % 2 === 0
    ? { status: 'confirmed', note: 'Supported by the top sources.' }
    : { status: 'unverifiable', note: 'Sources do not clearly settle this.' };
}

function skepticPayload(question) {
  if (isJupiterQ(question)) {
    return {
      revised_answer:
        "Jupiter is the largest planet in the Solar System, and the best-supported current figure is about 95 confirmed moons (as of 2023). The panel's confident '79' is outdated — Jupiter's moon count has climbed as new satellites were confirmed, so the earlier number no longer holds.",
      changed: true,
      skeptic_survived: false,
      belief_delta: [
        {
          claim: 'Jupiter has 79 known moons.',
          verdict: 'outdated',
          correction: '~95 confirmed moons (as of 2023)',
          note: 'The panel stated 79 confidently; the count has since risen as new moons were confirmed.',
        },
      ],
    };
  }
  return {
    revised_answer:
      'After checking the load-bearing claims, the main thrust of the answer holds; one detail could not be independently confirmed, so treat it with mild caution.',
    changed: false,
    skeptic_survived: true,
    belief_delta: [
      {
        claim: 'A key figure cited in the answer.',
        verdict: 'unverifiable',
        correction: '',
        note: 'Sources did not clearly confirm or refute this point.',
      },
    ],
  };
}

/**
 * Mock web search — returns synthetic but realistic, on-topic sources so the
 * verification UI has something to show with zero external keys.
 */
export async function mockSearch(query, max = 4) {
  await sleep(200 + (hash(query) % 700));
  let results;
  if (isJupiterQ(query) || isMoonClaim(query)) {
    results = [
      { title: 'Moons of Jupiter — Wikipedia', url: 'https://en.wikipedia.org/wiki/Moons_of_Jupiter', snippet: 'As of 2023, Jupiter has 95 moons with confirmed orbits; earlier tallies (e.g. 79) are outdated.' },
      { title: 'Jupiter Moons — NASA Science', url: 'https://science.nasa.gov/jupiter/jupiter-moons/', snippet: 'Jupiter has 95 officially recognized moons, the most of any planet in the Solar System.' },
      { title: 'Jupiter — largest planet — NASA', url: 'https://science.nasa.gov/jupiter/', snippet: 'Jupiter is the largest planet in the Solar System, more than twice all other planets combined.' },
    ];
  } else {
    const q = short(query);
    results = [
      { title: `Reference overview: ${q}`, url: 'https://example.org/reference', snippet: `Background and mainstream view on ${q}.` },
      { title: `Analysis: ${q}`, url: 'https://example.org/analysis', snippet: `Discussion of the key figures related to ${q}.` },
    ];
  }
  return results.slice(0, max);
}

/**
 * @returns {Promise<{content:string, headers:object}>}
 */
export async function mockCall({ model, role, question, claim, answer }) {
  await sleep(250 + (hash(model + role + (claim || '')) % 1100));
  const headers = fakeHeaders(model);
  const jup = isJupiterQ(question);

  if (role === 'smoke') {
    return {
      content: `MOCK OK — gateway call simulated for "${model}". Set PROVIDER_API_KEY (and USE_MOCK=0) to go live.`,
      headers,
    };
  }

  let payload;
  if (role === 'judge') payload = jup ? jupiterJudge() : genericJudge(question);
  else if (role === 'extractor') payload = extractorPayload(question);
  else if (role === 'verifier') payload = verifierPayload(claim);
  else if (role === 'skeptic') payload = skepticPayload(question);
  else payload = jup ? jupiterPanelist(model) : genericPanelist(model, question);

  return { content: JSON.stringify(payload), headers };
}

export const MOCK_DEMO_QUESTION = 'How many moons does Jupiter have?';
export function mockEnabled() {
  return CONFIG.useMock;
}
