"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  CategoryScale,
  ChartOptions,
  ChartData,
} from "chart.js";
import "chartjs-adapter-date-fns";

let isRegistered = false;

const ensureChartJsRegistered = () => {
  if (isRegistered) return;
  ChartJS.register(
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler,
  );
  isRegistered = true;
};

interface SentimentChartProps {
  sentimentData: Array<{ date: string; cumulativeScore: number }>;
  priceData: Array<{ date: string; close: number }>;
}

export function SentimentChart({ sentimentData, priceData }: SentimentChartProps) {
  ensureChartJsRegistered();

  const sentimentChartData: ChartData<"line"> = useMemo(() => {
    return {
      labels: sentimentData.map((d) => d.date),
      datasets: [
        {
          label: "Cumulative Sentiment",
          data: sentimentData.map((d) => d.cumulativeScore),
          borderColor: "#000000",
          backgroundColor: "rgba(0, 0, 0, 0.15)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [sentimentData]);

  const priceChartData: ChartData<"line"> = useMemo(() => {
    return {
      labels: priceData.map((d) => d.date),
      datasets: [
        {
          label: "Price ($)",
          data: priceData.map((d) => d.close),
          borderColor: "#16a34a",
          backgroundColor: "rgba(22, 163, 74, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [priceData]);

  const sentimentOptions: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true, position: "top" as const },
        tooltip: {
          callbacks: {
            title: (items) => items[0]?.label ?? "",
            label: (item) => `Sentiment: ${item.formattedValue ?? item.parsed.y}`,
          },
        },
      },
      scales: {
        x: {
          type: "time",
          time: { unit: "month", tooltipFormat: "PPP" },
          ticks: { maxRotation: 0, autoSkip: true, color: "#000000" },
          grid: { display: false },
        },
        y: {
          grid: { color: "rgba(0, 0, 0, 0.1)" },
          title: { display: true, text: "Cumulative Sentiment", color: "#000000" },
          ticks: { color: "#000000" },
        },
      },
    }),
    [],
  );

  const priceOptions: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true, position: "top" as const },
        tooltip: {
          callbacks: {
            title: (items) => items[0]?.label ?? "",
            label: (item) => `Price: $${item.formattedValue ?? item.parsed.y}`,
          },
        },
      },
      scales: {
        x: {
          type: "time",
          time: { unit: "month", tooltipFormat: "PPP" },
          ticks: { maxRotation: 0, autoSkip: true, color: "#000000" },
          grid: { display: false },
        },
        y: {
          grid: { color: "rgba(0, 0, 0, 0.1)" },
          title: { display: true, text: "Price ($)", color: "#000000" },
          ticks: { color: "#000000" },
        },
      },
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Sentiment Over Time</h3>
        <div className="h-[400px] w-full">
          <Line data={sentimentChartData} options={sentimentOptions} />
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Price Over Time</h3>
        <div className="h-[400px] w-full">
          <Line data={priceChartData} options={priceOptions} />
        </div>
      </div>
    </div>
  );
}
