import { useState } from 'react'
import SpotPricePanel from './components/SpotPricePanel'
import DistributionChart from './components/DistributionChart'
import MarketSummary from './components/MarketList'
import SettingsDrawer from './components/SettingsDrawer'
import { usePolymarkets } from './hooks/usePolymarkets'
import { useWTIPrice } from './hooks/useWTIPrice'

const DEFAULT_SETTINGS = {
  eiaKey: import.meta.env.VITE_EIA_API_KEY || '',
  avKey: '',
  priceSource: 'eia',
  refreshInterval: 60000
}

export default function App() {
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('oilmkts_settings')) || DEFAULT_SETTINGS }
    catch { return DEFAULT_SETTINGS }
  })
  const [showSettings, setShowSettings] = useState(false)

  const { data: pmData, loading: pmLoading, error: pmError, lastUpdated, refresh } = usePolymarkets(settings.refreshInterval)
  const { price, history, loading: pLoading, error: pError } = useWTIPrice(settings.eiaKey, settings.avKey, settings.priceSource)

  const saveSettings = (s) => {
    setSettings(s)
    localStorage.setItem('oilmkts_settings', JSON.stringify(s))
  }

  return (
    <div className="min-h-screen bg-petroleum-950 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-petroleum-950/95 backdrop-blur-sm border-b border-petroleum-800/50 z-40">
        <div className="flex items-center justify-between px-4 py-2.5 max-w-lg mx-auto">
          <div>
            <h1 className="text-white font-bold text-base leading-none">Oil Markets</h1>
            <p className="text-gray-600 text-[10px] mt-0.5">
              Polymarket + Kalshi {lastUpdated ? `· ${lastUpdated.toLocaleTimeString()}` : ''}
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={refresh}
              className="text-gray-500 text-[10px] bg-petroleum-800/80 px-2 py-1 rounded-md hover:text-gray-300 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="text-gray-500 text-[10px] bg-petroleum-800/80 px-2 py-1 rounded-md hover:text-gray-300 transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 pt-3 pb-24 max-w-lg mx-auto">
        {/* Chart 1: WTI Spot + Implied Reference Lines */}
        <SpotPricePanel
          price={price}
          history={history}
          loading={pLoading}
          error={pError}
          impliedMean={pmData?.impliedMean}
          kalshiImplied={pmData?.kalshiImplied}
        />

        {/* Chart 2: Settlement Distribution */}
        <DistributionChart
          distribution={pmData?.distribution}
          loading={pmLoading}
          error={pmError}
          currentSpot={price?.value}
          title={pmData?.settlementTitle}
        />

        {/* Key Markets + Forecast */}
        <MarketSummary
          data={pmData}
          loading={pmLoading}
          error={pmError}
        />
      </div>

      {showSettings && (
        <SettingsDrawer
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
