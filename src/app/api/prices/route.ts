import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// CryptoCompare API key
const CRYPTO_COMPARE_API_KEY = "4f527d4ae4beccf0fb013fc8a7c41fc19595a113d88edb97f83e12fae3ab8e76"

// Price cache - shared across requests
let priceCache: Record<string, number> = {}
let lastFetchTime = 0
const CACHE_DURATION = 60 * 1000 // 1 minute en ms

// GET /api/prices - Get current prices for all tokens
// Auto-refreshes every 1 minute using CryptoCompare API
export async function GET() {
  try {
    const now = Date.now()
    const needsRefresh = (now - lastFetchTime) > CACHE_DURATION

    if (needsRefresh) {
      const tokens = await db.token.findMany({
        where: { active: true },
      })

      // Build ticker list for CryptoCompare API
      const tickers = tokens
        .map((t) => t.cryptoCompareId || t.ticker)
        .filter(Boolean)
        .join(",")

      try {
        const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${tickers}&tsyms=USD&api_key=${CRYPTO_COMPARE_API_KEY}`
        const response = await fetch(url, {
          next: { revalidate: 60 },
        })

        if (response.ok) {
          const data = await response.json()

          // Update prices in database and cache
          for (const token of tokens) {
            const key = token.cryptoCompareId || token.ticker
            const priceData = data[key]
            if (priceData && priceData.USD !== undefined) {
              priceCache[token.ticker] = priceData.USD

              await db.token.update({
                where: { id: token.id },
                data: {
                  currentPrice: priceData.USD,
                  priceUpdatedAt: new Date(),
                },
              })
            }
          }

          lastFetchTime = now
        }
      } catch (fetchError) {
        console.error("Price fetch error:", fetchError)
        // Continue with cached prices
      }
    }

    // If cache is empty, fetch from DB
    if (Object.keys(priceCache).length === 0) {
      const tokens = await db.token.findMany({
        where: { active: true, currentPrice: { not: null } },
      })
      for (const token of tokens) {
        if (token.currentPrice) {
          priceCache[token.ticker] = token.currentPrice
        }
      }
    }

    return NextResponse.json(priceCache)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
