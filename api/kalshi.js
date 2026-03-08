export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/kalshi/, '')
  const target = `https://api.elections.kalshi.com${path}`

  try {
    const response = await fetch(target, {
      headers: { 'Accept': 'application/json' },
    })
    const data = await response.text()

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.setHeader('Content-Type', 'application/json')
    res.status(response.status).send(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
