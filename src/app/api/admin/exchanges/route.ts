import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/admin/exchanges
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const exchanges = await db.exchange.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { transactions: true } } },
    })

    return NextResponse.json(exchanges)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/admin/exchanges
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await req.json()
    const { name } = body

    const exchange = await db.exchange.create({
      data: { name: name.toUpperCase() },
    })

    return NextResponse.json(exchange, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Cet exchange existe déjà" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/admin/exchanges
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await req.json()
    const { id, name, active } = body

    const exchange = await db.exchange.update({
      where: { id },
      data: {
        ...(name && { name: name.toUpperCase() }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json(exchange)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/exchanges?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })

    const exchange = await db.exchange.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json(exchange)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
