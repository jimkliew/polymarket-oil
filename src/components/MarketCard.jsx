export default function DirectionWidget({ direction }) {
  if (!direction) return null

  const up = direction.up || 0
  const down = direction.down || 0

  return (
    <a
      href={direction.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-petroleum-800/60 rounded-xl p-4 mb-3 border border-petroleum-700/50 hover:border-petroleum-600 transition-colors"
    >
      <div className="flex justify-between items-baseline mb-2">
        <p className="text-gray-500 text-[10px] uppercase tracking-widest">Next Trading Day</p>
        <div className="flex items-center gap-2">
          {direction.volume > 0 && (
            <span className="text-gray-600 text-[9px]">${fmtNum(direction.volume)} vol</span>
          )}
          <SourceBadge source={direction.source} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-emerald-400 text-xs font-semibold">UP</span>
            <span className="text-emerald-400 text-lg font-bold">{(up * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2.5 bg-petroleum-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500/80 rounded-full transition-all"
              style={{ width: `${up * 100}%` }}
            />
          </div>
        </div>
        <div className="w-px h-10 bg-petroleum-600" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-red-400 text-xs font-semibold">DOWN</span>
            <span className="text-red-400 text-lg font-bold">{(down * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2.5 bg-petroleum-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500/80 rounded-full transition-all"
              style={{ width: `${down * 100}%` }}
            />
          </div>
        </div>
      </div>
    </a>
  )
}

export function SourceBadge({ source }) {
  if (source === 'kalshi') return (
    <span className="text-[8px] font-medium px-1 py-0.5 rounded bg-violet-900/50 text-violet-400 uppercase">Kalshi</span>
  )
  return (
    <span className="text-[8px] font-medium px-1 py-0.5 rounded bg-blue-900/50 text-blue-400 uppercase">Polymarket</span>
  )
}

function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}
