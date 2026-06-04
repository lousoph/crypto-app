import { NextResponse } from 'next/server'
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
      return NextResponse.json(JSON.parse((config as any[])[0].value))
    }

    // Fallback: try reading from file
    try {
      const configPath = path.join(process.cwd(), 'pricing-config.json')
      if (fs.existsSync(configPath)) {
        const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        return NextResponse.json(data)
      }
    } catch {}

    // Default pricing
    return NextResponse.json(DEFAULT_PRICING)
  } catch {
    return NextResponse.json(DEFAULT_PRICING)
  }
}
