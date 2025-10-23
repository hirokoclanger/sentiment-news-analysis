"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { SentimentChart } from "@/components/sentiment-chart";
import { ArticleList } from "@/components/article-list";
import {
  buildSentimentSeries,
  fetchNews,
  fetchPrices,
  scoreArticles,
  aggregatePriceData,
  type ScoredArticle,
  type SentimentSeriesPoint,
  type TimeFrame,
} from "@/lib/news";
import { NEGATIVE_KEYWORDS, POSITIVE_KEYWORDS } from "@/lib/sentiment";
import type { PriceData } from "@/lib/types";

const DEFAULT_TICKER = "AAPL";

const formatRangeLabel = (series: SentimentSeriesPoint[], range?: { from: string; to: string }) => {
  if (!range) return "";
  const firstPoint = series[0]?.date ?? range.from;
  const lastPoint = series.length ? series[series.length - 1].date : range.to;
  return `${firstPoint} → ${lastPoint}`;
};

export default function Home() {
  const [tickerInput, setTickerInput] = useState(DEFAULT_TICKER);
  const [activeTicker, setActiveTicker] = useState(DEFAULT_TICKER);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [articles, setArticles] = useState<ScoredArticle[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("daily");
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [seriesPoints, setSeriesPoints] = useState<SentimentSeriesPoint[]>([]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = tickerInput.trim();
    if (!trimmed) {
      setError("Enter a ticker symbol to search.");
      return;
    }

    runSearch(trimmed.toUpperCase());
  };

  const runSearch = useCallback(
    (symbol: string) => {
      startTransition(() => {
      const execute = async () => {
      setError(null);
      setHasSearched(true);
      setActiveTicker(symbol);

      try {
        const pricesData = await fetchPrices(symbol);
        setPriceData(pricesData.results);
        const sortedPrices = [...pricesData.results].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const firstPriceDate = sortedPrices[0]?.date;
        const lastPriceDate = sortedPrices[sortedPrices.length - 1]?.date;
        const newsData = await fetchNews(symbol, firstPriceDate, lastPriceDate);
        setRange(newsData.range);

        if (!newsData.results.length) {
          setArticles([]);
          setSeriesPoints([]);
          return;
        }

        const scored = scoreArticles(newsData.results);
        setArticles(scored);
        
        const series = buildSentimentSeries(scored, timeFrame);
        setSeriesPoints(series);
      } catch (err) {
        setArticles([]);
        setSeriesPoints([]);
        setPriceData([]);
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
      };

      void execute();
      });
    },
    [startTransition, timeFrame],
  );

  useEffect(() => {
    runSearch(DEFAULT_TICKER);
  }, [runSearch]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        const input = document.getElementById("ticker") as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const keywordLists = useMemo(
    () => [
      { title: "Positive keywords", items: POSITIVE_KEYWORDS, accent: "text-emerald-600" },
      { title: "Negative keywords", items: NEGATIVE_KEYWORDS, accent: "text-rose-600" },
    ],
    [],
  );

  const aggregatedPrices = useMemo(
    () => aggregatePriceData(priceData, timeFrame),
    [priceData, timeFrame],
  );

  const aggregatedSentiment = useMemo(
    () => (articles.length ? buildSentimentSeries(articles, timeFrame) : []),
    [articles, timeFrame],
  );

  return (
    <main className="min-h-screen bg-[#fff1e5] py-12 text-[#1a1a1a]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6">
        <header className="border-b-2 border-[#1a1a1a] pb-6 space-y-3">
          <h1 className="text-5xl font-serif font-bold tracking-tight text-[#1a1a1a]">
            News Sentiment & Price Analysis
          </h1>
          <p className="text-base text-[#333333] font-serif italic">
            Search for a US equity symbol to analyze Polygon.io news and Marketstack price data
          </p>
        </header>

        <section className="border border-[#1a1a1a] bg-[#fef6ed] p-6">
          <form className="flex flex-col gap-4 sm:flex-row" onSubmit={handleSearch}>
            <label className="flex-1" htmlFor="ticker">
              <span className="block text-xs font-serif font-semibold uppercase tracking-wider text-[#1a1a1a]">
                Ticker Symbol
              </span>
              <input
                id="ticker"
                name="ticker"
                value={tickerInput}
                onChange={(event) => setTickerInput(event.target.value.toUpperCase())}
                placeholder="e.g. AAPL"
                className="mt-1 w-full border-2 border-[#1a1a1a] bg-white px-4 py-3 text-base font-serif text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]"
                aria-label="Ticker symbol"
              />
            </label>
            <button
              type="submit"
              className="bg-[#1a1a1a] px-6 py-1 text-base font-serif font-semibold text-white transition hover:bg-[#333333] disabled:cursor-not-allowed disabled:bg-[#666666]"
              disabled={isPending}
            >
              {isPending ? "Loading…" : "Run analysis"}
            </button>
          </form>
          {error ? <p className="mt-3 text-sm font-serif text-red-800">{error}</p> : null}
          {range ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm font-serif text-[#333333]">
                {articles.length ? (
                  <>
                    Showing <span className="font-semibold">{articles.length}</span> articles for
                    {" "}
                    <span className="font-semibold">{activeTicker}</span> covering {formatRangeLabel(seriesPoints, range)}.
                  </>
                ) : (
                  <>
                    No articles found for <span className="font-semibold">{activeTicker}</span>.
                  </>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeFrame("daily")}
                  className={`px-4 py-2 text-sm font-serif font-medium transition border border-[#1a1a1a] ${
                    timeFrame === "daily"
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-white text-[#1a1a1a] hover:bg-[#f5f5f5]"
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeFrame("weekly")}
                  className={`px-4 py-2 text-sm font-serif font-medium transition border border-[#1a1a1a] ${
                    timeFrame === "weekly"
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-white text-[#1a1a1a] hover:bg-[#f5f5f5]"
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-1">
          <div className="space-y-4 border-1 border-[#1a1a1a] bg-[#fef6ed] p-6">
            <h2 className="text-2xl font-serif font-bold text-[#1a1a1a] border-b border-[#1a1a1a] pb-2">Charts</h2>
            {aggregatedSentiment.length && aggregatedPrices.length ? (
              <SentimentChart sentimentData={aggregatedSentiment} priceData={aggregatedPrices} />
            ) : isPending ? (
              <p className="text-sm font-serif text-[#666666]">Fetching data…</p>
            ) : hasSearched ? (
              <p className="border border-[#1a1a1a] bg-white p-6 text-sm font-serif text-[#666666]">
                No data available. Try another ticker.
              </p>
            ) : (
              <p className="text-sm font-serif text-[#666666]">Run a search to plot sentiment and price.</p>
            )}
          </div>
        </section>

        <section className="border-1 border-[#1a1a1a] bg-[#fef6ed] p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1a1a1a] pb-3 mb-4">
            <h2 className="text-2xl font-serif font-bold text-[#1a1a1a]">News timeline</h2>
            <p className="text-xs font-serif uppercase tracking-wide text-[#666666]">Latest to oldest</p>
          </div>
          <div className="mt-4">
            <ArticleList articles={[...articles].sort((a, b) => new Date(b.published_utc).getTime() - new Date(a.published_utc).getTime())} />
          </div>
        </section>
      </div>
    </main>
  );
}
