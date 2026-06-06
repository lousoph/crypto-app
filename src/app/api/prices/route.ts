import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

// CryptoCompare API key
const CRYPTO_COMPARE_API_KEY = "4f527d4ae4beccf0fb013fc8a7c41fc19595a113d88edb97f83e12fae3ab8e76"

// All supported CryptoCompare symbols
const ALL_SYMBOLS = "BTC,ETH,SOL,BNB,ZEC,XRP,DOGE,ZEN,SUI,TAO,ADA,LINK,AVAX,XPL,VIRTUAL,PUMP,ENA,WLD,NEAR,AAVE,ARB,PENGU,WLFI,ONDO,ATOM,AR,TIA,INJ,FET,RENDER,NMR,PYTH,W,GRT,QNT,AXL,ILV,QTUM,LTC,PEPE,ANKR,RSR"

// Price cache - shared across requests
let priceCache: Record<string, number> = {}
let lastFetchTime = 0
const CACHE_DURATION = 60 * 1000 // 1 minute en ms

// GET /api/prices - Get current prices for all tokens
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
        const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${tickers}&tsyms=USD&api_key=${CRYPTO_COMPARE_API_KEY}`
        const response = await fetch(url, {
          signal: AbortSignal.timeout(8000),
          cache: "no-store",
        })

        if (response.ok) {
          const data = await response.json()

          const updatePromises = []
          for (const token of tokens) {
            const key = token.cryptoCompareId || token.ticker
            const priceData = data[key]
            if (priceData && priceData.USD !== undefined) {
              priceCache[token.ticker] = priceData.USD

              updatePromises.push(
                db.token.update({
                  where: { id: token.id },
                  data: {
                    currentPrice: priceData.USD,
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
    return NextResponse.json({ prices: priceCache })
  }
}
