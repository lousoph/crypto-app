import { NextResponse } from "next/server"

// GET /api/fear-greed — Fetch Crypto Fear & Greed Index from alternative.me
export async function GET() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=30&format=json", {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ value: 50, classification: "Neutral", fallback: true })
    }

    const data = await res.json()

    if (!data?.data?.length) {
      return NextResponse.json({ value: 50, classification: "Neutral", fallback: true })
    }

    const current = data.data[0]

    return NextResponse.json({
      value: parseInt(current.value),
      classification: current.value_classification,
      timestamp: current.timestamp,
      timeUntilUpdate: current.time_until_update,
    })
  } catch (error: any) {
    return NextResponse.json({ value: 50, classification: "Neutral", fallback: true })
  }
}
