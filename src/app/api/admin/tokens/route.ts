import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/admin/tokens - List all tokens (including inactive)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const tokens = await db.token.findMany({
      orderBy: { ticker: "asc" },
      include: { _count: { select: { transactions: true } } },
    })

    return NextResponse.json(tokens)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/admin/tokens - Create a new token
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await req.json()
    const { ticker, name, coingeckoId, cryptoCompareId } = body

    const token = await db.token.create({
      data: { ticker: ticker.toUpperCase(), name, coingeckoId, cryptoCompareId },
    })

    return NextResponse.json(token, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Ce ticker existe déjà" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/admin/tokens - Update a token
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await req.json()
    const { id, ticker, name, coingeckoId, cryptoCompareId, active } = body

    const token = await db.token.update({
      where: { id },
      data: {
        ...(ticker && { ticker: ticker.toUpperCase() }),
        ...(name && { name }),
        ...(coingeckoId !== undefined && { coingeckoId }),
        ...(cryptoCompareId !== undefined && { cryptoCompareId }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json(token)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/tokens?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })

    // Deactivate instead of delete to preserve transaction history
    const token = await db.token.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json(token)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
