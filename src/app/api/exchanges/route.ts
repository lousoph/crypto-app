import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// GET /api/exchanges - Get all active exchanges
export async function GET() {
  try {
    const exchanges = await db.exchange.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(exchanges)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
