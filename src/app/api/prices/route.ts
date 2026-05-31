import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/prices - Get current prices for all tokens
// Also triggers price update if stale (>5 min)
export async function GET() {
  try {
    const tokens = await db.token.findMany({
      where: { active: true },
    })

    // Check if prices need refresh (>5 minutes old or never updated)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const needsRefresh = tokens.some(
      (t) => !t.priceUpdatedAt || t.priceUpdatedAt < fiveMinutesAgo
    )

    if (needsRefresh) {
      // Use CryptoCompare API (free, no key needed for basic)
      const tickers = tokens.map((t) => t.cryptoCompareId || t.ticker).join(",")
      try {
        const response = await fetch(
          `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${tickers}&tsyms=USD`,
          { next: { revalidate: 300 } }
        )

        if (response.ok) {
          const data = await response.json()

          // Update prices in database
          for (const token of tokens) {
            const key = token.cryptoCompareId || token.ticker
            const priceData = data[key]
            if (priceData && priceData.USD !== undefined) {
              await db.token.update({
                where: { id: token.id },
                data: {
                  currentPrice: priceData.USD,
                  priceUpdatedAt: new Date(),
                },
              })
            }
          }
        }
      } catch (fetchError) {
        console.error("Price fetch error:", fetchError)
        // Continue with stale prices
      }
    }

    // Return fresh data
    const updatedTokens = await db.token.findMany({
      where: { active: true },
    })

    const priceMap: Record<string, number> = {}
    for (const token of updatedTokens) {
      priceMap[token.ticker] = token.currentPrice || 0
    }

    return NextResponse.json(priceMap)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
