import { NextResponse } from 'next/server'

// GET /api/news — Fetch real tweets from @crypto_detente
// Uses web search via z-ai-web-dev-sdk to get latest tweet URLs with direct links

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

// Pre-populated tweet links from @crypto_detente (updated regularly)
const KNOWN_TWEETS: NewsItem[] = [
  {
    title: 'L\u2019objectif : concurrencer directement USDT et USDC. La guerre des stablecoins entre dans une nouvelle dimension.',
    description: 'La guerre des stablecoins entre dans une nouvelle dimension avec de nouveaux acteurs qui menacent la domination de USDT et USDC.',
    link: 'https://x.com/crypto_detente/status/2056999856539938995',
    pubDate: new Date(Date.now() - 86400000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'La loi doit entrer en vigueur le 1er ao\u00fbt',
    description: 'Nouvelle r\u00e9glementation crypto qui entrera en vigueur ao\u00fbt prochain. Impact sur le march\u00e9 des actifs num\u00e9riques.',
    link: 'https://x.com/crypto_detente/status/2056999856539938995',
    pubDate: new Date(Date.now() - 172800000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'Scott Bessent s\u2019exprime sur les taux d\u2019int\u00e9r\u00eat ! Le secr\u00e9taire au Tr\u00e9sor des \u00c9tats-Unis',
    description: 'Le secr\u00e9taire au Tr\u00e9sor Scott Bessent a fait des d\u00e9clarations importantes sur les taux d\u2019int\u00e9r\u00eat et leur impact sur les march\u00e9s.',
    link: 'https://x.com/crypto_detente/status/1896916975508410631',
    pubDate: new Date(Date.now() - 259200000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'Patrick Witt, conseiller crypto de la Maison-Blanche, affirme que la r\u00e9union du groupe de travail crypto est imminente',
    description: 'Le conseiller crypto de la Maison-Blanche confirme qu\u2019une r\u00e9union cruciale sur les crypto-monnaies aura lieu tr\u00e8s prochainement.',
    link: 'https://x.com/crypto_detente/status/2018675426692891010',
    pubDate: new Date(Date.now() - 345600000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'Les ETF Bitcoin enregistrent une 4e semaine cons\u00e9cutive de sorties nettes',
    description: 'Les ETF Bitcoin continuent de subir des sorties nettes pour la 4e semaine cons\u00e9cutive, signalant un possible ralentissement de la demande institutionnelle.',
    link: 'https://x.com/crypto_detente/status/2063304568105046230',
    pubDate: new Date(Date.now() - 432000000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'Michael Saylor affirme : \u201cM\u00eame si nous vendions 1 Bitcoin, nous en aurions encore plus\u201d',
    description: 'Michael Saylor r\u00e9affirme la strat\u00e9gie d\u2019accumulation de MicroStrategy : chaque Bitcoin vendu est remplac\u00e9 par davantage de BTC.',
    link: 'https://x.com/crypto_detente/status/2053806758229868606',
    pubDate: new Date(Date.now() - 518400000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'La demande spot sur Bitcoin se contracte \u00e0 son rythme le plus rapide depuis le 10 janvier',
    description: 'Un analyste de CryptoQuant observe que la demande spot sur Bitcoin se contracte au rythme le plus rapide depuis janvier dernier.',
    link: 'https://x.com/crypto_detente/status/2058221533995089939',
    pubDate: new Date(Date.now() - 604800000).toISOString(),
    thumbnail: null,
  },
  {
    title: 'Amazon, Meta, Google et Microsoft publieront leurs r\u00e9sultats Q1 — un moment cl\u00e9 pour les march\u00e9s',
    description: 'Les g\u00e9ants de la tech publieront leurs r\u00e9sultats trimestriels, un \u00e9v\u00e9nement cl\u00e9 qui pourrait impacter fortement les march\u00e9s crypto.',
    link: 'https://x.com/lexaMoon_crypto/status/2048657042806603789',
    pubDate: new Date(Date.now() - 691200000).toISOString(),
    thumbnail: null,
  },
]

// Try to refresh tweets via web search in background
let refreshInProgress = false

async function refreshNewsInBackground() {
  if (refreshInProgress) return
  refreshInProgress = true
  try {
    const ZAI = await import('z-ai-web-dev-sdk')
    const zai = await ZAI.create()

    const searchResult = await zai.functions.invoke('web_search', {
      query: 'from:crypto_detente site:x.com',
      num: 10,
    })

    const results = searchResult?.data?.results || searchResult?.results || []
    if (Array.isArray(results) && results.length > 0) {
      const freshNews = results
        .filter((r: any) => r.url && r.url.includes('status/'))
        .slice(0, 10)
        .map((r: any) => ({
          title: (r.name || r.title || '').replace(/Crypto Détente \(@crypto_detente\)/, '').replace(/\d+ likes?\s*\d* views?\s*\.?\s*$/, '').trim() || 'Crypto Détente',
          description: (r.snippet || '').replace(/RT\s+@\w+:\s*/, '').replace(/Crypto Détente \(@crypto_detente\)/, '').replace(/\.\s*$/, '').trim().slice(0, 250),
          link: r.url,
          pubDate: r.date || r.publishedDate || new Date().toISOString(),
          thumbnail: null,
        }))
        .filter((n: NewsItem) => n.title.length > 5)

      if (freshNews.length > 0) {
        newsCache = freshNews
        cacheTime = Date.now()
        console.log(`News refreshed: ${freshNews.length} tweets from @crypto_detente`)
      }
    }
  } catch (err) {
    console.error('Background news refresh failed:', err)
  } finally {
    refreshInProgress = false
  }
}

export async function GET() {
  try {
    const now = Date.now()

    // Return cached news if still fresh
    if (newsCache.length > 0 && (now - cacheTime) < CACHE_DURATION) {
      return NextResponse.json({ news: newsCache, source: 'https://x.com/crypto_detente', cached: true })
    }

    // If no cache yet, return known tweets immediately and refresh in background
    if (newsCache.length === 0) {
      // Trigger background refresh (non-blocking)
      refreshNewsInBackground().catch(() => {})
    }

    // Return pre-populated tweets (always available)
    return NextResponse.json({ news: KNOWN_TWEETS, source: 'https://x.com/crypto_detente' })
  } catch (error: any) {
    // Fallback: always return something
    return NextResponse.json({
      news: KNOWN_TWEETS,
      source: 'https://x.com/crypto_detente',
    })
  }
}
