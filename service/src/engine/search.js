import { CONFIG } from './config.js';
import { mockSearch } from './mock.js';

/**
 * Provider-independent web search for Level-2 verification.
 * Same philosophy as the model gateway: one function, swap provider via .env.
 * In mock mode (or with no search key) it returns synthetic results, so the
 * whole verification pipeline runs with zero external keys.
 *
 * @returns {Promise<{ok:boolean, results:Array<{title,url,snippet}>}>}
 */
export async function webSearch(query, { max = 4, timeoutMs = 8000 } = {}) {
  if (CONFIG.useMock || !CONFIG.searchKey) {
    return { ok: CONFIG.useMock, results: CONFIG.useMock ? await mockSearch(query, max) : [] };
  }
  try {
    const results = await withTimeout(providerSearch(query, max), timeoutMs);
    return { ok: true, results };
  } catch {
    return { ok: false, results: [] }; // graceful fallback -> claim becomes unverifiable
  }
}

function withTimeout(p, ms) {
  let t;
  const to = new Promise((_, rej) => (t = setTimeout(() => rej(new Error('search timeout')), ms)));
  return Promise.race([p, to]).finally(() => clearTimeout(t));
}

async function providerSearch(query, max) {
  const p = CONFIG.searchProvider;
  if (p === 'tavily') return tavily(query, max);
  if (p === 'serper') return serper(query, max);
  if (p === 'brave') return brave(query, max);
  return tavily(query, max);
}

async function tavily(query, max) {
  const r = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: CONFIG.searchKey, query, max_results: max, search_depth: 'basic' }),
  });
  const j = await r.json();
  return (j.results || []).slice(0, max).map((x) => ({ title: x.title, url: x.url, snippet: x.content }));
}

async function serper(query, max) {
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': CONFIG.searchKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, num: max }),
  });
  const j = await r.json();
  return (j.organic || []).slice(0, max).map((x) => ({ title: x.title, url: x.link, snippet: x.snippet }));
}

async function brave(query, max) {
  const u = new URL('https://api.search.brave.com/res/v1/web/search');
  u.searchParams.set('q', query);
  u.searchParams.set('count', String(max));
  const r = await fetch(u, { headers: { 'X-Subscription-Token': CONFIG.searchKey, Accept: 'application/json' } });
  const j = await r.json();
  return (j.web?.results || []).slice(0, max).map((x) => ({ title: x.title, url: x.url, snippet: x.description }));
}
