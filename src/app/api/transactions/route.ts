import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/transactions - Get all transactions for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(req.url)
    const tokenFilter = searchParams.get("token")

    const where: any = { userId }
    if (tokenFilter) where.tokenTicker = tokenFilter

    const transactions = await db.transaction.findMany({
      where,
      include: { token: true, exchange: true },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(transactions)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const role = (session.user as any).role
    const body = await req.json()
    const { date, tokenTicker, montantInvesti, coursAchat, exchangeId, notes } = body

    // Validate inputs
    if (!date || !tokenTicker) {
      return NextResponse.json({ error: "Date et token requis" }, { status: 400 })
    }
    if (!montantInvesti || montantInvesti <= 0 || !coursAchat || coursAchat <= 0) {
      return NextResponse.json({ error: "Montant et prix doivent être positifs" }, { status: 400 })
    }

    // Freemium limit check
    if (role === "user_free") {
      const existingTransactions = await db.transaction.findMany({ where: { userId } })
      const uniqueTokens = new Set(existingTransactions.map(t => t.tokenTicker))

      if (uniqueTokens.size >= 3 && !uniqueTokens.has(tokenTicker)) {
        return NextResponse.json({
          error: "Limite atteinte",
          detail: "Le plan gratuit est limité à 3 tokens différents. Passez en Premium pour débloquer.",
        }, { status: 403 })
      }
      if (existingTransactions.length >= 10) {
        return NextResponse.json({
          error: "Limite atteinte",
          detail: "Le plan gratuit est limité à 10 transactions. Passez en Premium pour débloquer.",
        }, { status: 403 })
      }
    }

    // Validate token exists
    const token = await db.token.findUnique({ where: { ticker: tokenTicker } })
    if (!token) {
      return NextResponse.json({ error: "Token non trouvé" }, { status: 404 })
    }

    // Calculate quantity
    const quantite = montantInvesti / coursAchat

    const transaction = await db.transaction.create({
      data: {
        userId,
        date: new Date(date),
        tokenTicker,
        montantInvesti: parseFloat(montantInvesti),
        coursAchat: parseFloat(coursAchat),
        quantite,
        exchangeId: exchangeId || null,
        notes: notes || null,
      },
      include: { token: true, exchange: true },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/transactions - Update a transaction
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await req.json()
    const { id, date, tokenTicker, montantInvesti, coursAchat, exchangeId, notes } = body

    // Validate inputs
    if (!date || !tokenTicker) {
      return NextResponse.json({ error: "Date et token requis" }, { status: 400 })
    }
    if (!montantInvesti || montantInvesti <= 0 || !coursAchat || coursAchat <= 0) {
      return NextResponse.json({ error: "Montant et prix doivent être positifs" }, { status: 400 })
    }

    // Verify ownership
    const existing = await db.transaction.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 })
    }

    const quantite = montantInvesti / coursAchat

    const transaction = await db.transaction.update({
      where: { id },
      data: {
        date: new Date(date),
        tokenTicker,
        montantInvesti: parseFloat(montantInvesti),
        coursAchat: parseFloat(coursAchat),
        quantite,
        exchangeId: exchangeId || null,
        notes: notes || null,
      },
      include: { token: true, exchange: true },
    })

    return NextResponse.json(transaction)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/transactions?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    // Verify ownership
    const existing = await db.transaction.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 })
    }

    await db.transaction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
