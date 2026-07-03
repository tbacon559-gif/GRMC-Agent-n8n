/** Pure helpers for the matching engine — no I/O, easy to unit test. */

export function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

export function normalizeKeywords(keywords: unknown): string[] {
  if (!Array.isArray(keywords)) return [];
  return keywords
    .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
    .map(normalizeKeyword);
}

/** Jaccard similarity (|intersection| / |union|) between two keyword sets, as a 0-100 score. */
export function keywordSimilarity(a: unknown, b: unknown): number {
  const setA = new Set(normalizeKeywords(a));
  const setB = new Set(normalizeKeywords(b));
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const keyword of setA) {
    if (setB.has(keyword)) intersectionSize += 1;
  }
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : Math.round((intersectionSize / unionSize) * 100);
}

export function overlappingKeywords(a: unknown, b: unknown): string[] {
  const setA = new Set(normalizeKeywords(a));
  const setB = normalizeKeywords(b);
  return setB.filter((keyword) => setA.has(keyword));
}

/** Exponential recency decay: 100 at day 0, halving every `halfLifeDays`. Null/undefined dates score `whenNull`. */
export function recencyScore(
  date: Date | null | undefined,
  now: Date,
  halfLifeDays: number,
  whenNull = 30,
): number {
  if (!date) return whenNull;
  const daysSince = Math.max(0, (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  return Math.round(100 * Math.pow(0.5, daysSince / halfLifeDays));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
