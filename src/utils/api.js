// Gamma API needs CORS proxy. Kalshi needs CORS proxy. EIA supports CORS natively.
const isDev = import.meta.env.DEV
const GAMMA_BASE = isDev ? '/gamma-api' : '/api/gamma'
const KALSHI_BASE = isDev ? '/kalshi-api/trade-api/v2' : '/api/kalshi/trade-api/v2'
const EIA_BASE = 'https://api.eia.gov/v2'

// ===== POLYMARKET (Gamma API) =====

async function fetchEventBySlug(slug) {
  const res = await fetch(`${GAMMA_BASE}/events?slug=${slug}`)
  const data = await res.json()
  return Array.isArray(data) && data.length > 0 ? data[0] : null
}

function getMonthSlugParts() {
  const now = new Date()
  return {
    month: now.toLocaleString('en-US', { month: 'long' }).toLowerCase(),
    day: now.getDate(),
    year: now.getFullYear(),
    monthShort: now.toLocaleString('en-US', { month: 'short' }).toLowerCase(),
  }
}

function getNextTradingDay() {
  const now = new Date()
  const dow = now.getDay()
  if (dow === 0) now.setDate(now.getDate() + 1)
  else if (dow === 6) now.setDate(now.getDate() + 2)
  return {
    month: now.toLocaleString('en-US', { month: 'long' }).toLowerCase(),
    day: now.getDate(),
    year: now.getFullYear(),
  }
}

function getForwardSlugParts() {
  const now = new Date()
  const forward = new Date(now.getFullYear(), now.getMonth() + 3, 1)
  return {
    month: forward.toLocaleString('en-US', { month: 'short' }).toLowerCase(),
    year: forward.getFullYear(),
  }
}

export async function fetchPolymarketEvents() {
  const { month } = getMonthSlugParts()
  const trading = getNextTradingDay()
  const fwd = getForwardSlugParts()

  const slugs = {
    settlement: `what-will-crude-oil-cl-settle-at-in-${month}`,
    aboveBelow: `crude-oil-cl-above-end-of-${month}`,
    hitTargets: `will-crude-oil-cl-hit-by-end-of-${month}`,
    dailyDirection: `cl-up-or-down-on-${trading.month}-${trading.day}-${trading.year}`,
    forwardSettle: `cl-settle-${fwd.month}-${fwd.year}`,
    forwardAbove: `cl-over-under-${fwd.month}-${fwd.year}`,
  }

  const entries = Object.entries(slugs)
  const results = await Promise.allSettled(
    entries.map(([, slug]) => fetchEventBySlug(slug))
  )

  const data = {}
  entries.forEach(([key], i) => {
    const r = results[i]
    data[key] = r.status === 'fulfilled' && r.value ? r.value : null
  })
  return data
}

// ===== KALSHI =====

export async function fetchKalshiWTIMarkets() {
  // Fetch daily WTI markets for the next trading day
  const trading = getNextTradingDay()
  const mon = String(trading.month).slice(0, 3).toUpperCase()
  const dayPad = String(trading.day).padStart(2, '0')
  const yr = String(trading.year).slice(2)
  const datePrefix = `${yr}${mon}${dayPad}`

  const [dailyRes, monthlyRes] = await Promise.allSettled([
    fetch(`${KALSHI_BASE}/markets?series_ticker=KXWTI&limit=50`),
    fetch(`${KALSHI_BASE}/markets?series_ticker=KXOIL&limit=50`),
  ])

  const daily = dailyRes.status === 'fulfilled' ? await dailyRes.value.json() : { markets: [] }
  const monthly = monthlyRes.status === 'fulfilled' ? await monthlyRes.value.json() : { markets: [] }

  // Filter daily to active markets for the next trading day
  const dailyMarkets = (daily.markets || []).filter(m =>
    m.status === 'active' && m.ticker.includes(datePrefix)
  )

  // All active monthly
  const monthlyMarkets = (monthly.markets || []).filter(m => m.status === 'active')

  return { dailyMarkets, monthlyMarkets }
}

// Parse Kalshi daily WTI into strike/probability pairs
export function parseKalshiDaily(markets) {
  if (!markets?.length) return []
  return markets
    .map(m => {
      const match = m.ticker.match(/T(\d+\.?\d*)/)
      const strike = match ? parseFloat(match[1]) : null
      // Use midpoint of bid/ask as probability (prices are in cents, 0-100)
      const yesBid = m.yes_bid || 0
      const yesAsk = m.yes_ask || 100
      const probability = (yesBid + yesAsk) / 200 // convert cents to 0-1
      return {
        strike,
        probability,
        volume: m.volume || 0,
        ticker: m.ticker,
        url: `https://kalshi.com/markets/${m.ticker}`,
        source: 'kalshi',
      }
    })
    .filter(d => d.strike !== null)
    .sort((a, b) => a.strike - b.strike)
}

// ===== POLYMARKET PARSERS =====

export function parseSettlementDistribution(event) {
  if (!event?.markets) return []
  const slug = event.slug || ''
  return event.markets
    .map(m => {
      const question = m.question || ''
      const outcomes = safeJsonParse(m.outcomes, [])
      const prices = safeJsonParse(m.outcomePrices, [])
      const yesIdx = outcomes.indexOf('Yes')
      const probability = yesIdx >= 0 ? parseFloat(prices[yesIdx]) : parseFloat(prices[0])
      const range = extractPriceRange(question)
      return {
        range: range.label,
        low: range.low,
        high: range.high,
        midpoint: (range.low + range.high) / 2,
        probability,
        volume: parseFloat(m.volume || 0),
        url: `https://polymarket.com/event/${slug}`,
        source: 'polymarket',
      }
    })
    .filter(d => d.range && !isNaN(d.probability))
    .sort((a, b) => a.low - b.low)
}

export function parseHitTargets(event) {
  if (!event?.markets) return []
  const slug = event.slug || ''
  return event.markets
    .map(m => {
      const question = m.question || ''
      const outcomes = safeJsonParse(m.outcomes, [])
      const prices = safeJsonParse(m.outcomePrices, [])
      const yesIdx = outcomes.indexOf('Yes')
      const probability = yesIdx >= 0 ? parseFloat(prices[yesIdx]) : parseFloat(prices[0])
      const match = question.match(/\$(\d+)/i)
      const strike = match ? parseInt(match[1]) : null
      const direction = question.toLowerCase().includes('(high)') ? 'high'
        : question.toLowerCase().includes('(low)') ? 'low' : 'unknown'
      return {
        strike, direction, probability,
        volume: parseFloat(m.volume || 0),
        url: `https://polymarket.com/event/${slug}`,
        source: 'polymarket',
      }
    })
    .filter(d => d.strike !== null && !isNaN(d.probability))
    .sort((a, b) => a.strike - b.strike)
}

export function parseDailyDirection(event) {
  if (!event?.markets?.[0]) return null
  const m = event.markets[0]
  const outcomes = safeJsonParse(m.outcomes, [])
  const prices = safeJsonParse(m.outcomePrices, [])
  const result = {}
  outcomes.forEach((outcome, i) => {
    result[outcome.toLowerCase()] = parseFloat(prices[i])
  })
  result.volume = parseFloat(m.volume || 0)
  result.question = m.question || event.title
  result.url = `https://polymarket.com/event/${event.slug || ''}`
  result.source = 'polymarket'
  return result
}

export function parseAboveBelowCurve(event) {
  if (!event?.markets) return []
  return event.markets
    .map(m => {
      const question = m.question || ''
      const outcomes = safeJsonParse(m.outcomes, [])
      const prices = safeJsonParse(m.outcomePrices, [])
      const yesIdx = outcomes.indexOf('Yes')
      const probability = yesIdx >= 0 ? parseFloat(prices[yesIdx]) : parseFloat(prices[0])
      const match = question.match(/\$(\d+)/i)
      const strike = match ? parseInt(match[1]) : null
      return { strike, probability, volume: parseFloat(m.volume || 0), source: 'polymarket' }
    })
    .filter(d => d.strike !== null && !isNaN(d.probability))
    .sort((a, b) => a.strike - b.strike)
}

export function computeImpliedMean(distribution) {
  if (!distribution?.length) return null
  const totalProb = distribution.reduce((sum, d) => sum + d.probability, 0)
  if (totalProb === 0) return null
  return distribution.reduce((sum, d) => sum + d.midpoint * d.probability, 0) / totalProb
}

// Compute implied mean from Kalshi CDF (above/below strikes)
export function computeKalshiImplied(kalshiDaily) {
  if (!kalshiDaily?.length) return null
  // Use midpoint: probability-weighted average of strikes
  // P(above X) gives us 1 - CDF(X), so we can derive a PDF
  const sorted = [...kalshiDaily].sort((a, b) => a.strike - b.strike)
  if (sorted.length < 2) return sorted[0]?.strike || null

  let weightedSum = 0
  let totalWeight = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    const strike = (sorted[i].strike + sorted[i + 1].strike) / 2
    const pdfSlice = sorted[i].probability - sorted[i + 1].probability
    if (pdfSlice > 0) {
      weightedSum += strike * pdfSlice
      totalWeight += pdfSlice
    }
  }
  // Add tail contributions
  const lowestStrike = sorted[0].strike - 2
  const highestStrike = sorted[sorted.length - 1].strike + 2
  const topTail = sorted[sorted.length - 1].probability
  const bottomTail = 1 - sorted[0].probability
  weightedSum += highestStrike * topTail + lowestStrike * bottomTail
  totalWeight += topTail + bottomTail

  return totalWeight > 0 ? weightedSum / totalWeight : null
}

// ===== EIA =====

export async function fetchWTIPrice(apiKey) {
  const url = `${EIA_BASE}/petroleum/pri/spt/data/?api_key=${apiKey}` +
    `&frequency=daily&data[0]=value&facets[series][]=RWTC` +
    `&sort[0][column]=period&sort[0][direction]=desc&length=30`
  const res = await fetch(url)
  const data = await res.json()
  return data?.response?.data || []
}

export async function fetchWTIAlphaVantage(apiKey) {
  const url = `https://www.alphavantage.co/query?function=WTI&interval=daily&apikey=${apiKey}`
  const res = await fetch(url)
  return res.json()
}

// ===== HELPERS =====

function safeJsonParse(str, fallback) {
  if (Array.isArray(str)) return str
  try { return JSON.parse(str) } catch { return fallback }
}

function extractPriceRange(question) {
  const q = question.toLowerCase()
  const rangeMatch = q.match(/\$(\d+)\s*(?:and|-)\s*\$(\d+)/)
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1])
    const high = parseInt(rangeMatch[2])
    return { label: `$${low}-${high}`, low, high }
  }
  const belowMatch = q.match(/(?:less than|under|below|<)\s*\$(\d+)/)
  if (belowMatch) {
    const val = parseInt(belowMatch[1])
    return { label: `<$${val}`, low: val - 5, high: val }
  }
  const aboveMatch = q.match(/(?:above|over|>)\s*\$(\d+)|\$(\d+)\+/)
  if (aboveMatch) {
    const val = parseInt(aboveMatch[1] || aboveMatch[2])
    return { label: `$${val}+`, low: val, high: val + 5 }
  }
  const anyMatch = q.match(/\$(\d+)/)
  if (anyMatch) {
    const val = parseInt(anyMatch[1])
    return { label: `$${val}`, low: val - 2.5, high: val + 2.5 }
  }
  return { label: '', low: 0, high: 0 }
}
