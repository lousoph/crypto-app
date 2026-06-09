import { NextResponse } from "next/server"

// In-memory cache
let cachedCurrent: { value: number; classification: string; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// GET /api/fear-greed — Current value from alternative.me
export async function GET() {
  const now = Date.now()

  // Return cached if fresh
  if (cachedCurrent && now - cachedCurrent.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      value: cachedCurrent.value,
      classification: cachedCurrent.classification,
      source: "cached",
    })
  }

  // Fetch from alternative.me
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1&format=json", {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    })

    if (res.ok) {
      const data = await res.json()
      if (data?.data?.length) {
        const current = data.data[0]
        const value = parseInt(current.value)
        cachedCurrent = {
          value,
          classification: current.value_classification,
          timestamp: now,
        }

        return NextResponse.json({
          value,
          classification: current.value_classification,
          timestamp: current.timestamp,
          timeUntilUpdate: current.time_until_update,
          source: "alternative_me",
        })
      }
    }
  } catch {
    // Return cached or fallback
  }

  // Return stale cache if available
  if (cachedCurrent) {
    return NextResponse.json({
      value: cachedCurrent.value,
      classification: cachedCurrent.classification,
      stale: true,
      source: "stale_cache",
    })
  }

  return NextResponse.json({ value: 50, classification: "Neutral", fallback: true, source: "fallback" })
}