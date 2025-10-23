import { format, parseISO } from "date-fns";
import Link from "next/link";
import { ScoredArticle } from "@/lib/news";

const sentimentStyles = {
  positive: "bg-green-50 text-green-900 border-green-800",
  negative: "bg-red-50 text-red-900 border-red-800",
  neutral: "bg-gray-50 text-gray-900 border-gray-800",
} as const;

const sentimentLabels = {
  positive: "Positive",
  negative: "Negative",
  neutral: "Neutral",
} as const;

const toSentimentKey = (score: number) => {
  if (score > 0) return "positive" as const;
  if (score < 0) return "negative" as const;
  return "neutral" as const;
};

const formatPublishDate = (iso: string) => {
  try {
    return format(parseISO(iso), "PPpp");
  } catch {
    return iso;
  }
};

interface ArticleListProps {
  articles: ScoredArticle[];
}

export function ArticleList({ articles }: ArticleListProps) {
  if (!articles.length) {
    return (
      <p className="border border-[#1a1a1a] bg-white p-6 text-sm font-serif text-[#666666]">
        No news items found for this range.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => {
        const sentiment = toSentimentKey(article.sentimentScore);
        const summary = article.description ?? "";
        return (
          <article
            key={article.id}
            className="border-b-2 border-[#1a1a1a] bg-white p-5 transition hover:bg-[#f9f9f9]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-serif font-bold text-[#1a1a1a]">{article.title}</h3>
              <span
                className={`border px-3 py-1 text-xs font-serif font-semibold ${sentimentStyles[sentiment]}`}
              >
                {sentimentLabels[sentiment]} ({article.sentimentScore})
              </span>
            </div>
            <p className="mt-2 text-sm font-serif text-[#333333] leading-relaxed">
              {summary ? summary : "No summary provided."}
            </p>
            <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-serif text-[#666666]">
              <div className="flex items-center gap-1">
                <dt className="font-semibold">Published:</dt>
                <dd>{formatPublishDate(article.published_utc)}</dd>
              </div>
              {article.tickers.length ? (
                <div className="flex items-center gap-1">
                  <dt className="font-semibold">Tickers:</dt>
                  <dd>{article.tickers.join(", ")}</dd>
                </div>
              ) : null}
              {article.url ? (
                <div className="flex items-center gap-1">
                  <dt className="sr-only">Source:</dt>
                  <dd>
                    <Link
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#1a1a1a] underline hover:text-[#666666]"
                    >
                      Read full story
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>
          </article>
        );
      })}
    </div>
  );
}
