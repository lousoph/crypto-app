import { NextResponse } from "next/server"

const CMC_API_KEY = "f851e5ed95a54b32a097c6e47ed3d5f1"

// In-memory cache for global metrics
let globalCache: any = null
let globalCacheTime = 0
const GLOBAL_CACHE_DURATION = 60 * 1000 // 1 minute for real-time feel

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
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          globalCache = data.data
          globalCacheTime = now
          // Always wrap in { data: ... } for consistent frontend access
          return NextResponse.json({ data: data.data, cached: false })
        }
      }
    } catch (err) {
      console.error("CMC fetch error:", err)
    }

    // Fallback: return cached data or sensible defaults
    return NextResponse.json({
      data: globalCache || {
        quote: {
          USD: {
            total_market_cap: 3200000000000,
            total_volume_24h: 120000000000,
          },
        },
        btc_dominance: 55,
        eth_dominance: 18,
        active_cryptocurrencies: 15000,
      },
      cached: true,
    })
  } catch (error: any) {
    return NextResponse.json({
      data: {
        quote: {
          USD: {
            total_market_cap: 3200000000000,
            total_volume_24h: 120000000000,
          },
        },
        btc_dominance: 55,
        eth_dominance: 18,
        active_cryptocurrencies: 15000,
      },
    })
  }
}
