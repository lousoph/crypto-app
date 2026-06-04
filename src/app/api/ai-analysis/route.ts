import { NextRequest, NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"

// CryptoCompare API key
const CRYPTO_COMPARE_API_KEY = "4f527d4ae4beccf0fb013fc8a7c41fc19595a113d88edb97f83e12fae3ab8e76"

interface CryptoPriceData {
  currentPrice: number
  priceChange24h: number
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

async function fetchCryptoData(ticker: string): Promise<CryptoPriceData | null> {
  try {
    // Fetch current price + 24h stats
    const statsUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${ticker}&tsyms=USD&api_key=${CRYPTO_COMPARE_API_KEY}`
    const statsRes = await fetch(statsUrl, { cache: "no-store" })

    if (!statsRes.ok) return null

    const statsData = await statsRes.json()
    const rawData = statsData?.RAW?.[ticker]?.USD
    if (!rawData) return null

    // Fetch hourly prices for last 24 hours
    const histUrl = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${ticker}&tsym=USD&limit=24&api_key=${CRYPTO_COMPARE_API_KEY}`
    const histRes = await fetch(histUrl, { cache: "no-store" })

    let hourlyPrices: { time: string; price: number; open: number; high: number; low: number; volume: number }[] = []
    if (histRes.ok) {
      const histData = await histRes.json()
      if (histData?.Data?.Data) {
        hourlyPrices = histData.Data.Data.map((d: any) => ({
          time: new Date(d.time * 1000).toISOString(),
          price: d.close,
          open: d.open,
          high: d.high,
          low: d.low,
          volume: d.volumeto,
        }))
      }
    }

    return {
      currentPrice: rawData.PRICE,
      priceChange24h: rawData.CHANGE24HOUR,
      priceChangePct24h: rawData.CHANGEPCT24HOUR,
      high24h: rawData.HIGH24HOUR,
      low24h: rawData.LOW24HOUR,
      volume24h: rawData.VOLUME24HOUR,
      marketCap: rawData.MKTCAP || null,
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
    })

    if (!res.ok) return null

    const data = await res.json()
    if (!data?.data?.length) return null

    return {
      value: parseInt(data.data[0].value),
      classification: data.data[0].value_classification,
    }
  } catch (error) {
    console.error("Error fetching Fear & Greed Index:", error)
    return null
  }
}

async function fetchMarketNews(ticker: string, name: string): Promise<NewsItem[]> {
  try {
    const zai = await ZAI.create()
    const searchResult = await zai.functions.invoke("web_search", {
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
  } catch (error) {
    console.error("Error fetching market news:", error)
    return []
  }
}

function approximateRSI(hourlyPrices: { price: number }[]): string {
  if (hourlyPrices.length < 14) return "Données insuffisantes"

  const recent = hourlyPrices.slice(-15)
  let gains = 0
  let losses = 0

  for (let i = 1; i < recent.length; i++) {
    const change = recent[i].price - recent[i - 1].price
    if (change > 0) gains += change
    else losses += Math.abs(change)
  }

  const avgGain = gains / 14
  const avgLoss = losses / 14

  if (avgLoss === 0) return "100 (Surcheté)"
  const rs = avgGain / avgLoss
  const rsi = 100 - 100 / (1 + rs)

  if (rsi >= 70) return `${rsi.toFixed(1)} (Surcheté)`
  if (rsi <= 30) return `${rsi.toFixed(1)} (Survendu)`
  return `${rsi.toFixed(1)} (Neutre)`
}

function determineTrend(hourlyPrices: { price: number }[]): string {
  if (hourlyPrices.length < 6) return "Indéterminé"

  const recent = hourlyPrices.slice(-6)
  const firstPrice = recent[0].price
  const lastPrice = recent[recent.length - 1].price
  const change = ((lastPrice - firstPrice) / firstPrice) * 100

  if (change > 2) return "Haussière ↗"
  if (change > 0.5) return "Légèrement haussière ↗"
  if (change < -2) return "Baissière ↘"
  if (change < -0.5) return "Légèrement baissière ↘"
  return "Neutre →"
}

// POST /api/ai-analysis — AI-powered market analysis with news
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticker, name } = body

    if (!ticker) {
      return NextResponse.json({ error: "Le ticker est requis" }, { status: 400 })
    }

    // Fetch market data + news in parallel
    const [cryptoData, fearGreedData, newsItems] = await Promise.all([
      fetchCryptoData(ticker.toUpperCase()),
      fetchFearGreedIndex(),
      fetchMarketNews(ticker.toUpperCase(), name || ticker),
    ])

    if (!cryptoData) {
      return NextResponse.json(
        { error: `Impossible de récupérer les données pour ${ticker}` },
        { status: 404 }
      )
    }

    // Compute technical indicators
    const rsiApprox = approximateRSI(cryptoData.hourlyPrices)
    const trend = determineTrend(cryptoData.hourlyPrices)
    const supportLevel = cryptoData.low24h
      ? `$${cryptoData.low24h.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "N/A"
    const resistanceLevel = cryptoData.high24h
      ? `$${cryptoData.high24h.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "N/A"
    const volumeStr = cryptoData.volume24h
      ? `$${(cryptoData.volume24h / 1_000_000).toFixed(2)}M`
      : "N/A"

    // Build news context for AI
    const newsContext = newsItems.length > 0
      ? `\n\nDERNIÈRES ACTUALITÉS :\n${newsItems.map((n, i) => `${i + 1}. ${n.title} — ${n.snippet}`).join("\n")}`
      : "\n\nACTUALITÉS : Aucune actualité récente trouvée."

    // Build the context for AI
    const marketContext = `
DONNÉES DE MARCHÉ POUR ${ticker.toUpperCase()} (${name || ticker}) :
- Prix actuel : $${cryptoData.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Variation 24h : ${cryptoData.priceChangePct24h >= 0 ? "+" : ""}${cryptoData.priceChangePct24h.toFixed(2)}% (${cryptoData.priceChange24h >= 0 ? "+" : ""}$${cryptoData.priceChange24h.toFixed(2)})
- Plus haut 24h : $${cryptoData.high24h.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Plus bas 24h : $${cryptoData.low24h.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Volume 24h : ${volumeStr}
- Capitalisation : ${cryptoData.marketCap ? "$" + (cryptoData.marketCap / 1_000_000_000).toFixed(2) + "Md" : "N/A"}
- Tendance (6h) : ${trend}
- RSI approximatif (14h) : ${rsiApprox}
${fearGreedData ? `- Indice de Peur & Cupidité du marché crypto : ${fearGreedData.value} (${fearGreedData.classification})` : "- Indice de Peur & Cupidité : Non disponible"}

DERNIERS PRIX HORAIRE (24h) :
${cryptoData.hourlyPrices.map(h => `${new Date(h.time).getHours()}:00 → $${h.price.toFixed(2)}`).join("\n")}
${newsContext}`.trim()

    // Create the AI client and request analysis
    const zai = await ZAI.create()

    const systemPrompt = `Tu es un analyste de marché crypto expert. Tu analyses les données techniques, le sentiment du marché ET les dernières actualités pour fournir des recommandations claires et accessibles.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires, sans balises de code.
2. Le JSON doit suivre exactement cette structure :
{
  "signal": "ACHAT" | "VENTE" | "NEUTRE",
  "confidence": <nombre entre 0 et 100>,
  "summary": "<résumé de 2-3 phrases en français de ton analyse, en intégrant les actualités si pertinent>",
  "technicalAnalysis": {
    "trend": "<tendance identifiée en français>",
    "supportLevel": "<niveau de support avec prix>",
    "resistanceLevel": "<niveau de résistance avec prix>",
    "rsiApprox": "<valeur RSI et interprétation concrète>",
    "volume24h": "<volume avec interprétation>"
  },
  "sentiment": {
    "fearGreedIndex": <valeur numérique de l'indice>,
    "fearGreedLabel": "<label en français : Peur Extrême / Peur / Neutre / Cupidité / Cupidité Extrême>",
    "interpretation": "<interprétation du sentiment en 1 phrase>"
  },
  "newsImpact": "<analyse de l'impact des actualités récentes sur le prix du token en 2-3 phrases>",
  "keyFactors": ["<facteur 1>", "<facteur 2>", "<facteur 3>", "<facteur 4>"],
  "risks": ["<risque 1>", "<risque 2>", "<risque 3>"],
  "disclaimer": "⚠️ Cette analyse est générée par une IA et constitue une assistance à la décision, NON un conseil financier. Les performances passées ne garantissent pas les résultats futurs. Vous êtes seul responsable de vos décisions d'investissement. Consultez un conseiller financier professionnel avant toute décision d'investissement importante."
}

3. Le signal doit être :
   - ACHAT si les indicateurs techniques, le sentiment et les actualités sont positifs
   - VENTE si les indicateurs techniques, le sentiment et les actualités sont négatifs
   - NEUTRE si les signaux sont mitigés ou peu clairs

4. Le niveau de confiance doit refléter la cohérence des signaux (0-100%).

5. Tous les textes doivent être en FRANÇAIS.

6. Inclus TOUJOURS le disclaimer exact tel que spécifié ci-dessus.

7. Analyse les niveaux de support et résistance de manière intelligente, pas seulement les extrêmes 24h.

8. Pour le RSI, explique ce qu'il signifie concrètement pour le trader.

9. Les facteurs clés et risques doivent être spécifiques au token analysé, aux données techniques ET aux actualités fournies.

10. Le champ "newsImpact" doit résumer comment les actualités récentes pourraient affecter le prix à court terme.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyse le marché pour ce token en te basant sur les données techniques, le sentiment et les actualités suivantes :\n\n${marketContext}` },
      ],
      thinking: { type: "disabled" },
    })

    // Parse the AI response
    const aiContent = completion.choices?.[0]?.message?.content
    if (!aiContent) {
      return NextResponse.json(
        { error: "L'IA n'a pas pu générer d'analyse" },
        { status: 500 }
      )
    }

    // Try to extract JSON from the response (handle potential markdown wrapping)
    let jsonStr = aiContent
    const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    let analysis
    try {
      analysis = JSON.parse(jsonStr)
    } catch {
      const objectMatch = aiContent.match(/\{[\s\S]*\}/)
      if (objectMatch) {
        try {
          analysis = JSON.parse(objectMatch[0])
        } catch {
          return NextResponse.json(
            { error: "L'IA a retourné un format invalide" },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: "L'IA a retourné un format invalide" },
          { status: 500 }
        )
      }
    }

    // Validate and ensure all required fields exist
    const validSignals = ["ACHAT", "VENTE", "NEUTRE"]
    const signal = validSignals.includes(analysis.signal) ? analysis.signal : "NEUTRE"
    const confidence = typeof analysis.confidence === "number"
      ? Math.max(0, Math.min(100, Math.round(analysis.confidence)))
      : 50

    const fgIndex = fearGreedData?.value ?? (typeof analysis.sentiment?.fearGreedIndex === "number" ? analysis.sentiment.fearGreedIndex : 50)

    const fgLabel = (() => {
      if (fgIndex <= 20) return "Peur Extrême"
      if (fgIndex <= 40) return "Peur"
      if (fgIndex <= 60) return "Neutre"
      if (fgIndex <= 80) return "Cupidité"
      return "Cupidité Extrême"
    })()

    // Build chart data for the frontend
    const chartData = cryptoData.hourlyPrices.map(h => ({
      time: new Date(h.time).getHours() + ":00",
      price: h.price,
      open: h.open,
      high: h.high,
      low: h.low,
      volume: h.volume,
    }))

    const result = {
      signal,
      confidence,
      summary: analysis.summary || "Analyse non disponible.",
      technicalAnalysis: {
        trend: analysis.technicalAnalysis?.trend || trend,
        supportLevel: analysis.technicalAnalysis?.supportLevel || supportLevel,
        resistanceLevel: analysis.technicalAnalysis?.resistanceLevel || resistanceLevel,
        rsiApprox: analysis.technicalAnalysis?.rsiApprox || rsiApprox,
        volume24h: analysis.technicalAnalysis?.volume24h || volumeStr,
      },
      sentiment: {
        fearGreedIndex: fgIndex,
        fearGreedLabel: analysis.sentiment?.fearGreedLabel || fgLabel,
        interpretation: analysis.sentiment?.interpretation || "Sentiment de marché neutre.",
      },
      newsImpact: analysis.newsImpact || "Aucune actualité marquante à signaler.",
      newsItems,
      keyFactors: Array.isArray(analysis.keyFactors) ? analysis.keyFactors.slice(0, 5) : ["Données techniques analysées"],
      risks: Array.isArray(analysis.risks) ? analysis.risks.slice(0, 5) : ["Volatilité inhérente au marché crypto"],
      chartData,
      currentPrice: cryptoData.currentPrice,
      priceChangePct24h: cryptoData.priceChangePct24h,
      disclaimer: analysis.disclaimer || "⚠️ Cette analyse est générée par une IA et constitue une assistance à la décision, NON un conseil financier. Les performances passées ne garantissent pas les résultats futurs. Vous êtes seul responsable de vos décisions d'investissement. Consultez un conseiller financier professionnel avant toute décision d'investissement importante.",
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("AI Analysis error:", error)
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'analyse IA" },
      { status: 500 }
    )
  }
}
