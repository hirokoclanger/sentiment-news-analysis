import { NewsArticle, NewsResponse, PriceData, PriceResponse } from "./types";
import { scoreArticleContent } from "./sentiment";

export interface ScoredArticle extends NewsArticle {
  sentimentScore: number;
}

export interface SentimentSeriesPoint {
  date: string;
  cumulativeScore: number;
}

export type TimeFrame = "daily" | "weekly";

const toDateKey = (iso: string) => iso.split("T")[0];

const sortByPublishDate = <T extends NewsArticle>(articles: T[]) =>
  [...articles].sort((a, b) => new Date(a.published_utc).getTime() - new Date(b.published_utc).getTime());

export async function fetchNews(ticker: string, fromDate?: string, toDate?: string) {
  const params = new URLSearchParams({ ticker: encodeURIComponent(ticker) });
  if (fromDate) params.set("from", fromDate);
  if (toDate) params.set("to", toDate);
  
  const response = await fetch(`/api/news?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error ?? "Failed to fetch news");
  }

  return (await response.json()) as NewsResponse;
}

export async function fetchPrices(ticker: string) {
  const response = await fetch(`/api/price?ticker=${encodeURIComponent(ticker)}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error ?? "Failed to fetch price data");
  }

  return (await response.json()) as PriceResponse;
}

export function scoreArticles(articles: NewsArticle[]) {
  return articles.map((article) => ({
    ...article,
    sentimentScore: scoreArticleContent(article.title, article.description, article.keywords).score,
  }));
}

const getWeekKey = (date: Date) => {
  const year = date.getFullYear();
  const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${year}-W${week.toString().padStart(2, "0")}`;
};

const aggregateByWeek = (data: { date: string; value: number }[]) => {
  const weekMap = new Map<string, { date: string; value: number; count: number }>();

  for (const item of data) {
    const date = new Date(item.date);
    const weekKey = getWeekKey(date);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { date: item.date, value: item.value, count: 1 });
    } else {
      const existing = weekMap.get(weekKey)!;
      existing.value += item.value;
      existing.count += 1;
    }
  }

  return Array.from(weekMap.values()).map((item) => ({
    date: item.date,
    value: item.value,
  }));
};

export function buildSentimentSeries(articles: ScoredArticle[], timeFrame: TimeFrame = "daily"): SentimentSeriesPoint[] {
  const sorted = sortByPublishDate(articles);
  const dailySeries: { date: string; value: number }[] = [];

  let cumulative = 0;
  const dateMap = new Map<string, number>();

  for (const article of sorted) {
    cumulative += article.sentimentScore;
    const dateKey = toDateKey(article.published_utc);
    dateMap.set(dateKey, cumulative);
  }

  for (const [date, cumulativeScore] of dateMap.entries()) {
    dailySeries.push({ date, value: cumulativeScore });
  }

  if (timeFrame === "weekly") {
    const weekly = aggregateByWeek(dailySeries);
    return weekly.map(({ date, value }) => ({ date, cumulativeScore: value }));
  }

  return dailySeries.map(({ date, value }) => ({ date, cumulativeScore: value }));
}

export function aggregatePriceData(prices: PriceData[], timeFrame: TimeFrame = "daily") {
  if (timeFrame === "daily") {
    return prices.map((p) => ({ date: p.date, close: p.close }));
  }

  const weekMap = new Map<string, { date: string; close: number; count: number }>();

  for (const price of prices) {
    const date = new Date(price.date);
    const weekKey = getWeekKey(date);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { date: price.date, close: price.close, count: 1 });
    } else {
      const existing = weekMap.get(weekKey)!;
      // Use the latest close price for the week
      if (new Date(price.date) > new Date(existing.date)) {
        existing.date = price.date;
        existing.close = price.close;
      }
    }
  }

  return Array.from(weekMap.values()).map(({ date, close }) => ({ date, close }));
}

const formatChartLabels = (series: SentimentSeriesPoint[]) => series.map((point) => point.date);
const formatChartData = (series: SentimentSeriesPoint[]) => series.map((point) => point.cumulativeScore);

export const toChartSeries = (series: SentimentSeriesPoint[]) => ({
  labels: formatChartLabels(series),
  datasets: [
    {
      label: "Sentiment",
      data: formatChartData(series),
      borderColor: "#2563eb",
      backgroundColor: "rgba(37, 99, 235, 0.2)",
      tension: 0.3,
    },
  ],
});
