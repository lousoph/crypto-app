import { NextResponse } from "next/server"

const COINGLASS_API_KEY = process.env.COINGLASS_API_KEY || "f851e5ed95a54b32a097c6e47ed3d5f1"
const COINGLASS_BASE = "https://open-api-v4.coinglass.com"

// In-memory cache
let cachedCurrent: { value: number; classification: string; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getClassification(value: number): string {
  if (value <= 25) return "Extreme Fear"
  if (value <= 50) return "Fear"
  if (value <= 75) return "Neutral"
  return "Extreme Greed"
}

// GET /api/fear-greed — Current value with Coinglass priority, fallback to alternative.me
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

  // 1) Try Coinglass API
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(`${COINGLASS_BASE}/api/index/fear-greed-history`, {
      headers: { "CG-API-KEY": COINGLASS_API_KEY },
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()

      if (data.code === "0" && data.data?.length > 0) {
        const item = data.data[0]
        const data_list = item.data_list || []
        const time_list = item.time_list || []

        if (data_list.length > 0) {
          // Coinglass returns values multiplied by 100000
          const rawValue = data_list[data_list.length - 1]
          const value = Math.round(rawValue / 100000)
          const clamped = Math.max(0, Math.min(100, value))
          const classification = getClassification(clamped)

          cachedCurrent = {
            value: clamped,
            classification,
            timestamp: now,
          }

          return NextResponse.json({
            value: clamped,
            classification,
            source: "coinglass",
            updateTime: time_list[time_list.length - 1] ? new Date(time_list[time_list.length - 1] * 1000).toISOString() : null,
          })
        }
      }
    }
  } catch {
    // Fall through to alternative.me
  }

  // 2) Fallback: alternative.me
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
    // Return fallback
  }

  return NextResponse.json({ value: 50, classification: "Neutral", fallback: true, source: "fallback" })
}