import { NextResponse } from "next/server"

// GET /api/fear-greed — Fetch Crypto Fear & Greed Index from alternative.me
export async function GET() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=30&format=json", {
      next: { revalidate: 900 }, // Cache for 15 minutes
    })

    if (!res.ok) {
      throw new Error(`Fear & Greed API returned ${res.status}`)
    }

    const data = await res.json()

    if (!data?.data?.length) {
      throw new Error("No data from Fear & Greed API")
    }

    const current = data.data[0]
    const history = data.data.slice(0, 30).map((item: any) => ({
      value: parseInt(item.value),
      classification: item.value_classification,
      date: new Date(parseInt(item.timestamp) * 1000).toISOString().split("T")[0],
    }))

    return NextResponse.json({
      value: parseInt(current.value),
      classification: current.value_classification,
      timestamp: current.timestamp,
      timeUntilUpdate: current.time_until_update,
      history,
    })
  } catch (error: any) {
    console.error("Fear & Greed API error:", error)
    return NextResponse.json(
      { error: "Impossible de récupérer l'indice de peur et cupidité" },
      { status: 500 }
    )
  }
}
