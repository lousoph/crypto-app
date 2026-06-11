import { NextResponse } from 'next/server'

interface TweetItem {
  title: string
  link: string
  pubDate: string
  description?: string
  thumbnail?: string
}

function cleanTitle(title: string, description?: string): string {
  let cleaned = title
    .replace(/Crypto Détente.*?(?:on X|\/ X|Twitter).*$/i, '')
    .replace(/Crypto Détente\s*\(.*?\)\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // If title is too short or just the account name, use description instead
  if (cleaned.length < 20 && description) {
    const descClean = description
      .replace(/^Crypto Détente[^:]*:\s*/i, '')
      .replace(/\d+\s*(views?|likes?|reposts?|réponses?|retweets?)\.*$/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
    if (descClean.length > 20) {
      cleaned = descClean.length > 120 ? descClean.slice(0, 117) + '...' : descClean
    }
  }

  return cleaned
}

function cleanDesc(desc: string): string {
  return desc
    .replace(/\d+\s*(views?|likes?|reposts?|réponses?|retweets?)\.*$/gi, '')
    .replace(/Crypto Détente.*?(?:on X|Twitter).*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export const dynamic = 'force-dynamic'
export const revalidate = 300

export async function GET() {
  try {
    const news: TweetItem[] = []

    // Strategy 1: Web search for tweets from @crypto_detente on X
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const searchResult: any[] = await zai.functions.invoke('web_search', {
        query: 'from:crypto_detente site:x.com',
        num: 12,
      })

      if (Array.isArray(searchResult) && searchResult.length > 0) {
        const tweets = searchResult
          .filter((r: any) => {
            const url = r.url || ''
            // Only keep actual tweet URLs with /status/
            if (!url.includes('/status/')) return false
            if (url.includes('/with_replies')) return false
            return true
          })
          .slice(0, 6)

        for (const result of tweets) {
          const rawTitle = result.name?.replace(/\n/g, ' ').trim() || ''
          const rawDesc = result.snippet?.replace(/<[^>]*>/g, '') || ''
          const desc = cleanDesc(rawDesc)

          const title = cleanTitle(rawTitle, desc)
          if (title && title.length > 10) {
            news.push({
              title,
              link: result.url?.includes('/status/') ? result.url : `https://x.com/crypto_detente`,
              pubDate: result.date || new Date().toISOString(),
              description: desc.length > 25 && desc !== title ? desc.slice(0, 140) : undefined,
            })
          }
        }

        if (news.length >= 3) return NextResponse.json({ news })
      }
    } catch (e) {
      console.error('Strategy 1 failed:', e)
    }

    // Strategy 2: Broader search without site: filter
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const searchResult: any[] = await zai.functions.invoke('web_search', {
        query: 'from:crypto_detente',
        num: 12,
      })

      if (Array.isArray(searchResult) && searchResult.length > 0) {
        for (const result of searchResult.slice(0, 8)) {
          const url = result.url || ''
          if (url.includes('/with_replies') || url.endsWith('/crypto_detente')) continue

          const rawTitle = result.name?.replace(/\n/g, ' ').trim() || ''
          const rawDesc = result.snippet?.replace(/<[^>]*>/g, '') || ''
          const desc = cleanDesc(rawDesc)
          const title = cleanTitle(rawTitle, desc)

          if (title && title.length > 10 && !news.some(n => n.link === url)) {
            news.push({
              title,
              link: url.includes('/status/') ? url : `https://x.com/crypto_detente`,
              pubDate: result.date || new Date().toISOString(),
              description: desc.length > 25 && desc !== title ? desc.slice(0, 140) : undefined,
            })
          }
          if (news.length >= 6) break
        }
      }
    } catch {}

    return NextResponse.json({ news })
  } catch (error: any) {
    console.error('News fetch error:', error)
    return NextResponse.json({ news: [], error: 'Failed to fetch news' })
  }
}