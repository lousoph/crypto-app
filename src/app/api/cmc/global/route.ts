import { NextResponse } from "next/server"

const CMC_API_KEY = "f851e5ed95a54b32a097c6e47ed3d5f1"

// In-memory cache for global metrics
let globalCache: any = null
let globalCacheTime = 0
const GLOBAL_CACHE_DURATION = 3 * 60 * 1000 // 3 minutes

// GET /api/cmc/global — Global cryptocurrency market metrics
export async function GET() {
  try {
    const now = Date.now()
    if (globalCache && (now - globalCacheTime) < GLOBAL_CACHE_DURATION) {
      return NextResponse.json({ data: globalCache, cached: true })
    }

    try {
      const url = "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest"
      const response = await fetch(url, {
        headers: {
          "X-CMC_PRO_API_KEY": CMC_API_KEY,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          globalCache = data.data
          globalCacheTime = now
          return NextResponse.json(data.data)
        }
      }
    } catch {}

    // Fallback data if API fails
    return NextResponse.json({
      data: globalCache || {
        active_cryptocurrencies: 15000,
        total_market_cap: { usd: 3200000000000 },
        total_volume: { usd: 120000000000 },
        market_cap_percentage: { btc: 55, eth: 18 },
      },
      cached: true,
    })
  } catch (error: any) {
    return NextResponse.json({
      data: {
        active_cryptocurrencies: 15000,
        total_market_cap: { usd: 3200000000000 },
        total_volume: { usd: 120000000000 },
        market_cap_percentage: { btc: 55, eth: 18 },
      },
    })
  }
}
