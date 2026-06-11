import { NextResponse } from 'next/server'

interface TweetItem {
  title: string
  link: string
  pubDate: string
  description?: string
  thumbnail?: string
}

const RSS_SOURCES = [
  'https://xcancel.com/crypto_detente/rss',
  'https://nitter.privacydev.net/crypto_detente/rss',
  'https://nitter.poast.org/crypto_detente/rss',
]

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim()
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
    .replace(/\s{2,}/g, ' ').trim()
}

function parseRSSXML(xml: string): TweetItem[] {
  const items: TweetItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const titleMatch = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || block.match(/<title>([\s\S]*?)<\/title>/i)
    const linkMatch = block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) || block.match(/<link>([\s\S]*?)<\/link>/i)
    const descMatch = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || block.match(/<description>([\s\S]*?)<\/description>/i)
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)
    const enclosureMatch = block.match(/<enclosure[^>]*url="([^"]*)"/i)
    if (!titleMatch && !descMatch) continue
    const rawTitle = titleMatch ? stripHtml(titleMatch[1]) : ''
    const rawDesc = descMatch ? stripHtml(descMatch[1]) : ''
    const ct = cleanTweetText(rawTitle)
    const cd = cleanTweetText(rawDesc)
    let title = ct, description: string | undefined = undefined
    if (ct.length < 15 && cd.length > 15) {
      title = cd.length > 150 ? cd.slice(0, 147) + '...' : cd
    } else if (cd.length > 15 && cd !== ct) {
      description = cd.slice(0, 160)
    }
    const link = linkMatch ? stripHtml(linkMatch[1]) : 'https://x.com/crypto_detente'
    const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString()
    const thumbnail = enclosureMatch ? enclosureMatch[1] : undefined
    if (title.length > 10) items.push({ title, link, pubDate, description, thumbnail })
    if (items.length >= 6) break
  }
  return items
}

async function tryRSS(url: string, timeoutMs: number): Promise<TweetItem[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CryptoApp/1.0)', Accept: 'application/xml, text/xml, */*' },
      redirect: 'follow',
    })
    clearTimeout(timer)
    if (!res.ok) return []
    const text = await res.text()
    if (text.includes('<item>')) return parseRSSXML(text)
    return []
  } catch { clearTimeout(timer); return [] }
}

export const dynamic = 'force-dynamic'
export const revalidate = 300

// Global timeout: never block more than 10 seconds total
const GLOBAL_TIMEOUT = 10000

export async function GET() {
  const result = await Promise.race([
    fetchNews(),
    new Promise<TweetItem[]>((resolve) => setTimeout(() => resolve([]), GLOBAL_TIMEOUT)),
  ])
  return NextResponse.json({ news: result })
}

async function fetchNews(): Promise<TweetItem[]> {
  // Try RSS sources in parallel with short timeouts
  const results = await Promise.all(
    RSS_SOURCES.map(url => tryRSS(url, 5000))
  )
  // Return first source that has 3+ items
  for (const items of results) {
    if (items.length >= 3) return items.slice(0, 6)
  }
  // Merge all results
  const all = results.flat()
  if (all.length >= 2) return all.slice(0, 6)
  return []
}