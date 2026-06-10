import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/admin/coupons — Lister tous les coupons
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { redemptions: true } } },
    })

    return NextResponse.json(coupons)
  } catch (error: any) {
    console.error("Coupons GET error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/admin/coupons — Créer un coupon
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const { code, type, value, maxUses, expiresAt, active } = body

    if (!code || !type) {
      return NextResponse.json({ error: "Code et type requis" }, { status: 400 })
    }

    const upperCode = code.trim().toUpperCase()

    const existing = await db.coupon.findUnique({ where: { code: upperCode } })
    if (existing) {
      return NextResponse.json({ error: "Ce code existe déjà" }, { status: 400 })
    }

    const coupon = await db.coupon.create({
      data: {
        code: upperCode,
        type: type || "premium_upgrade",
        value: value ?? null,
        maxUses: maxUses ?? null,
        active: active ?? true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error: any) {
    console.error("Coupon POST error:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

// PUT /api/admin/coupons — Modifier un coupon
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const { id, code, type, value, maxUses, expiresAt, active } = body

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const updateData: any = {}
    if (code !== undefined) updateData.code = code.trim().toUpperCase()
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = value
    if (maxUses !== undefined) updateData.maxUses = maxUses
    if (active !== undefined) updateData.active = active
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

    const coupon = await db.coupon.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(coupon)
  } catch (error: any) {
    console.error("Coupon PUT error:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

// DELETE /api/admin/coupons — Supprimer un coupon
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    await db.coupon.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Coupon DELETE error:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}