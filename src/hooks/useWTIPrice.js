import { useState, useEffect } from 'react'
import { fetchWTIPrice, fetchWTIAlphaVantage } from '../utils/api'

export function useWTIPrice(eiaKey, avKey, source = 'eia') {
  const [price, setPrice] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        if (source === 'eia' && eiaKey) {
          const rows = await fetchWTIPrice(eiaKey)
          if (rows.length > 0) {
            setPrice({ value: parseFloat(rows[0].value), period: rows[0].period })
            const hist = rows.slice(0, 14).reverse().map(r => ({
              date: formatDate(r.period),
              rawDate: r.period,
              price: parseFloat(r.value),
            }))
            setHistory(hist)
          }
        } else if (source === 'av' && avKey) {
          const data = await fetchWTIAlphaVantage(avKey)
          const entries = Object.entries(data?.data || {}).slice(0, 14).reverse()
          setHistory(entries.map(([date, val]) => ({
            date: formatDate(date),
            rawDate: date,
            price: parseFloat(val),
          })))
          const latest = entries[entries.length - 1]
          if (latest) setPrice({ value: parseFloat(latest[1]), period: latest[0] })
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [eiaKey, avKey, source])

  return { price, history, loading, error }
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
