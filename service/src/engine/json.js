/**
 * Robust JSON extraction from an LLM reply.
 * Models wrap JSON in prose, code fences, or add trailing commentary — so we
 * never trust `JSON.parse(raw)` directly. We strip fences and grab the first
 * balanced {...} block.
 */
export function extractJson(text) {
  if (typeof text !== 'string') return null;

  // 1) strip ```json ... ``` or ``` ... ``` fences
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();

  // 2) fast path
  try {
    return JSON.parse(t);
  } catch {
    /* fall through */
  }

  // 3) find first balanced object by bracket counting (ignores braces in strings)
  const start = t.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        const candidate = t.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function clamp(n, lo, hi) {
  n = Number(n);
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
