import { NextResponse } from "next/server";

const MARKETSTACK_API_URL = "http://api.marketstack.com/v1/eod";

interface MarketStackEODItem {
  date: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adj_close?: number;
}

interface MarketStackResponse {
  data?: MarketStackEODItem[];
  error?: {
    code: string;
    message: string;
  };
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ticker = url.searchParams.get("ticker")?.trim().toUpperCase();

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing required 'ticker' query parameter." },
      { status: 400 },
    );
  }

  const apiKey = process.env.MARKETSTACK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "MARKETSTACK_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const { from, to } = buildDateRange();

  const params = new URLSearchParams({
    access_key: apiKey,
    symbols: ticker,
    date_from: from,
    date_to: to,
    limit: "1000",
  });

  try {
    const response = await fetch(`${MARKETSTACK_API_URL}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Marketstack API request failed: ${response.statusText}`, detail: errorText },
        { status: response.status },
      );
    }

    const data = (await response.json()) as MarketStackResponse;

    if (data.error) {
      return NextResponse.json(
        { error: "Marketstack API error", detail: data.error.message },
        { status: 502 },
      );
    }

    if (!data.data?.length) {
      return NextResponse.json({
        range: { from, to },
        count: 0,
        results: [],
      });
    }

    const sanitized = data.data.map((item) => ({
      date: item.date.split("T")[0],
      symbol: item.symbol,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));

    return NextResponse.json({
      range: { from, to },
      count: sanitized.length,
      results: sanitized,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reach Marketstack API", detail: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
