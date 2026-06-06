import { NextResponse } from 'next/server'

// GET /api/news — Crypto news with fallback to @crypto_detente X profile
export async function GET() {
  try {
    const twitterUrl = 'https://x.com/crypto_detente'

    // Return curated fallback with link to profile
    // External RSS feeds (Nitter) are unreliable, so we link directly to X
    const news = [
      {
        title: 'Crypto Détente — Actualités et analyses quotidiennes',
        description: 'Suivez les dernières actualités crypto, analyses techniques et conseils sur notre compte X.',
        link: twitterUrl,
        pubDate: new Date().toISOString(),
        thumbnail: null,
      },
      {
        title: 'Bitcoin en dessous de 200 SMA hebdomadaire — Perspectives',
        description: 'Le marché crypto traverse une phase de correction importante. Restez informés des mouvements clés.',
        link: twitterUrl,
        pubDate: new Date(Date.now() - 3600000).toISOString(),
        thumbnail: null,
      },
      {
        title: 'Fear & Greed Index : Marché en peur extrême',
        description: 'L\'indice de peur et cupidité est au plus bas — historiquement une zone d\'accumulation intéressante.',
        link: twitterUrl,
        pubDate: new Date(Date.now() - 7200000).toISOString(),
        thumbnail: null,
      },
      {
        title: 'Top altcoins à surveiller cette semaine',
        description: 'Analyse des projets les plus prometteurs et des niveaux techniques clés à monitorer.',
        link: twitterUrl,
        pubDate: new Date(Date.now() - 10800000).toISOString(),
        thumbnail: null,
      },
    ]

    return NextResponse.json({ news, source: twitterUrl })
  } catch (error: any) {
    return NextResponse.json({
      news: [{ title: 'Crypto Détente', description: 'Suivez-nous sur X pour les actualités crypto.', link: 'https://x.com/crypto_detente', pubDate: new Date().toISOString(), thumbnail: null }],
      source: 'https://x.com/crypto_detente',
    })
  }
}
