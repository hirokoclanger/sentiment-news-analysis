## Sentiment News Analysis

This app surfaces Polygon.io news for a stock symbol, scores each article with simple keyword heuristics, and charts the cumulative sentiment across the past two years plus the current day.

![Example](https://github.com/hirokoclanger/sentiment-news-analysis/blob/bca66147b134574f60bc8704c97d9c4ce07a1481/public/ezgif-134f2312059b82.gif)


### Prerequisites

- Node.js 18 or newer
- Polygon.io API key with access to the news endpoint

### Environment setup

Create a `.env.local` file in the project root and set your API key:

```bash
POLYGON_API_KEY=replace-with-your-key
MARKETSTACK_API_KEY=replace-with-your-key
```

Restart the dev server after adding or changing environment variables.

### Install dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and search for any US equity ticker (for example, `AAPL`, `NVDA`, or `MSFT`).

### How sentiment scoring works

The sentiment score for each article is determined by scanning the headline, optional description, and Polygon-provided keywords for curated positive or negative terms. Positive matches contribute `+1`, negative matches contribute `-1`, and ties resolve to `0`. The time-series chart plots the cumulative sum of these scores over time.

### Useful npm scripts

- `npm run dev` – start the development server
- `npm run build` – create an optimized production build


