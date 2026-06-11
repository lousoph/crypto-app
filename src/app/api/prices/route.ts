import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

// Price cache - shared across requests
let priceCache: Record<string, { USD: number; CHANGEPCT24HOUR: number; HIGH24HOUR: number; LOW24HOUR: number }> = {}
let lastFetchTime = 0
const CACHE_DURATION = 60 * 1000 // 60 seconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get("force") === "true"

    const now = Date.now()
    const needsRefresh = force || (now - lastFetchTime) > CACHE_DURATION

    if (needsRefresh) {
      const tokens = await db.token.findMany({ where: { active: true } })

      // Build CoinGecko IDs list
      const idMap = new Map<string, string>() // coingeckoId -> ticker
      for (const t of tokens) {
        if (t.coingeckoId) idMap.set(t.coingeckoId, t.ticker)
      }
      const ids = [...idMap.keys()].join(",")

      if (ids.length > 0) {
        try {
          // CoinGecko: free, no API key needed, returns live prices
          const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_high_24hr=true&include_low_24hr=true`
          const response = await fetch(url, {
            signal: AbortSignal.timeout(10000),
            cache: "no-store",
          })

          if (response.ok) {
            const data = await response.json()

            const updatePromises = []
            for (const [coingeckoId, values] of Object.entries(data)) {
              const ticker = idMap.get(coingeckoId)
              if (!ticker) continue

              const v = values as any
              priceCache[ticker] = {
                USD: v.usd || 0,
                CHANGEPCT24HOUR: v.usd_24h_change || 0,
                HIGH24HOUR: v.usd_24h_high || 0,
                LOW24HOUR: v.usd_24h_low || 0,
              }

              // Update DB
              const token = tokens.find(t => t.ticker === ticker)
              if (token && v.usd) {
                updatePromises.push(
                  db.token.update({
                    where: { id: token.id },
                    data: {
                      currentPrice: v.usd,
                      priceUpdatedAt: new Date(),
                    },
                  })
                )
              }
            }

            if (updatePromises.length > 0) {
              await Promise.all(updatePromises)
            }
            lastFetchTime = now
          }
        } catch (fetchError) {
          console.error("Price fetch error:", fetchError)
        }
      }
    }

    // Fallback to DB if cache empty
    if (Object.keys(priceCache).length === 0) {
      const tokens = await db.token.findMany({
        where: { active: true, currentPrice: { not: null } },
      })
      for (const token of tokens) {
        if (token.currentPrice) {
          priceCache[token.ticker] = {
            USD: token.currentPrice,
            CHANGEPCT24HOUR: 0,
            HIGH24HOUR: 0,
            LOW24HOUR: 0,
          }
        }
      }
    }

    return NextResponse.json({ prices: priceCache })
  } catch (error: any) {
    return NextResponse.json({ prices: priceCache })
  }
}