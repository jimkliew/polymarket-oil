import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function SpotPricePanel({ price, history, loading, error, impliedMean, kalshiImplied }) {
  if (loading) return <div className="bg-petroleum-800/60 rounded-xl h-[250px] mb-3 animate-pulse" />
  if (error || !price) return (
    <div className="bg-petroleum-800/60 rounded-xl p-4 mb-3 border border-petroleum-700/50">
      <p className="text-gray-500 text-xs">WTI price unavailable — add EIA API key in Settings</p>
    </div>
  )

  const prev = history.length >= 2 ? history[history.length - 2].price : price.value
  const change = price.value - prev
  const pct = ((change / prev) * 100).toFixed(2)

  return (
    <div className="bg-petroleum-800/60 rounded-xl p-4 mb-3 border border-petroleum-700/50">
      {/* Header */}
      <div className="flex justify-between items-start mb-1">
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-0.5">WTI Crude Spot</p>
          <div className="flex items-baseline gap-2">
            <span className="text-white text-2xl font-bold">${price.value.toFixed(2)}</span>
            <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ({change >= 0 ? '+' : ''}{pct}%)
            </span>
          </div>
        </div>
        <div className="text-right space-y-0.5">
          {impliedMean && (
            <div>
              <span className="text-gray-600 text-[9px] uppercase">PM Implied </span>
              <span className="text-amber-400 text-sm font-semibold">${impliedMean.toFixed(1)}</span>
            </div>
          )}
          {kalshiImplied && (
            <div>
              <span className="text-gray-600 text-[9px] uppercase">Kalshi Implied </span>
              <span className="text-violet-400 text-sm font-semibold">${kalshiImplied.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickLine={{ stroke: '#374151' }}
            axisLine={{ stroke: '#374151' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickLine={{ stroke: '#374151' }}
            axisLine={{ stroke: '#374151' }}
            tickFormatter={v => `$${v}`}
            width={48}
          />
          <Tooltip
            contentStyle={{ background: '#0d1526', border: '1px solid #1e3a6e', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(v) => [`$${v.toFixed(2)}`, 'WTI']}
          />
          {impliedMean && (
            <ReferenceLine
              y={impliedMean}
              stroke="#f59e0b"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{ value: `PM $${impliedMean.toFixed(0)}`, position: 'right', fill: '#f59e0b', fontSize: 9 }}
            />
          )}
          {kalshiImplied && (
            <ReferenceLine
              y={kalshiImplied}
              stroke="#a78bfa"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{ value: `K $${kalshiImplied.toFixed(0)}`, position: 'left', fill: '#a78bfa', fontSize: 9 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#60a5fa"
            dot={false}
            strokeWidth={2}
            activeDot={{ r: 3, fill: '#60a5fa' }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1">
        <span className="text-gray-600 text-[9px]">Source: EIA ({price.period})</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-amber-400 inline-block" />
          <span className="text-gray-600 text-[9px]">Polymarket</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-violet-400 inline-block" />
          <span className="text-gray-600 text-[9px]">Kalshi</span>
        </div>
      </div>
    </div>
  )
}
