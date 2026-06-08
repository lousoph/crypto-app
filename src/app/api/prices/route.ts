import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

// CryptoCompare API key
const CRYPTO_COMPARE_API_KEY = "4f527d4ae4beccf0fb013fc8a7c41fc19595a113d88edb97f83e12fae3ab8e76"

// Price cache - shared across requests
let priceCache: Record<string, { USD: number; CHANGEPCT24HOUR: number; HIGH24HOUR: number; LOW24HOUR: number }> = {}
let lastFetchTime = 0
const CACHE_DURATION = 60 * 1000 // 1 minute en ms

// GET /api/prices - Get current prices for all tokens with 24h change
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get("force") === "true"

    const now = Date.now()
    const needsRefresh = force || (now - lastFetchTime) > CACHE_DURATION

    if (needsRefresh) {
      const tokens = await db.token.findMany({
        where: { active: true },
      })

      const tickerSet = new Set(tokens.map((t) => t.cryptoCompareId || t.ticker).filter(Boolean))
      const tickers = [...tickerSet].join(",")

      try {
        // Use pricemultifull to get prices + 24h change + highs/lows
        const url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${tickers}&tsyms=USD&api_key=${CRYPTO_COMPARE_API_KEY}`
        const response = await fetch(url, {
          signal: AbortSignal.timeout(8000),
          cache: "no-store",
        })

        if (response.ok) {
          const data = await response.json()

          const updatePromises = []
          for (const token of tokens) {
            const key = token.cryptoCompareId || token.ticker
            const raw = data.RAW?.[key]?.USD
            if (raw) {
              priceCache[token.ticker] = {
                USD: raw.PRICE,
                CHANGEPCT24HOUR: raw.CHANGEPCT24HOUR || 0,
                HIGH24HOUR: raw.HIGH24HOUR || 0,
                LOW24HOUR: raw.LOW24HOUR || 0,
              }

              updatePromises.push(
                db.token.update({
                  where: { id: token.id },
                  data: {
                    currentPrice: raw.PRICE,
                    priceUpdatedAt: new Date(),
                  },
                })
              )
            }
          }

          await Promise.all(updatePromises)
          lastFetchTime = now
        }
      } catch (fetchError) {
        console.error("Price fetch error:", fetchError)
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
