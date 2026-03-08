import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function DistributionChart({ distribution, loading, error, currentSpot, title }) {
  if (loading) return <div className="bg-petroleum-800/60 rounded-xl h-[280px] mb-3 animate-pulse" />
  if (error || !distribution?.length) return (
    <div className="bg-petroleum-800/60 rounded-xl p-4 mb-3 border border-petroleum-700/50">
      <p className="text-gray-500 text-xs">Settlement distribution unavailable</p>
    </div>
  )

  const spotBarIdx = currentSpot
    ? distribution.findIndex(d => currentSpot >= d.low && currentSpot < d.high)
    : -1

  const totalVolume = distribution.reduce((s, d) => s + d.volume, 0)

  return (
    <div className="bg-petroleum-800/60 rounded-xl p-4 mb-3 border border-petroleum-700/50">
      <div className="flex justify-between items-baseline mb-3">
        <p className="text-gray-500 text-[10px] uppercase tracking-widest">
          {title || 'Settlement Distribution'}
        </p>
        {totalVolume > 0 && (
          <p className="text-gray-600 text-[10px]">${fmtNum(totalVolume)} traded</p>
        )}
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={distribution} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="range"
            tick={{ fill: '#9ca3af', fontSize: 9 }}
            tickLine={{ stroke: '#374151' }}
            axisLine={{ stroke: '#374151' }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={45}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickLine={{ stroke: '#374151' }}
            axisLine={{ stroke: '#374151' }}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            width={38}
          />
          <Tooltip
            contentStyle={{ background: '#0d1526', border: '1px solid #1e3a6e', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(v, name, props) => {
              const vol = props.payload?.volume
              return [
                `${(v * 100).toFixed(1)}%${vol > 0 ? ` ($${fmtNum(vol)} vol)` : ''}`,
                'Probability'
              ]
            }}
          />
          <Bar dataKey="probability" radius={[3, 3, 0, 0]} maxBarSize={40}>
            {distribution.map((_, i) => (
              <Cell
                key={i}
                fill={i === spotBarIdx ? '#f59e0b' : '#3b82f6'}
                fillOpacity={i === spotBarIdx ? 0.95 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-3 mt-1">
        {currentSpot && spotBarIdx >= 0 && (
          <span className="text-amber-400/70 text-[9px]">
            Current spot (${currentSpot.toFixed(2)}) highlighted
          </span>
        )}
        <span className="text-gray-600 text-[9px] ml-auto">Source: Polymarket</span>
      </div>
    </div>
  )
}

function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}
