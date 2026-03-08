import { useState, useEffect, useCallback } from 'react'
import {
  fetchPolymarketEvents,
  fetchKalshiWTIMarkets,
  parseSettlementDistribution,
  parseAboveBelowCurve,
  parseHitTargets,
  parseDailyDirection,
  parseKalshiDaily,
  computeImpliedMean,
  computeKalshiImplied,
} from '../utils/api'

export function usePolymarkets(refreshInterval = 60000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const [pmEvents, kalshiData] = await Promise.allSettled([
        fetchPolymarketEvents(),
        fetchKalshiWTIMarkets(),
      ])

      const pm = pmEvents.status === 'fulfilled' ? pmEvents.value : {}
      const kalshi = kalshiData.status === 'fulfilled' ? kalshiData.value : {}

      // Polymarket: settlement distribution
      const distribution = parseSettlementDistribution(pm.settlement)
      const impliedMean = computeImpliedMean(distribution)

      // Polymarket: above/below CDF
      const cdfCurve = parseAboveBelowCurve(pm.aboveBelow)

      // Polymarket: hit targets
      const hitTargets = parseHitTargets(pm.hitTargets)

      // Polymarket: daily direction
      const dailyDirection = parseDailyDirection(pm.dailyDirection)

      // Polymarket: forward month
      const forwardDistribution = parseSettlementDistribution(pm.forwardSettle)
      const forwardImpliedMean = computeImpliedMean(forwardDistribution)

      // Kalshi: daily WTI strikes (CDF-style)
      const kalshiDaily = parseKalshiDaily(kalshi.dailyMarkets)
      const kalshiImplied = computeKalshiImplied(kalshiDaily)

      // Merge hit targets from Kalshi daily into combined targets
      const kalshiTargets = kalshiDaily.map(k => ({
        strike: k.strike,
        direction: 'high',
        probability: k.probability,
        volume: k.volume,
        url: k.url,
        source: 'kalshi',
      }))

      setData({
        // Polymarket
        events: pm,
        distribution,
        impliedMean,
        cdfCurve,
        hitTargets,
        dailyDirection,
        forwardDistribution,
        forwardImpliedMean,
        settlementTitle: pm.settlement?.title || 'CL Settlement',
        forwardTitle: pm.forwardSettle?.title || '',
        // Kalshi
        kalshiDaily,
        kalshiImplied,
        kalshiTargets,
        // Combined
        allTargets: [...hitTargets, ...kalshiTargets],
      })
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, refreshInterval)
    return () => clearInterval(interval)
  }, [load, refreshInterval])

  return { data, loading, error, lastUpdated, refresh: load }
}
