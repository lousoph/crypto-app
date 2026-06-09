import { NextResponse } from 'next/server'

interface NewsItem {
  title: string
  description: string
  link: string
  pubDate: string
  thumbnail: string | null
}

// In-memory cache
let newsCache: NewsItem[] = []
let cacheTime = 0
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

// Fallback tweets (only used if API search fails completely)
const FALLBACK_TWEETS: NewsItem[] = [
  {
    title: "L'objectif : concurrencer directement USDT et USDC. La guerre des stablecoins entre dans une nouvelle dimension.",
    description: "La guerre des stablecoins entre dans une nouvelle dimension avec de nouveaux acteurs qui menacent la domination de USDT et USDC.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 86400000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'Scott Bessent s\u2019exprime sur les taux d\u2019int\u00e9r\u00eat ! Le secr\u00e9taire au Tr\u00e9sor des \u00c9tats-Unis',
    description: "Le secr\u00e9taire au Tr\u00e9sor Scott Bessent a fait des d\u00e9clarations importantes sur les taux d\u2019int\u00e9r\u00eat et leur impact sur les march\u00e9s.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 172800000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'Patrick Witt, conseiller crypto de la Maison-Blanche, affirme que la r\u00e9union du groupe de travail crypto est imminente',
    description: "Le conseiller crypto de la Maison-Blanche confirme qu\u2019une r\u00e9union cruciale sur les crypto-monnaies aura lieu tr\u00e8s prochainement.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 259200000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'Les ETF Bitcoin enregistrent une 4e semaine cons\u00e9cutive de sorties nettes',
    description: "Les ETF Bitcoin continuent de subir des sorties nettes pour la 4e semaine cons\u00e9cutive, signalant un possible ralentissement de la demande institutionnelle.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 345600000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'Michael Saylor affirme : \u201cM\u00eame si nous vendions 1 Bitcoin, nous en aurions encore plus\u201d',
    description: "Michael Saylor r\u00e9affirme la strat\u00e9gie d\u2019accumulation de MicroStrategy : chaque Bitcoin vendu est remplac\u00e9 par davantage de BTC.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 432000000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'La demande spot sur Bitcoin se contracte \u00e0 son rythme le plus rapide depuis le 10 janvier',
    description: "Un analyste de CryptoQuant observe que la demande spot sur Bitcoin se contracte au rythme le plus rapide depuis janvier dernier.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 518400000).toISOString(),
    thumbnail: null,
  },
  {
    title: "Amazon, Meta, Google et Microsoft publieront leurs r\u00e9sultats Q1 \u2014 un moment cl\u00e9 pour les march\u00e9s",
    description: "Les g\u00e9ants de la tech publieront leurs r\u00e9sultats trimestriels, un \u00e9v\u00e9nement cl\u00e9 qui pourrait impacter fortement les march\u00e9s crypto.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 604800000).toISOString(),
    thumbnail: null,
  },
  {
    title: "La loi doit entrer en vigueur le 1er ao\u00fbt \u2014 Nouvelle r\u00e9glementation crypto",
    description: "Nouvelle r\u00e9glementation crypto qui entrera en vigueur ao\u00fbt prochain. Impact sur le march\u00e9 des actifs num\u00e9riques.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 691200000).toISOString(),
    thumbnail: null,
  },
]

interface SearchResultItem {
  url: string
  name: string
  snippet: string
  host_name: string
  rank: number
  date: string
}

async function fetchRealTweets(): Promise<NewsItem[]> {
  const mod = await import('z-ai-web-dev-sdk')
  const ZAI = mod.default || mod.ZAI || mod
  const zai = await ZAI.create()

  // Helper: extract results - SDK returns plain array with numeric keys
  const extract = (raw: any): SearchResultItem[] => {
    if (Array.isArray(raw)) return raw
    const nested = raw?.data?.results || raw?.results
    if (Array.isArray(nested)) return nested
    if (raw && typeof raw === 'object') {
      const arr = Object.values(raw).filter((v: any) => v && typeof v === 'object' && v.url)
      if (arr.length > 0) return arr as SearchResultItem[]
    }
    return []
  }

  // Search tweets from @crypto_detente on x.com
  const searchResult = await zai.functions.invoke('web_search', {
    query: 'crypto_detente site:x.com',
    num: 10,
  })
  const allResults = extract(searchResult)
  const seenUrls = new Set<string>()
  const uniqueResults: SearchResultItem[] = []

  for (const r of allResults) {
    const url = r.url || ''
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url)
      uniqueResults.push(r)
    }
  }

  if (uniqueResults.length === 0) return []

  const news = uniqueResults
    .filter((r) => r.url && r.url.includes('status/'))
    .slice(0, 10)
    .map((r) => {
      // Clean up title
      let title = (r.name || r.title || '')
        .replace(/Crypto Détente\s*[@\(].*?[)\)]\s*[:\-–]?\s*/i, '')
        .replace(/X\s*[:\-–]?\s*Crypto Détente/i, '')
        .replace(/\d+\s*(likes?|réponses?|reposts?|retweets?|vues?|views?)\s*\.?\s*$/gi, '')
        .replace(/·\s*$/, '')
        .trim()

      if (!title || title.length < 5) {
        title = (r.snippet || '').slice(0, 120).trim() || 'Crypto Détente'
      }

      // Clean up description
      let description = (r.snippet || '')
        .replace(/RT\s+@\w+:\s*/, '')
        .replace(/Crypto Détente\s*[@\(].*?[)\)]\s*[:\-–]?\s*/i, '')
        .replace(/X\s*[:\-–]?\s*Crypto Détente/i, '')
        .replace(/\.\s*$/, '')
        .trim()
        .slice(0, 250)

      return {
        title,
        description,
        link: r.url,
        pubDate: r.date || new Date().toISOString(),
        thumbnail: null,
      }
    })
    .filter((n) => n.title.length > 5 && n.link.includes('x.com'))

  return news
}

export async function GET() {
  try {
    const now = Date.now()

    // Return cached news if still fresh
    if (newsCache.length > 0 && (now - cacheTime) < CACHE_DURATION) {
      return NextResponse.json({ news: newsCache, source: 'https://x.com/crypto_detente', cached: true })
    }

    // Try to fetch real tweets with a timeout
    try {
      const freshNews = await Promise.race([
        fetchRealTweets(),
        new Promise<NewsItem[]>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 25000)
        ),
      ])

      if (freshNews.length >= 1) {
        newsCache = freshNews
        cacheTime = Date.now()
        console.log(`News API: fetched ${freshNews.length} real tweets`)
        return NextResponse.json({ news: newsCache, source: 'https://x.com/crypto_detente', cached: false })
      }
    } catch (searchErr) {
      console.error('News API: search failed, using fallback', searchErr)
    }

    // Fallback
    return NextResponse.json({ news: FALLBACK_TWEETS, source: 'https://x.com/crypto_detente', cached: false })
  } catch (error: any) {
    return NextResponse.json({
      news: FALLBACK_TWEETS,
      source: 'https://x.com/crypto_detente',
      error: error.message,
    })
  }
}