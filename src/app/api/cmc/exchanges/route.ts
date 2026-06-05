import { NextRequest, NextResponse } from "next/server"

const CMC_API_KEY = "f851e5ed95a54b32a097c6e47ed3d5f1"

// In-memory cache for exchanges
let exchangesCache: any = null
let exchangesCacheTime = 0
const EXCHANGES_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// GET /api/cmc/exchanges — Exchange listings with market data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 100)
    const start = Math.max(parseInt(searchParams.get("start") || "1"), 1)
    const sort = searchParams.get("sort") || "volume_24h"
    const sortDir = searchParams.get("sort_dir") || "desc"
    const force = searchParams.get("force") === "true"

    const now = Date.now()
    if (!force && exchangesCache && (now - exchangesCacheTime) < EXCHANGES_CACHE_DURATION) {
      const filtered = exchangesCache.data.slice(start - 1, start - 1 + limit)
      return NextResponse.json({
        data: filtered,
        status: exchangesCache.status,
        total: exchangesCache.data.length,
      })
    }

    const url = `https://pro-api.coinmarketcap.com/v1/exchange/listings/latest?limit=${limit}&start=${start}&sort=${sort}&sort_dir=${sortDir}&aux=urls,logo,description,date_launched,notice,is_hidden`

    const response = await fetch(url, {
      headers: {
        "X-CMC_PRO_API_KEY": CMC_API_KEY,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("CMC Exchanges API error:", response.status, errorText)
      if (exchangesCache) {
        const filtered = exchangesCache.data.slice(start - 1, start - 1 + limit)
        return NextResponse.json({
          data: filtered,
          status: { ...exchangesCache.status, cached: true },
          total: exchangesCache.data.length,
        })
      }
      return NextResponse.json(
        { error: "CoinMarketCap Exchange API error", status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    exchangesCache = data
    exchangesCacheTime = now

    return NextResponse.json({
      data: data.data,
      status: data.status,
      total: data.data?.length || 0,
    })
  } catch (error: any) {
    console.error("CMC Exchanges error:", error)
    if (exchangesCache) {
      return NextResponse.json({
        data: exchangesCache.data,
        status: { ...exchangesCache.status, cached: true },
        total: exchangesCache.data.length,
      })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
