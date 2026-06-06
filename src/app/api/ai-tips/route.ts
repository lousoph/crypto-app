import { NextResponse } from 'next/server'

// GET /api/ai-tips — Generate AI-powered crypto tips using z-ai-web-dev-sdk
export async function GET() {
  try {
    // Fetch current Fear & Greed data for context
    let fearGreed = null
    try {
      const fgRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/fear-greed`, {
        signal: AbortSignal.timeout(5000),
      })
      if (fgRes.ok) {
        fearGreed = await fgRes.json()
      }
    } catch {}

    // Fetch global market data
    let globalData = null
    try {
      const gRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cmc/global`, {
        signal: AbortSignal.timeout(5000),
      })
      if (gRes.ok) {
        const gd = await gRes.json()
        globalData = gd.data || null
      }
    } catch {}

    const marketContext = `Fear & Greed: ${fearGreed?.value ?? 'N/A'} (${fearGreed?.classification ?? 'N/A'}). Market Cap: $${globalData?.total_market_cap?.usd ? (globalData.total_market_cap.usd / 1e12).toFixed(2) + 'T' : 'N/A'}. BTC Dominance: ${globalData?.market_cap_percentage?.btc?.toFixed(1) ?? 'N/A'}%.`

    // Use z-ai-web-dev-sdk for AI tips
    let aiTips: string[] = []
    try {
      const ZAI = await import('z-ai-web-dev-sdk')
      const zai = await ZAI.create()

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en crypto-monnaies. Génère 6 conseils/astuces pratiques et concis (2-3 phrases chacun) pour les investisseurs crypto d'aujourd'hui. 
Contexte marché: ${marketContext}
Réponds UNIQUEMENT en JSON valide, un tableau de strings: ["conseil1", "conseil2", ...]
Les conseils doivent être pertinents, actionnables et adaptés au contexte actuel du marché.
Varie les sujets: gestion de risque, DCA, altcoins, DeFi, psychologie d'investisseur, etc.`
          },
          {
            role: 'user',
            content: 'Donne-moi 6 conseils crypto pour aujourd\'hui.'
          }
        ],
        temperature: 0.7,
        max_tokens: 600,
      })

      const content = completion.choices[0]?.message?.content || ''
      // Extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        aiTips = JSON.parse(jsonMatch)
      }
    } catch (aiError) {
      console.error('AI tips generation error:', aiError)
      // Fallback tips
      aiTips = [
        'Le Dollar Cost Averaging (DCA) reste la stratégie la plus sûre pour investir en crypto sur le long terme.',
        'Ne mettez jamais plus de 5 à 10% de votre patrimoine total dans les crypto-monnaies.',
        `L'indice Fear & Greed est à ${fearGreed?.value ?? 'N/A'}. ${parseInt(String(fearGreed?.value ?? 50)) < 30 ? 'Le marché est en peur extrême - historiquement un bon moment pour accumuler.' : parseInt(String(fearGreed?.value ?? 50)) > 70 ? 'Le marché est en cupidité extrême - soyez prudent avec de nouveaux investissements.' : 'Le marché est dans une zone neutre - maintenez votre stratégie actuelle.'}`,
        'Sécurisez vos cryptos avec un hardware wallet (Ledger, Trezor) et activez toujours la 2FA.',
        'Diversifiez entre BTC (60-70%), ETH (20-30%) et un petit pourcentage d\'altcoins prometteurs.',
        'Fixez des objectifs de prix (take-profit) avant d\'investir et respectez-les rigoureusement.',
      ]
    }

    return NextResponse.json({ tips: aiTips, marketContext })
  } catch (error: any) {
    console.error('AI Tips API error:', error)
    return NextResponse.json(
      { tips: [], error: error.message },
      { status: 500 }
    )
  }
}
