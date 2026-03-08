# Oil Markets — Crude Oil Intelligence Dashboard

A mobile-first PWA that aggregates crude oil prediction market data from **Polymarket** and **Kalshi** alongside live WTI spot prices. Built for traders who want a single view of spot prices, settlement distributions, and market-implied forecasts.

## Features

- **WTI Spot Chart** — 14-day line chart with labeled axes, daily change, and market-implied reference lines from both Polymarket and Kalshi
- **Settlement Distribution** — Polymarket bar chart showing probability of each CL price bucket for end-of-month settlement
- **Daily Direction** — UP/DOWN probability widget for the next trading day
- **Price Targets** — Curated list of interesting strike prices with probabilities, volume, source badges (Polymarket/Kalshi), and direct links to place bets
- **Market-Implied Forecast** — Probability-weighted implied prices from Polymarket (monthly), Kalshi (daily), and forward month
- **PWA** — Installable on iPhone home screen, offline caching, full-screen standalone mode
- **Auto-Refresh** — Configurable polling (30s / 1min / 5min)

## Quick Start

```bash
cp .env.example .env
# Edit .env and add your EIA API key
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_EIA_API_KEY` | Yes | Free key from [eia.gov](https://www.eia.gov/opendata/register.php) for WTI spot prices |

Polymarket and Kalshi APIs are public and require no keys.

## Deploy to Vercel

```bash
vercel --prod
```

Set `VITE_EIA_API_KEY` in the Vercel dashboard under Settings > Environment Variables.

## iPhone Installation

1. Open the deployed URL in **Safari**
2. Tap **Share** (box with arrow)
3. Tap **"Add to Home Screen"**
4. Name it "OilMkts" and tap **Add**

## Data Sources

| Source | Data | Update Frequency |
|---|---|---|
| EIA | WTI Cushing spot price | Daily (weekdays) |
| Polymarket | CL settlement distributions, hit targets, daily direction | Real-time (every trade) |
| Kalshi | WTI daily strike prices | Real-time (every trade) |

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React (Vite) |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| PWA | vite-plugin-pwa |
| CORS Proxy | Vercel Serverless Functions |
| Deployment | Vercel |
