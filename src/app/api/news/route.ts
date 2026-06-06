import { NextResponse } from 'next/server'

// GET /api/news — Fetch crypto news from @crypto_detente on X
// Uses a server-side fetch to the Twitter embed/oEmbed endpoint
export async function GET() {
  try {
    // Fetch the Twitter profile page to extract recent posts
    // We'll use the RSS feed approach with Nitter or similar
    const twitterUrl = 'https://x.com/crypto_detente'

    // Try fetching via a public RSS bridge
    const rssUrls = [
      `https://api.rss2json.com/v1/api.json?rss_url=https://nitter.net/crypto_detente/rss`,
      `https://api.rss2json.com/v1/api.json?rss_url=https://nitter.privacydev.net/crypto_detente/rss`,
    ]

    for (const url of rssUrls) {
      try {
        const res = await fetch(url, { 
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.items && data.items.length > 0) {
            const news = data.items.slice(0, 10).map((item: any) => ({
              title: item.title || '',
              description: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 200),
              link: item.link || twitterUrl,
              pubDate: item.pubDate || '',
              thumbnail: item.thumbnail || item.enclosure?.link || null,
            }))
            return NextResponse.json({ news, source: twitterUrl })
          }
        }
      } catch {}
    }

    // Fallback: return curated news items with link to the profile
    const fallbackNews = [
      {
        title: 'Crypto Détente - Actualités quotiennes',
        description: 'Suivez les dernières actualités crypto, analyses et conseils sur notre compte X.',
        link: twitterUrl,
        pubDate: new Date().toISOString(),
        thumbnail: null,
      },
    ]
    return NextResponse.json({ news: fallbackNews, source: twitterUrl })
  } catch (error: any) {
    console.error('News API error:', error)
    return NextResponse.json(
      { news: [], source: 'https://x.com/crypto_detente', error: error.message },
      { status: 500 }
    )
  }
}
