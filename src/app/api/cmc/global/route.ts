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
      return NextResponse.json({ ...globalCache, cached: true })
    }

    const url = "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest"

    const response = await fetch(url, {
      headers: {
        "X-CMC_PRO_API_KEY": CMC_API_KEY,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("CMC Global API error:", response.status, errorText)
      if (globalCache) {
        return NextResponse.json({ ...globalCache, cached: true })
      }
      return NextResponse.json(
        { error: "CoinMarketCap Global API error", status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    globalCache = data.data
    globalCacheTime = now

    return NextResponse.json(data.data)
  } catch (error: any) {
    console.error("CMC Global error:", error)
    if (globalCache) {
      return NextResponse.json({ ...globalCache, cached: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
