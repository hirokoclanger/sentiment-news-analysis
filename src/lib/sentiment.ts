export type SentimentLabel = "positive" | "negative" | "neutral";

export const POSITIVE_KEYWORDS = [
  "beat",
  "growth",
  "expansion",
  "profit",
  "surge",
  "record",
  "upgrade",
  "optimistic",
  "strong",
  "bullish",
  "outperform",
  "increase",
  "improve",
  "success",
  "gain",
  "rally",
  "soar",
  "boom",
  "breakthrough",
  "innovative",
  "win",
  "recovery",
  "accelerate",
  "exceed",
  "robust",
  "positive",
  "momentum",
  "high",
  "advance",
  "jump",
  "climb",
  "rise",
  "strength",
  "opportunity",
  "excellent",
  "stellar",
  "impressive",
  "milestone",
  "achievement",
  "revenue",
  "earnings",
];

export const NEGATIVE_KEYWORDS = [
  "loss",
  "lawsuit",
  "decline",
  "drop",
  "downgrade",
  "weak",
  "bearish",
  "decrease",
  "fraud",
  "scandal",
  "risk",
  "miss",
  "slowdown",
  "concern",
  "fall",
  "plunge",
  "crash",
  "collapse",
  "failure",
  "cut",
  "layoff",
  "fire",
  "downturn",
  "slump",
  "struggle",
  "threat",
  "warning",
  "investigation",
  "penalty",
  "fine",
  "violation",
  "negative",
  "volatility",
  "uncertainty",
  "disappointing",
  "worse",
  "deficit",
  "debt",
  "bankrupt",
  "restructure",
  "delay",
];

const sanitize = (value: string) => value.toLowerCase();

const collectMatches = (keywords: string[], text: string) => {
  const normalized = sanitize(text);
  return keywords.filter((keyword) => normalized.includes(keyword));
};

export function scoreText(text: string) {
  const negativeMatches = collectMatches(NEGATIVE_KEYWORDS, text);
  const positiveMatches = collectMatches(POSITIVE_KEYWORDS, text);

  if (negativeMatches.length > positiveMatches.length) {
    return { label: "negative" as const, score: -1, negativeMatches, positiveMatches };
  }

  if (positiveMatches.length > negativeMatches.length) {
    return { label: "positive" as const, score: 1, negativeMatches, positiveMatches };
  }

  return { label: "negative" as const, score: -1, negativeMatches, positiveMatches };
}

export function scoreArticleContent(headline: string, description?: string, keywords?: string[]) {
  const combined = [headline, description, ...(keywords ?? [])]
    .filter(Boolean)
    .join(". ");

  return scoreText(combined);
}
