import 'dotenv/config';

/**
 * Single source of truth for provider access.
 *
 * PROVIDER INDEPENDENCE (the whole point):
 * every model call goes through ONE OpenAI-compatible endpoint. To move this
 * project to another hackathon / provider you edit ONLY the .env file — never
 * the code. Swap PROVIDER_BASE_URL + PROVIDER_API_KEY + PANEL_MODELS and you're
 * running on Qwen / OpenRouter / OpenAI / Groq instead of BTL.
 */

function list(v, fallback) {
  if (!v) return fallback;
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

const hasKey = Boolean(process.env.PROVIDER_API_KEY);

export const CONFIG = {
  // --- Gateway (BTL Runtime by default) -----------------------------------
  baseURL: process.env.PROVIDER_BASE_URL || 'https://api.badtheorylabs.com/v1',
  apiKey: process.env.PROVIDER_API_KEY || '',

  // --- The panel: DIFFERENT providers on purpose --------------------------
  // Diversity matters more than count: 4 models from 4 providers catch
  // different mistakes -> useful disagreement -> honest trust score.
  // NOTE: we call the OpenAI-compatible /v1/chat/completions route, so every
  // slug here must be an OpenAI-compatible route. On BTL, bare Anthropic slugs
  // (e.g. claude-opus-4-8) are NATIVE routes that require /v1/messages — so we
  // use OpenAI-compatible providers here (OpenAI, DeepSeek, Qwen, zAI).
  panel: list(process.env.PANEL_MODELS, [
    'gpt-5-5',           // OpenAI
    'deepseek-v4-pro',   // DeepSeek
    'qwen3.5-plus',      // Qwen
    'glm-5.2',           // zAI
  ]),

  // --- Cheap model for utility roles (extractor / verifier) ---------------
  utility: process.env.UTILITY_MODEL || 'gpt-4.1-nano',
  // Verifier gets its own (stronger) model: judging recency against messy web
  // results is exactly where a nano model rubber-stamps stale claims.
  verifierModel: process.env.VERIFIER_MODEL || process.env.UTILITY_MODEL || 'gpt-4.1-nano',

  // --- Strong model that synthesizes the drafts + adjudicates -------------
  judge: process.env.JUDGE_MODEL || 'gpt-5-5',
  // Skeptic can run on a faster model than the judge (it's a structured
  // adjudication call, not a synthesis). Falls back to the judge.
  skeptic: process.env.SKEPTIC_MODEL || process.env.JUDGE_MODEL || 'gpt-5-5',
  skepticExplicit: Boolean(process.env.SKEPTIC_MODEL),

  // --- Level 2: web verification -----------------------------------------
  // ON by default. Works in mock mode with zero keys. For LIVE verification
  // add a web-search key (Tavily / Serper / Brave) — independent of the BTL key.
  level2: process.env.LEVEL2 !== '0',
  searchProvider: process.env.SEARCH_PROVIDER || 'tavily',
  searchKey: process.env.SEARCH_API_KEY || '',
  maxClaims: Number(process.env.MAX_CLAIMS || 4),

  // --- Runtime knobs ------------------------------------------------------
  // Mock mode lets the WHOLE pipeline run with zero credits / no key, so the
  // Level-1 demo works today. Forced on when USE_MOCK=1 or when no key is set.
  useMock: process.env.USE_MOCK === '1' || !hasKey,
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 45000),
  port: Number(process.env.PORT || 3000),
};

/** Current date for time-aware prompts — verification must judge "as of today". */
export function todayStr() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function providerLabel() {
  if (CONFIG.useMock) return 'MOCK (no live calls)';
  try {
    return new URL(CONFIG.baseURL).host;
  } catch {
    return CONFIG.baseURL;
  }
}
