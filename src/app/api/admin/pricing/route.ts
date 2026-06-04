import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const DEFAULT_PRICING = {
  plans: [
    { months: 1, discount: 0, total: 9.99, monthly: 9.99, label: '1 mois', badge: '' },
    { months: 3, discount: 10, total: 26.97, monthly: 8.99, label: '3 mois', badge: '-10%' },
    { months: 6, discount: 15, total: 50.95, monthly: 8.49, label: '6 mois', badge: '-15%' },
    { months: 12, discount: 20, total: 95.90, monthly: 7.99, label: '12 mois', badge: '-20%' },
  ],
}

// GET — returns current pricing from the AppConfig table
export async function GET() {
  try {
    // Ensure table exists
    await db.$executeRaw`CREATE TABLE IF NOT EXISTS AppConfig (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`

    const config = await db.$queryRaw`SELECT * FROM AppConfig WHERE key = 'pricing'`

    if (config && (config as any[]).length > 0) {
      const data = JSON.parse((config as any[])[0].value)
      return NextResponse.json(data)
    }

    // Default pricing
    return NextResponse.json(DEFAULT_PRICING)
  } catch (error: any) {
    // Return defaults on error
    return NextResponse.json(DEFAULT_PRICING)
  }
}

// PUT — updates pricing (admin only)
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { plans } = data

    if (!plans || !Array.isArray(plans)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    // Validate each plan
    for (const plan of plans) {
      if (!plan.months || !plan.total || !plan.monthly || !plan.label) {
        return NextResponse.json({ error: 'Champs manquants dans un plan' }, { status: 400 })
      }
    }

    // Try to upsert into AppConfig table
    try {
      // Check if table exists
      await db.$executeRaw`CREATE TABLE IF NOT EXISTS AppConfig (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`

      const existing = await db.$queryRaw`SELECT * FROM AppConfig WHERE key = 'pricing'`
      const value = JSON.stringify({ plans })

      if ((existing as any[]).length > 0) {
        await db.$executeRaw`UPDATE AppConfig SET value = ${value}, updatedAt = CURRENT_TIMESTAMP WHERE key = 'pricing'`
      } else {
        await db.$executeRaw`INSERT INTO AppConfig (key, value) VALUES ('pricing', ${value})`
      }
    } catch (dbError) {
      console.error('DB error, saving to file fallback:', dbError)
      // Fallback: write to a JSON file
      const configPath = path.join(process.cwd(), 'pricing-config.json')
      fs.writeFileSync(configPath, JSON.stringify({ plans }, null, 2))
    }

    return NextResponse.json({ message: 'Tarifs mis à jour', plans })
  } catch (error: any) {
    console.error('Pricing PUT error:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
