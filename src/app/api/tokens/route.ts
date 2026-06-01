import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/tokens - Get all active tokens
export async function GET() {
  try {
    const tokens = await db.token.findMany({
      where: { active: true },
      orderBy: { ticker: "asc" },
    })
    return NextResponse.json(tokens)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
