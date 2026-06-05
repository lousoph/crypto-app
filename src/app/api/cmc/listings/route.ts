import { NextRequest, NextResponse } from "next/server"

const CMC_API_KEY = "f851e5ed95a54b32a097c6e47ed3d5f1"

// In-memory cache for listings
let listingsCache: any = null
let listingsCacheTime = 0
const LISTINGS_CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

// GET /api/cmc/listings — Top 500 cryptocurrencies with market data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 500)
    const start = Math.max(parseInt(searchParams.get("start") || "1"), 1)
    const sort = searchParams.get("sort") || "market_cap"
    const sortDir = searchParams.get("sort_dir") || "desc"
    const convert = searchParams.get("convert") || "USD"
    const force = searchParams.get("force") === "true"

    const now = Date.now()
    if (!force && listingsCache && (now - listingsCacheTime) < LISTINGS_CACHE_DURATION) {
      // Return from cache but apply pagination/filtering
      const filtered = listingsCache.data.slice(start - 1, start - 1 + limit)
      return NextResponse.json({
        data: filtered,
        status: listingsCache.status,
        total: listingsCache.data.length,
      })
    }

    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${limit}&start=${start}&sort=${sort}&sort_dir=${sortDir}&convert=${convert}&aux=cmc_rank,date_added,tags,platform,max_supply,circulating_supply,total_supply`

    const response = await fetch(url, {
      headers: {
        "X-CMC_PRO_API_KEY": CMC_API_KEY,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("CMC Listings API error:", response.status, errorText)
      // Return cached data if available
      if (listingsCache) {
        const filtered = listingsCache.data.slice(start - 1, start - 1 + limit)
        return NextResponse.json({
          data: filtered,
          status: { ...listingsCache.status, cached: true },
          total: listingsCache.data.length,
        })
      }
      return NextResponse.json(
        { error: "CoinMarketCap API error", status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Cache the full result
    listingsCache = data
    listingsCacheTime = now

    return NextResponse.json({
      data: data.data,
      status: data.status,
      total: data.data?.length || 0,
    })
  } catch (error: any) {
    console.error("CMC Listings error:", error)
    // Return cached data on error
    if (listingsCache) {
      return NextResponse.json({
        data: listingsCache.data,
        status: { ...listingsCache.status, cached: true },
        total: listingsCache.data.length,
      })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
