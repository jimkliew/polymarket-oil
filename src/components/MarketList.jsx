import DirectionWidget, { SourceBadge } from './MarketCard'

export default function MarketSummary({ data, loading, error }) {
  if (loading) return (
    <div className="space-y-3">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-petroleum-800/60 rounded-xl p-4 h-20 animate-pulse" />
      ))}
    </div>
  )
  if (error) return <p className="text-red-400 text-xs p-2">Error: {error}</p>
  if (!data) return null

  const { dailyDirection, hitTargets, kalshiDaily, forwardImpliedMean, impliedMean, kalshiImplied } = data

  // Pick interesting Polymarket hit targets
  const pmTargets = pickInteresting(hitTargets)

  // Pick interesting Kalshi targets
  const kTargets = pickKalshiInteresting(kalshiDaily)

  // Merge and dedupe (different source = keep both)
  const allTargets = [...pmTargets, ...kTargets]

  const now = new Date()
  const monthName = now.toLocaleString('en-US', { month: 'long' })
  const year = now.getFullYear()

  return (
    <div>
      {/* Daily direction */}
      <DirectionWidget direction={dailyDirection} />

      {/* Price targets */}
      {allTargets.length > 0 && (
        <div className="bg-petroleum-800/60 rounded-xl p-4 mb-3 border border-petroleum-700/50">
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3">
            Price Targets — {monthName} {year}
          </p>
          <div className="space-y-2.5">
            {allTargets.map((t, i) => (
              <a
                key={`${t.source}-${t.direction}-${t.strike}-${i}`}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between group hover:bg-petroleum-700/30 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                    t.direction === 'high' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {t.direction === 'high' ? 'ABOVE' : 'BELOW'}
                  </span>
                  <span className="text-white text-sm font-medium">${t.strike}</span>
                  <SourceBadge source={t.source} />
                  {t.volume > 0 && (
                    <span className="text-gray-600 text-[9px]">${fmtNum(t.volume)} vol</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-petroleum-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${t.direction === 'high' ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(t.probability * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-gray-300 text-xs font-mono w-12 text-right">
                    {(t.probability * 100).toFixed(0)}%
                  </span>
                  <span className="text-gray-600 text-xs group-hover:text-gray-400 transition-colors">→</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Forecast summary */}
      {(impliedMean || kalshiImplied || forwardImpliedMean) && (
        <div className="bg-petroleum-800/60 rounded-xl p-4 mb-3 border border-petroleum-700/50">
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3">Market-Implied Forecast</p>
          <div className="grid grid-cols-3 gap-3">
            {impliedMean && (
              <div>
                <p className="text-gray-600 text-[9px] uppercase mb-0.5">PM {monthName}</p>
                <p className="text-amber-400 text-lg font-bold">${impliedMean.toFixed(1)}</p>
              </div>
            )}
            {kalshiImplied && (
              <div>
                <p className="text-gray-600 text-[9px] uppercase mb-0.5">Kalshi Daily</p>
                <p className="text-violet-400 text-lg font-bold">${kalshiImplied.toFixed(1)}</p>
              </div>
            )}
            {forwardImpliedMean && (
              <div>
                <p className="text-gray-600 text-[9px] uppercase mb-0.5">Forward</p>
                <p className="text-blue-400 text-lg font-bold">${forwardImpliedMean.toFixed(1)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function pickInteresting(targets) {
  if (!targets?.length) return []
  const high = targets.filter(t => t.direction === 'high').sort((a, b) => a.strike - b.strike)
  const low = targets.filter(t => t.direction === 'low').sort((a, b) => b.strike - a.strike)
  const picks = []

  // Highest strike still likely (>90%)
  const likelyHigh = high.filter(t => t.probability > 0.9)
  if (likelyHigh.length) picks.push(likelyHigh[likelyHigh.length - 1])

  // Market "ceiling" — first strike below 50%
  const ceiling = high.find(t => t.probability < 0.5)
  if (ceiling) picks.push(ceiling)

  // Stretch target
  const stretch = high.find(t => t.probability < 0.15 && t.probability > 0.01)
  if (stretch && stretch.strike !== ceiling?.strike) picks.push(stretch)

  // Highest LOW with >5% chance
  const likelyLow = low.find(t => t.probability > 0.05)
  if (likelyLow) picks.push(likelyLow)

  // Extreme low
  const extremeLow = low.find(t => t.probability < 0.02)
  if (extremeLow && extremeLow.strike !== likelyLow?.strike) picks.push(extremeLow)

  return dedup(picks)
}

function pickKalshiInteresting(kalshiDaily) {
  if (!kalshiDaily?.length) return []
  const sorted = [...kalshiDaily].sort((a, b) => a.strike - b.strike)
  const picks = []

  // Highest strike above 90%
  const likelyHigh = sorted.filter(t => t.probability > 0.85)
  if (likelyHigh.length) picks.push({ ...likelyHigh[likelyHigh.length - 1], direction: 'high' })

  // Near 50% (the "median")
  const median = sorted.reduce((best, t) =>
    Math.abs(t.probability - 0.5) < Math.abs(best.probability - 0.5) ? t : best
  , sorted[0])
  if (median) picks.push({ ...median, direction: 'high' })

  // Lowest above 10%
  const stretch = sorted.find(t => t.probability < 0.15 && t.probability > 0.02)
  if (stretch) picks.push({ ...stretch, direction: 'high' })

  return dedup(picks)
}

function dedup(picks) {
  const seen = new Set()
  return picks.filter(t => {
    const key = `${t.source}-${t.direction}-${t.strike}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}
