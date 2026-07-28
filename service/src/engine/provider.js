import OpenAI from 'openai';
import { CONFIG } from './config.js';
import { mockCall } from './mock.js';

/**
 * The ONLY place that talks to a model provider.
 * Everything upstream (panel, judge, extractor, skeptic) calls `callModel`.
 * Because it is a single OpenAI-compatible client, switching providers is an
 * .env change, not a code change.
 */

let _client;
function client() {
  if (!_client) {
    _client = new OpenAI({
      apiKey: CONFIG.apiKey || 'mock-key',
      baseURL: CONFIG.baseURL,
      maxRetries: 0, // we control retries ourselves so latency stays predictable
    });
  }
  return _client;
}

// Gateway economy/runtime headers we surface in the HUD ("best use of runtime").
const BTL_HEADERS = [
  'x-btl-saved',
  'x-btl-cache-tier',
  'x-btl-benchmark-cost',
  'x-btl-customer-charge',
];

function pickHeaders(h) {
  const out = {};
  if (!h) return out;
  for (const k of BTL_HEADERS) {
    const v = typeof h.get === 'function' ? h.get(k) : h[k];
    if (v != null && v !== '') out[k] = v;
  }
  return out;
}

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

// Aggregator gateways (BTL routes through OpenRouter / provider-direct) throw
// transient 5xx/429 under a parallel fan-out burst. One flake must not kill a
// panelist, so we retry transient failures with jittered backoff. Non-transient
// errors (400 bad model, 401 auth) fail fast -- retrying them is pointless.
const RETRYABLE = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isRetryable(e) {
  const status = e?.status ?? e?.response?.status;
  if (status) return RETRYABLE.has(status);
  return /timed out|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|socket hang up|network|fetch failed/i.test(
    e?.message || '',
  );
}

async function createWithRetry(params, opts, timeoutMs, model, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const call = client().chat.completions.create(params, opts).withResponse();
      return await withTimeout(call, timeoutMs + 2000, `model ${model}`);
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1 && isRetryable(e)) {
        await sleep(350 * (i + 1) + Math.floor(Math.random() * 250));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

/**
 * @returns {Promise<{model, content, headers, latencyMs, mocked, usage?}>}
 */
export async function callModel({
  model,
  system,
  user,
  role = 'panelist',
  question = '',
  claim = '',
  answer = '',
  temperature = 0.4,
  maxTokens = 900,
  timeoutMs = CONFIG.requestTimeoutMs,
}) {
  const started = Date.now();

  if (CONFIG.useMock) {
    const { content, headers } = await mockCall({ model, role, question, claim, answer });
    return { model, content, headers, latencyMs: Date.now() - started, mocked: true };
  }

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user });

  const { data, response } = await createWithRetry(
    { model, messages, temperature, max_tokens: maxTokens },
    { timeout: timeoutMs },
    timeoutMs,
    model,
  );
  const content = data?.choices?.[0]?.message?.content ?? '';

  return {
    model,
    content,
    headers: pickHeaders(response?.headers),
    latencyMs: Date.now() - started,
    mocked: false,
    usage: data?.usage,
  };
}
