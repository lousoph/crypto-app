import { NextRequest, NextResponse } from "next/server"

interface CryptoPriceData {
  currentPrice: number
  priceChangePct24h: number
  high24h: number
  low24h: number
  volume24h: number
  marketCap: number | null
  hourlyPrices: { time: string; price: number; open: number; high: number; low: number; volume: number }[]
}

interface FearGreedData {
  value: number
  classification: string
}

interface NewsItem {
  title: string
  snippet: string
  source: string
  date: string
}

// Get CoinGecko ID from DB token
async function getCoingeckoId(ticker: string): Promise<string | null> {
  try {
    const { db } = await import("@/lib/db")
    const token = await db.token.findUnique({ where: { ticker: ticker.toUpperCase() } })
    return token?.coingeckoId || null
  } catch { return null }
}

async function fetchCryptoData(ticker: string): Promise<CryptoPriceData | null> {
  try {
    const cgId = await getCoingeckoId(ticker)
    if (!cgId) return null

    // Fetch current price + 24h stats from CoinGecko
    const statsUrl = `https://api.coingecko.com/api/v3/coins/${cgId}?localization=false&tickers=false&community_data=false&developer_data=false`
    const statsRes = await fetch(statsUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })

    if (!statsRes.ok) return null
    const statsData = await statsRes.json()
    const md = statsData.market_data
    if (!md) return null

    // Fetch hourly prices (CoinGecko free: max 24h with 2h interval for free, or use 1d with 1h for some coins)
    let hourlyPrices: { time: string; price: number; open: number; high: number; low: number; volume: number }[] = []
    try {
      const histUrl = `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=1`
      const histRes = await fetch(histUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      })
      if (histRes.ok) {
        const histData = await histRes.json()
        if (histData?.prices) {
          // Group hourly
          const hourly: Map<string, { prices: number[]; highs: number[]; lows: number[]; volumes: number[] }> = new Map()
          for (let i = 0; i < histData.prices.length; i++) {
            const date = new Date(histData.prices[i][0])
            const hourKey = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:00`
            if (!hourly.has(hourKey)) hourly.set(hourKey, { prices: [], highs: [], lows: [], volumes: [] })
            const entry = hourly.get(hourKey)!
            entry.prices.push(histData.prices[i][1])
          }
          if (histData.total_volumes) {
            const volEntries = histData.total_volumes
            const priceEntries = histData.prices
            let volIdx = 0
            for (const [key, entry] of hourly) {
              const matchVol = volEntries.find((v: number[]) => {
                const d = new Date(v[0])
                const hk = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:00`
                return hk === key
              })
              if (matchVol) entry.volumes.push(matchVol[1])
            }
          }

          for (const [time, entry] of hourly) {
            const price = entry.prices[entry.prices.length - 1] || 0
            const high = Math.max(...entry.prices)
            const low = Math.min(...entry.prices)
            hourlyPrices.push({
              time: new Date(time).toISOString(),
              price, open: entry.prices[0] || price, high, low,
              volume: entry.volumes[0] || 0,
            })
          }
        }
      }
    } catch {}

    return {
      currentPrice: md.current_price?.usd || 0,
      priceChangePct24h: md.price_change_percentage_24h || 0,
      high24h: md.high_24h?.usd || 0,
      low24h: md.low_24h?.usd || 0,
      volume24h: md.total_volume?.usd || 0,
      marketCap: md.market_cap?.usd || null,
      hourlyPrices,
    }
  } catch (error) {
    console.error("Error fetching crypto data:", error)
    return null
  }
}

async function fetchFearGreedIndex(): Promise<FearGreedData | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1&format=json", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.data?.length) return null
    return { value: parseInt(data.data[0].value), classification: data.data[0].value_classification }
  } catch { return null }
}

async function fetchMarketNews(ticker: string, name: string): Promise<NewsItem[]> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const searchResult: any[] = await zai.functions.invoke("web_search", {
      query: `${ticker} ${name || ''} crypto news today 2025`,
      num: 6,
    })
    if (!Array.isArray(searchResult)) return []
    return searchResult.slice(0, 5).map((item: any) => ({
      title: item.name || "Actualité",
      snippet: item.snippet || "",
      source: item.host_name || "",
      date: item.date || "",
    }))
  } catch {
    return [] // Graceful fallback when SDK is not available
  }
}

function approximateRSI(hourlyPrices: { price: number }[]): string {
  if (hourlyPrices.length < 14) return "Données insuffisantes"
  const recent = hourlyPrices.slice(-15)
  let gains = 0, losses = 0
  for (let i = 1; i < recent.length; i++) {
    const change = recent[i].price - recent[i - 1].price
    if (change > 0) gains += change
    else losses += Math.abs(change)
  }
  const avgGain = gains / 14, avgLoss = losses / 14
  if (avgLoss === 0) return "100 (Surcheté)"
  const rsi = 100 - 100 / (1 + avgGain / avgLoss)
  if (rsi >= 70) return `${rsi.toFixed(1)} (Surcheté)`
  if (rsi <= 30) return `${rsi.toFixed(1)} (Survendu)`
  return `${rsi.toFixed(1)} (Neutre)`
}

function determineTrend(hourlyPrices: { price: number }[]): string {
  if (hourlyPrices.length < 6) return "Indéterminé"
  const recent = hourlyPrices.slice(-6)
  const change = ((recent[recent.length - 1].price - recent[0].price) / recent[0].price) * 100
  if (change > 2) return "Haussière ↗"
  if (change > 0.5) return "Légèrement haussière ↗"
  if (change < -2) return "Baissière ↘"
  if (change < -0.5) return "Légèrement baissière ↘"
  return "Neutre →"
}

// POST /api/ai-analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticker, name } = body
    if (!ticker) return NextResponse.json({ error: "Le ticker est requis" }, { status: 400 })

    const [cryptoData, fearGreedData, newsItems] = await Promise.all([
      fetchCryptoData(ticker.toUpperCase()),
      fetchFearGreedIndex(),
      fetchMarketNews(ticker.toUpperCase(), name || ticker),
    ])

    if (!cryptoData) {
      return NextResponse.json({ error: `Impossible de récupérer les données pour ${ticker}` }, { status: 404 })
    }

    const rsiApprox = approximateRSI(cryptoData.hourlyPrices)
    const trend = determineTrend(cryptoData.hourlyPrices)
    const supportLevel = cryptoData.low24h ? `$${cryptoData.low24h.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"
    const resistanceLevel = cryptoData.high24h ? `$${cryptoData.high24h.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"
    const volumeStr = cryptoData.volume24h ? `$${(cryptoData.volume24h / 1_000_000).toFixed(2)}M` : "N/A"

    const newsContext = newsItems.length > 0
      ? `\n\nDERNIÈRES ACTUALITÉS :\n${newsItems.map((n, i) => `${i + 1}. ${n.title} — ${n.snippet}`).join("\n")}`
      : "\n\nACTUALITÉS : Aucune actualité récente trouvée."

    const marketContext = `
DONNÉES DE MARCHÉ POUR ${ticker.toUpperCase()} (${name || ticker}) :
- Prix actuel : $${cryptoData.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Variation 24h : ${cryptoData.priceChangePct24h >= 0 ? "+" : ""}${cryptoData.priceChangePct24h.toFixed(2)}%
- Plus haut 24h : $${cryptoData.high24h.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Plus bas 24h : $${cryptoData.low24h.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Volume 24h : ${volumeStr}
- Capitalisation : ${cryptoData.marketCap ? "$" + (cryptoData.marketCap / 1_000_000_000).toFixed(2) + "Md" : "N/A"}
- Tendance (6h) : ${trend}
- RSI approximatif (14h) : ${rsiApprox}
${fearGreedData ? `- Indice de Peur & Cupidité : ${fearGreedData.value} (${fearGreedData.classification})` : "- Indice de Peur & Cupidité : Non disponible"}

DERNIERS PRIX HORAIRE (24h) :
${cryptoData.hourlyPrices.slice(-12).map(h => `${new Date(h.time).getHours()}:00 → $${h.price.toFixed(2)}`).join("\n")}
${newsContext}`.trim()

    // Try AI analysis (optional - works only if z-ai-web-dev-sdk is available)
    let analysis: any = null
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const systemPrompt = `Tu es un analyste de marché crypto expert. Réponds UNIQUEMENT en JSON valide sans markdown. Structure:
{"signal":"ACHAT"|"VENTE"|"NEUTRE","confidence":0-100,"summary":"2-3 phrases en français","technicalAnalysis":{"trend":"...","supportLevel":"...","resistanceLevel":"...","rsiApprox":"...","volume24h":"..."},"sentiment":{"fearGreedIndex":0,"fearGreedLabel":"...","interpretation":"..."},"newsImpact":"2-3 phrases","keyFactors":["..."],"risks":["..."],"disclaimer":"⚠️ Analyse IA - NON un conseil financier."}`

      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyse le marché pour ce token:\n\n${marketContext}` },
        ],
        thinking: { type: "disabled" },
      })

      const aiContent = completion.choices?.[0]?.message?.content
      if (aiContent) {
        let jsonStr = aiContent.replace(/```(?:json)?\s*([\s\S]*?)```/, '$1').trim()
        const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
        if (objectMatch) analysis = JSON.parse(objectMatch[0])
      }
    } catch (e) {
      console.error("AI SDK not available, using technical analysis only:", e)
    }

    // Fallback: build analysis from technical indicators if AI failed
    const validSignals = ["ACHAT", "VENTE", "NEUTRE"]
    const signal = analysis && validSignals.includes(analysis.signal) ? analysis.signal
      : cryptoData.priceChangePct24h > 1 ? "ACHAT"
      : cryptoData.priceChangePct24h < -1 ? "VENTE" : "NEUTRE"

    const confidence = analysis?.confidence ?? 40

    const fgIndex = fearGreedData?.value ?? analysis?.sentiment?.fearGreedIndex ?? 50
    const fgLabel = (() => {
      if (fgIndex <= 20) return "Peur Extrême"
      if (fgIndex <= 40) return "Peur"
      if (fgIndex <= 60) return "Neutre"
      if (fgIndex <= 80) return "Cupidité"
      return "Cupidité Extrême"
    })()

    const chartData = cryptoData.hourlyPrices.map(h => ({
      time: new Date(h.time).getHours() + ":00",
      price: h.price, open: h.open, high: h.high, low: h.low, volume: h.volume,
    }))

    return NextResponse.json({
      signal, confidence,
      summary: analysis?.summary || `Analyse technique de ${ticker} : tendance ${trend.toLowerCase()}, RSI ${rsiApprox}. Pas d'analyse IA disponible sur ce serveur.`,
      technicalAnalysis: {
        trend: analysis?.technicalAnalysis?.trend || trend,
        supportLevel: analysis?.technicalAnalysis?.supportLevel || supportLevel,
        resistanceLevel: analysis?.technicalAnalysis?.resistanceLevel || resistanceLevel,
        rsiApprox: analysis?.technicalAnalysis?.rsiApprox || rsiApprox,
        volume24h: analysis?.technicalAnalysis?.volume24h || volumeStr,
      },
      sentiment: {
        fearGreedIndex: fgIndex,
        fearGreedLabel: analysis?.sentiment?.fearGreedLabel || fgLabel,
        interpretation: analysis?.sentiment?.interpretation || "Sentiment de marché neutre.",
      },
      newsImpact: analysis?.newsImpact || "Aucune actualité marquante à signaler.",
      newsItems,
      keyFactors: Array.isArray(analysis?.keyFactors) ? analysis.keyFactors.slice(0, 5) : [`Tendance ${trend.toLowerCase()}`, `RSI ${rsiApprox}`],
      risks: Array.isArray(analysis?.risks) ? analysis.risks.slice(0, 5) : ["Volatilité inhérente au marché crypto"],
      chartData,
      currentPrice: cryptoData.currentPrice,
      priceChangePct24h: cryptoData.priceChangePct24h,
      disclaimer: analysis?.disclaimer || "⚠️ Cette analyse est générée automatiquement et constitue une assistance à la décision, NON un conseil financier.",
    })
  } catch (error: any) {
    console.error("AI Analysis error:", error)
    return NextResponse.json({ error: error.message || "Erreur lors de l'analyse" }, { status: 500 })
  }
}