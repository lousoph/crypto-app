import { NextResponse } from 'next/server'

interface TweetItem {
  title: string
  link: string
  pubDate: string
  description?: string
  thumbnail?: string
}

// List of Nitter/XCancels RSS endpoints to try
const RSS_SOURCES = [
  'https://xcancel.com/crypto_detente/rss',
  'https://nitter.privacydev.net/crypto_detente/rss',
  'https://nitter.poast.org/crypto_detente/rss',
]

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function cleanTweetText(text: string): string {
  return text
    .replace(/^Crypto Détente\s*\(@crypto_detente\)\.\s*/i, '')
    .replace(/^Crypto Détente\s*$/i, '')
    .replace(/\d+\s*(vues?|views?|likes?|reposts?|réponses?|retweets?|replies?)\.?\s*/gi, '')
    .replace(/Crypto Détente.*?(?:on X|\/ X|Twitter).*$/i, '')
    .replace(/Crypto Détente\s*\(.*?\)\s*$/i, '')
    .replace(/@\w+/g, '')
    .replace(/https?:\/\/t\.co\/\S+/g, '')
    .replace(/pic\.twitter\.com\/\S+/g, '')
    .replace(/Pour la news détaillée\s*:\s*t\.me\/\S*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function parseRSSXML(xml: string): TweetItem[] {
  const items: TweetItem[] = []
  // Extract <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]

    const titleMatch = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)
      || block.match(/<title>([\s\S]*?)<\/title>/i)
    const linkMatch = block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i)
      || block.match(/<link>([\s\S]*?)<\/link>/i)
    const descMatch = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)
      || block.match(/<description>([\s\S]*?)<\/description>/i)
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)
    const enclosureMatch = block.match(/<enclosure[^>]*url="([^"]*)"/i)

    if (!titleMatch && !descMatch) continue

    const rawTitle = titleMatch ? stripHtml(titleMatch[1]) : ''
    const rawDesc = descMatch ? stripHtml(descMatch[1]) : ''
    const cleanedRawTitle = cleanTweetText(rawTitle)
    const cleanedRawDesc = cleanTweetText(rawDesc)

    // RSS often puts account name as title and tweet content as description
    // Use description as title when title is just the account name
    let title = cleanedRawTitle
    let description: string | undefined = undefined
    if (cleanedRawTitle.length < 15 && cleanedRawDesc.length > 15) {
      title = cleanedRawDesc.length > 150 ? cleanedRawDesc.slice(0, 147) + '...' : cleanedRawDesc
    } else if (cleanedRawDesc.length > 15 && cleanedRawDesc !== cleanedRawTitle) {
      description = cleanedRawDesc.slice(0, 160)
    }

    const link = linkMatch ? stripHtml(linkMatch[1]) : 'https://x.com/crypto_detente'
    const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString()
    const thumbnail = enclosureMatch ? enclosureMatch[1] : undefined

    if (title.length > 10) {
      items.push({ title, link, pubDate, description, thumbnail })
    }

    if (items.length >= 6) break
  }

  return items
}

function parseRssJson(data: any): TweetItem[] {
  const items: TweetItem[] = []
  if (!data?.items) return items

  for (const item of data.items.slice(0, 6)) {
    const rawTitle = cleanTweetText(stripHtml(item.title || ''))
    const rawDesc = cleanTweetText(stripHtml(item.description || item.content || ''))

    // Use description as title when title is just the account name
    let title = rawTitle
    let description: string | undefined = undefined
    if (rawTitle.length < 15 && rawDesc.length > 15) {
      title = rawDesc.length > 150 ? rawDesc.slice(0, 147) + '...' : rawDesc
    } else if (rawDesc.length > 15 && rawDesc !== rawTitle) {
      description = rawDesc.slice(0, 160)
    }

    if (title.length < 10) continue

    items.push({
      title,
      link: item.link || `https://x.com/crypto_detente`,
      pubDate: item.pubDate || item.published || new Date().toISOString(),
      description,
      thumbnail: item.thumbnail || item.enclosure?.link || undefined,
    })
  }

  return items
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoApp/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, application/json, */*',
      },
    })
    clearTimeout(timer)
    return res
  } catch {
    clearTimeout(timer)
    return null
  }
}

export const dynamic = 'force-dynamic'
// Cache for 5 minutes to avoid hammering RSS sources
export const revalidate = 300

export async function GET() {
  try {
    // Strategy 1: Direct RSS XML from Nitter/XCancel instances
    for (const rssUrl of RSS_SOURCES) {
      try {
        const res = await fetchWithTimeout(rssUrl, 8000)
        if (!res || !res.ok) continue

        const contentType = res.headers.get('content-type') || ''
        const text = await res.text()

        if (text.includes('<item>') || text.includes('<entry>')) {
          const items = parseRSSXML(text)
          if (items.length >= 3) {
            return NextResponse.json({ news: items.slice(0, 6) })
          }
        }
      } catch (e) {
        console.error(`RSS source ${rssUrl} failed:`, e)
      }
    }

    // Strategy 2: RSS2JSON API with Nitter RSS
    for (const rssUrl of RSS_SOURCES) {
      try {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
        const res = await fetchWithTimeout(apiUrl, 10000)
        if (!res || !res.ok) continue

        const data = await res.json()
        if (data.status === 'ok' && data.items?.length > 0) {
          const items = parseRssJson(data)
          if (items.length >= 2) {
            return NextResponse.json({ news: items.slice(0, 6) })
          }
        }
      } catch {}
    }

    // Strategy 3: Lightweight web search via z-ai-web-dev-sdk (with short timeout)
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 12000)

      const searchResult: any[] = await Promise.race([
        zai.functions.invoke('web_search', {
          query: 'from:crypto_detente site:x.com',
          num: 10,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000)),
      ]) as any[]

      clearTimeout(timer)

      if (Array.isArray(searchResult) && searchResult.length > 0) {
        const news: TweetItem[] = []
        for (const result of searchResult) {
          const url = result.url || ''
          if (!url.includes('/status/') || url.includes('/with_replies')) continue

          const rawTitle = (result.name || '').replace(/\n/g, ' ').trim()
          const rawDesc = (result.snippet || '').replace(/<[^>]*>/g, '')
          const cleanedTitle = cleanTweetText(rawTitle)
          const cleanedDesc = cleanTweetText(rawDesc)

          // Use description as title when title is just the account name
          let title = cleanedTitle
          let description: string | undefined = undefined
          if (cleanedTitle.length < 20 && cleanedDesc.length > 20) {
            title = cleanedDesc.length > 150 ? cleanedDesc.slice(0, 147) + '...' : cleanedDesc
          } else if (cleanedDesc.length > 20 && cleanedDesc !== cleanedTitle) {
            description = cleanedDesc.slice(0, 140)
          }

          if (title.length > 15) {
            news.push({
              title,
              link: url,
              pubDate: result.date || new Date().toISOString(),
              description,
            })
          }
          if (news.length >= 6) break
        }
        if (news.length >= 2) return NextResponse.json({ news })
      }
    } catch (e) {
      console.error('Web search strategy failed:', e)
    }

    // No results from any strategy
    return NextResponse.json({ news: [] })
  } catch (error: any) {
    console.error('News fetch error:', error)
    return NextResponse.json({ news: [], error: 'Failed to fetch news' })
  }
}