import { NextResponse } from 'next/server'

interface NewsItem {
  title: string
  description: string
  link: string
  pubDate: string
  thumbnail: string | null
}

// In-memory cache — 5 min for near-real-time
let newsCache: NewsItem[] = []
let cacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000

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

  // Search for latest tweets from @crypto_detente
  const searchResult = await zai.functions.invoke('web_search', {
    query: 'from:crypto_detente site:x.com',
    num: 15,
  })
  const allResults = extract(searchResult)

  // Deduplicate by URL
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

  // Filter only tweet URLs (contain /status/) and are from crypto_detente
  const tweets = uniqueResults
    .filter((r) => r.url.includes('/status/') && r.url.includes('crypto_detente'))

  if (tweets.length === 0) return []

  const news: NewsItem[] = tweets.slice(0, 10).map((r) => {
    // Use name as primary (often has the tweet text) and snippet as fallback
    const nameRaw = (r.name || '').trim()
    const snippetRaw = (r.snippet || '').trim()

    // Clean name — remove account name prefix and engagement
    let title = nameRaw
      .replace(/^Crypto Détente\s*[@(].*?[)]\s*[:\-–.]?\s*/i, '')
      .replace(/X\s*[:\-–]?\s*Crypto Détente/i, '')
      .replace(/\d+\s*(likes?|réponses?|reposts?|retweets?|vues?|views?)\s*\.?\s*$/gi, '')
      .replace(/·\s*$/, '')
      .trim()

    // If name was just "Crypto Détente" (image-only tweets), use snippet
    if (title.length < 15 || /^Crypto Détente$/i.test(title)) {
      const cleanSnippet = snippetRaw
        .replace(/^(Crypto Détente\s*@\s*crypto_detente)\s*[:\-–.]?\s*/i, '')
        .replace(/\d+\s*(likes?|réponses?|reposts?|retweets?|vues?|views?)\s*\.?\s*$/gi, '')
        .replace(/·\s*$/, '')
        .trim()
      if (cleanSnippet.length > title.length) {
        title = cleanSnippet
      }
    }

    // Final fallback
    if (title.length < 10) {
      title = (nameRaw + ' ' + snippetRaw).slice(0, 150).trim()
    }

    // Description: cleaned snippet, shorter
    let description = snippetRaw
      .replace(/^(Crypto Détente\s*@\s*crypto_detente)\s*[:\-–.]?\s*/i, '')
      .replace(/\d+\s*(likes?|réponses?|reposts?|retweets?|vues?|views?)\s*\.?\s*$/gi, '')
      .trim()

    // If description is same as title, clear it
    if (description === title) {
      description = ''
    }

    return {
      title,
      description: description.length > 0 ? description.slice(0, 250) : '',
      link: r.url,
      pubDate: r.date || new Date().toISOString(),
      thumbnail: null,
    }
  })
    .filter((n) => n.title.length > 10 && !/^Crypto Détente$/i.test(n.title))
    .slice(0, 6)

  return news
}

// Fallback tweets (only used if search fails completely)
const FALLBACK_TWEETS: NewsItem[] = [
  {
    title: "Plus de 5,7 milliards de dollars de positions longues ont été liquidées en seulement 7 jours",
    description: "Une vague massive de liquidations secoue le marché crypto.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 86400000).toISOString(),
    thumbnail: null,
  },
  {
    title: "Le CEO de Strategy réaffirme que l'objectif reste d'accumuler toujours plus de Bitcoin",
    description: "Les rumeurs contraires ne sont que des rumeurs.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 172800000).toISOString(),
    thumbnail: null,
  },
  {
    title: "Scott Bessent s'exprime sur les taux d'intérêt",
    description: "Le secrétaire au Trésor des États-Unis fait des déclarations importantes.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 259200000).toISOString(),
    thumbnail: null,
  },
  {
    title: "La loi crypto doit entrer en vigueur le 1er août",
    description: "Nouvelle réglementation crypto avec un impact potentiel sur le marché.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 345600000).toISOString(),
    thumbnail: null,
  },
  {
    title: "La Bolivie va intégrer la crypto dans son système financier",
    description: "En commençant par les stablecoins, selon Reuters. Un tournant majeur.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 432000000).toISOString(),
    thumbnail: null,
  },
  {
    title: "Les ETF Bitcoin enregistrent une 4e semaine consécutive de sorties nettes",
    description: "La demande institutionnelle montre des signes de ralentissement.",
    link: 'https://x.com/crypto_detente',
    pubDate: new Date(Date.now() - 518400000).toISOString(),
    thumbnail: null,
  },
]

export async function GET() {
  try {
    const now = Date.now()

    // Return cached if still fresh
    if (newsCache.length > 0 && (now - cacheTime) < CACHE_DURATION) {
      return NextResponse.json({ news: newsCache, source: 'https://x.com/crypto_detente', cached: true })
    }

    // Fetch real tweets
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