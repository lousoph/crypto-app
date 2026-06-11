import { NextResponse } from 'next/server'

// GET /api/ai-tips — Curated crypto tips (static + market context)
export async function GET() {
  try {
    let fearGreedValue = 50
    let btcDominance = 55

    try {
      const fgRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/fear-greed`, {
        signal: AbortSignal.timeout(5000),
      })
      if (fgRes.ok) {
        const fg = await fgRes.json()
        fearGreedValue = fg.value || 50
      }
    } catch {}

    try {
      const gRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/cmc/global`, {
        signal: AbortSignal.timeout(5000),
      })
      if (gRes.ok) {
        const gd = await gRes.json()
        btcDominance = gd.data?.market_cap_percentage?.btc || 55
      }
    } catch {}

    const tips = [
      `Le Dollar Cost Averaging (DCA) reste la stratégie la plus sûre : investissez un montant fixe chaque semaine, quel que soit le prix.`,
      `Ne mettez jamais plus de 5 à 10% de votre patrimoine total dans les crypto-monnaies. La gestion du risque est primordiale.`,
      `L'indice Fear & Greed est à ${fearGreedValue}. ${fearGreedValue < 30 ? 'Le marché est en peur extrême — historiquement un bon moment pour accumuler progressivement.' : fearGreedValue > 70 ? 'Le marché est en cupidité extrême — soyez prudent, prenez des profits partiels.' : 'Le marché est dans une zone neutre — maintenez votre stratégie actuelle sans paniquer.'}`,
      `Sécurisez vos cryptos avec un hardware wallet (Ledger, Trezor) et activez toujours la 2FA sur tous vos comptes d'échange.`,
      `Diversifiez entre BTC (60-70%), ETH (20-30%) et un petit pourcentage d'altcoins prometteurs. BTC dominance: ${btcDominance.toFixed(1)}%.`,
      `Fixez des objectifs de prix (take-profit) AVANT d'investir et respectez-les rigoureusement. La discipline est la clé du succès.`,
    ]

    return NextResponse.json({ tips })
  } catch (error: any) {
    return NextResponse.json({
      tips: [
        'Le DCA est la stratégie la plus sûre pour investir en crypto sur le long terme.',
        'Ne mettez jamais plus de 5-10% de votre patrimoine dans les crypto-monnaies.',
        'Sécurisez vos cryptos avec un hardware wallet et activez la 2FA.',
        'Diversifiez entre BTC, ETH et quelques altcoins prometteurs.',
        'Fixez vos take-profit avant d\'investir et respectez-les.',
        'Ne FOMO pas sur les pumps — achetez quand le marché a peur.',
      ],
    })
  }
}
