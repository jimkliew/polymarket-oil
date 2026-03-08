import { useState } from 'react'

export default function SettingsDrawer({ settings, onSave, onClose }) {
  const [form, setForm] = useState(settings)

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-petroleum-900 w-full rounded-t-2xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-600 rounded mx-auto mb-6" />
        <h2 className="text-white font-bold text-lg mb-4">Settings</h2>

        <label className="block text-gray-400 text-xs mb-1 uppercase tracking-wider">EIA API Key</label>
        <input
          className="w-full bg-petroleum-800 text-white rounded-lg px-3 py-2 mb-4 text-sm border border-petroleum-600 focus:outline-none focus:border-blue-500"
          placeholder="Get free key at eia.gov"
          value={form.eiaKey || ''}
          onChange={e => setForm({ ...form, eiaKey: e.target.value })}
        />

        <label className="block text-gray-400 text-xs mb-1 uppercase tracking-wider">Alpha Vantage Key (fallback)</label>
        <input
          className="w-full bg-petroleum-800 text-white rounded-lg px-3 py-2 mb-4 text-sm border border-petroleum-600 focus:outline-none focus:border-blue-500"
          placeholder="Get free key at alphavantage.co"
          value={form.avKey || ''}
          onChange={e => setForm({ ...form, avKey: e.target.value })}
        />

        <label className="block text-gray-400 text-xs mb-1 uppercase tracking-wider">Price Source</label>
        <select
          className="w-full bg-petroleum-800 text-white rounded-lg px-3 py-2 mb-4 text-sm border border-petroleum-600"
          value={form.priceSource || 'eia'}
          onChange={e => setForm({ ...form, priceSource: e.target.value })}
        >
          <option value="eia">EIA (recommended)</option>
          <option value="av">Alpha Vantage</option>
        </select>

        <label className="block text-gray-400 text-xs mb-1 uppercase tracking-wider">Refresh Interval</label>
        <select
          className="w-full bg-petroleum-800 text-white rounded-lg px-3 py-2 mb-6 text-sm border border-petroleum-600"
          value={form.refreshInterval || 60000}
          onChange={e => setForm({ ...form, refreshInterval: parseInt(e.target.value) })}
        >
          <option value={30000}>30 seconds</option>
          <option value={60000}>1 minute</option>
          <option value={300000}>5 minutes</option>
        </select>

        <button
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl"
          onClick={() => { onSave(form); onClose() }}
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}
