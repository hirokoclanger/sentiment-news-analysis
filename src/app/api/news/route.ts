import { NextResponse } from "next/server";

const POLYGON_NEWS_URL = "https://api.polygon.io/v2/reference/news";
const MAX_ARTICLES = 400;
const PAGE_SIZE = 50;

interface PolygonNewsItem {
  id?: string;
  title: string;
  description?: string;
  published_utc: string;
  article_url?: string;
  tickers?: string[];
  amp_url?: string;
  image_url?: string;
  keywords?: string[];
}

interface PolygonNewsResponse {
  results?: PolygonNewsItem[];
  next_url?: string;
  status?: string;
  error?: string;
}

const toIsoDate = (value: Date) => value.toISOString().split("T")[0];

const buildDateRange = () => {
  const today = new Date();
  const to = toIsoDate(today);
  const fromDate = new Date(today);
  fromDate.setFullYear(fromDate.getFullYear() - 2);
  const from = toIsoDate(fromDate);
  return { from, to };
};

const withApiKey = (url: string, apiKey: string) => {
  const parsed = new URL(url);
  parsed.searchParams.set("apiKey", apiKey);
  return parsed.toString();
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ticker = url.searchParams.get("ticker")?.trim().toUpperCase();
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing required 'ticker' query parameter." },
      { status: 400 },
    );
  }

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "POLYGON_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  // Use provided dates or fall back to default 2-year range
  let from: string;
  let to: string;
  
  if (fromParam && toParam) {
    from = fromParam;
    to = toParam;
  } else {
    const defaultRange = buildDateRange();
    from = defaultRange.from;
    to = defaultRange.to;
  }

  const params = new URLSearchParams({
    ticker,
    limit: PAGE_SIZE.toString(),
    order: "asc",
    "published_utc.gte": `${from}T00:00:00Z`,
    "published_utc.lte": `${to}T23:59:59Z`,
  });
  params.set("apiKey", apiKey);

  const articles: PolygonNewsItem[] = [];
  let nextUrl = `${POLYGON_NEWS_URL}?${params.toString()}`;

  try {
    while (nextUrl && articles.length < MAX_ARTICLES) {
      const response = await fetch(nextUrl, {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 * 60 },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Polygon API request failed: ${response.statusText}`, detail: errorText },
          { status: response.status },
        );
      }

      const data = (await response.json()) as PolygonNewsResponse;

      if (data.error) {
        return NextResponse.json(
          { error: "Polygon API error", detail: data.error },
          { status: 502 },
        );
      }

      if (!data.results?.length) {
        break;
      }

      articles.push(...data.results);

      if (!data.next_url) {
        break;
      }

      nextUrl = withApiKey(data.next_url, apiKey);
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reach Polygon API", detail: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }

  const sanitized = articles.slice(0, MAX_ARTICLES).map((item) => ({
    id: item.id ?? `${item.published_utc}-${item.article_url ?? ""}`,
    title: item.title,
    description: item.description,
    published_utc: item.published_utc,
    url: item.article_url ?? "",
    tickers: item.tickers ?? [],
    image_url: item.image_url,
    keywords: item.keywords ?? [],
  }));

  return NextResponse.json({
    range: { from, to },
    count: sanitized.length,
    results: sanitized,
  });
}
