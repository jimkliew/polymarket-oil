# CLAUDE.md — Polymarket Oil Intelligence Dashboard

## Project Overview

Mobile-first PWA that aggregates crude oil prediction market data from **Polymarket** and **Kalshi** alongside live WTI spot prices from EIA. Designed as an iPhone home screen app (standalone PWA). Deployed to Vercel with serverless CORS proxies.

## Tech Stack

- **Framework:** React (Vite)
- **Styling:** Tailwind CSS v3 (dark petroleum theme, custom color palette)
- **Charts:** Recharts (LineChart, BarChart, ReferenceLine)
- **PWA:** vite-plugin-pwa (service worker + manifest)
- **Deployment:** Vercel (static site + serverless functions for CORS proxy)

## Project Structure

```
polymarket-oil/
├── api/                          # Vercel serverless CORS proxies
│   ├── gamma.js                  # Polymarket Gamma API proxy
│   └── kalshi.js                 # Kalshi API proxy
├── public/icons/                 # PWA icons (192x192, 512x512)
├── scripts/generate-icons.mjs    # Icon generation script
├── src/
│   ├── main.jsx                  # Entry point
│   ├── App.jsx                   # App shell, settings state, layout
│   ├── index.css                 # Tailwind directives + body styles
│   ├── components/
│   │   ├── SpotPricePanel.jsx    # WTI spot line chart + implied price overlays
│   │   ├── DistributionChart.jsx # Settlement probability bar chart
│   │   ├── MarketCard.jsx        # Daily direction UP/DOWN widget
│   │   ├── MarketList.jsx        # Price targets + forecast summary
│   │   └── SettingsDrawer.jsx    # Slide-up settings panel
│   ├── hooks/
│   │   ├── usePolymarkets.js     # Fetches PM + Kalshi, parses all data
│   │   └── useWTIPrice.js        # Fetches WTI price from EIA / Alpha Vantage
│   └── utils/
│       └── api.js                # All API calls + parsers
├── .env                          # Local env vars (not committed)
├── .env.example                  # Template for env vars
├── vite.config.js                # Vite + PWA + dev proxy config
├── tailwind.config.js            # Custom petroleum color palette
└── vercel.json                   # Serverless rewrites
```

## Commands

```bash
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
vercel --prod      # Deploy to Vercel
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```
VITE_EIA_API_KEY=your_eia_key_here
```

For Vercel deployment, set `VITE_EIA_API_KEY` in the Vercel dashboard under Environment Variables.

## APIs Used

### Polymarket (Gamma API)
- **Base:** `gamma-api.polymarket.com`
- **No auth needed.** CORS blocked — proxied through Vite dev proxy and Vercel serverless `/api/gamma`.
- **Data:** Fetches events by slug (e.g., `what-will-crude-oil-cl-settle-at-in-march`). Returns settlement distributions, above/below CDF curves, hit targets, and daily direction markets.
- **Slug patterns are date-dynamic** — built from current month/day/year in `api.js`.

### Kalshi
- **Base:** `api.elections.kalshi.com/trade-api/v2`
- **No auth needed for reads.** CORS blocked — proxied via `/api/kalshi`.
- **Data:** Fetches `KXWTI` series for daily WTI strike prices with bid/ask probabilities.

### EIA
- **Base:** `api.eia.gov/v2`
- **Requires free API key** (set in `.env`). CORS supported natively — no proxy needed.
- **Data:** WTI Cushing spot price (series RWTC), daily frequency, last 30 days.

### Alpha Vantage (optional fallback)
- Free tier, 25 calls/day. Key entered in Settings drawer.

## Key Design Decisions

- **Slug-based fetching** — No keyword search. Events fetched by deterministic slugs derived from current date. Eliminates false positives (e.g., "Edmonton Oilers").
- **Dual-source** — Polymarket for monthly settlement distributions + hit targets; Kalshi for daily WTI strike data. Both shown with source badges.
- **Implied price computation** — Weighted average of settlement bucket midpoints (Polymarket) and CDF-derived mean (Kalshi).
- **CORS proxies** — Dev: Vite `server.proxy`. Production: Vercel serverless functions in `/api/`.
- **Dark-only UI** — petroleum color palette (#0a0f1e base).
- **Tailwind v3** — traditional config with custom colors (not v4).
- **Auto-refresh** — 60s default, configurable in settings.

## CORS Architecture

```
Browser → /gamma-api/*  → Vite proxy (dev) or /api/gamma (prod) → gamma-api.polymarket.com
Browser → /kalshi-api/* → Vite proxy (dev) or /api/kalshi (prod) → api.elections.kalshi.com
Browser → api.eia.gov   → Direct (CORS supported)
```
