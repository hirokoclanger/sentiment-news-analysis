export interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  published_utc: string;
  url?: string;
  tickers: string[];
  image_url?: string;
  keywords: string[];
}

export interface NewsResponse {
  range: { from: string; to: string };
  count: number;
  results: NewsArticle[];
}

export interface PriceData {
  date: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceResponse {
  range: { from: string; to: string };
  count: number;
  results: PriceData[];
}
