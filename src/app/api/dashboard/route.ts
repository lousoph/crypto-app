import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/dashboard - Get dashboard data with KPIs
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get all user transactions
    const transactions = await db.transaction.findMany({
      where: { userId },
      include: { token: true, exchange: true },
    })

    if (transactions.length === 0) {
      return NextResponse.json({
        investissementTotal: 0,
        valeurActuelle: 0,
        pl: 0,
        roi: 0,
        tokens: [],
      })
    }

    // Aggregate by token
    const tokenMap = new Map<string, {
      ticker: string
      name: string
      montantInvesti: number
      quantite: number
      currentPrice: number
      coingeckoId: string | null
    }>()

    for (const tx of transactions) {
      const existing = tokenMap.get(tx.tokenTicker)
      const prixActuel = tx.token.currentPrice || 0

      if (existing) {
        existing.montantInvesti += tx.montantInvesti
        existing.quantite += tx.quantite
        existing.currentPrice = prixActuel
      } else {
        tokenMap.set(tx.tokenTicker, {
          ticker: tx.tokenTicker,
          name: tx.token.name,
          montantInvesti: tx.montantInvesti,
          quantite: tx.quantite,
          currentPrice: prixActuel,
          coingeckoId: tx.token.coingeckoId,
        })
      }
    }

    // Calculate per-token metrics
    const tokenDetails = Array.from(tokenMap.values()).map((t) => {
      const pru = t.montantInvesti / t.quantite
      const valeurActuelle = t.quantite * t.currentPrice
      const pl = valeurActuelle - t.montantInvesti
      const rentabilite = t.montantInvesti > 0 ? (t.currentPrice - pru) / pru : 0

      return {
        ...t,
        pru,
        valeurActuelle,
        pl,
        rentabilite,
      }
    })

    // Global KPIs
    const investissementTotal = tokenDetails.reduce((sum, t) => sum + t.montantInvesti, 0)
    const valeurActuelle = tokenDetails.reduce((sum, t) => sum + t.valeurActuelle, 0)
    const pl = valeurActuelle - investissementTotal
    const roi = investissementTotal > 0 ? pl / investissementTotal : 0

    return NextResponse.json({
      investissementTotal,
      valeurActuelle,
      pl,
      roi,
      tokens: tokenDetails,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
