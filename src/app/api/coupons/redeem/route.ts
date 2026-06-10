import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// POST /api/coupons/redeem — Utiliser un code promo
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 })
    }

    const upperCode = code.trim().toUpperCase()

    // Trouver le coupon
    const coupon = await db.coupon.findUnique({ where: { code: upperCode } })
    if (!coupon) {
      return NextResponse.json({ error: "Code invalide" }, { status: 404 })
    }

    // Vérifications
    if (!coupon.active) {
      return NextResponse.json({ error: "Ce code est désactivé" }, { status: 400 })
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: "Ce code a expiré" }, { status: 400 })
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Ce code a été utilisé trop de fois" }, { status: 400 })
    }

    // Vérifier si l'utilisateur a déjà utilisé ce coupon
    const existingRedemption = await db.couponRedemption.findUnique({
      where: { userId_couponId: { userId, couponId: coupon.id } },
    })
    if (existingRedemption) {
      return NextResponse.json({ error: "Vous avez déjà utilisé ce code" }, { status: 400 })
    }

    // Appliquer le coupon
    if (coupon.type === "premium_upgrade") {
      await db.user.update({
        where: { id: userId },
        data: { role: "user_premium" },
      })
    }
    // Pour type "discount", on enregistre l'utilisation (la logique de réduction
    // peut être appliquée au moment du paiement)

    // Enregistrer l'utilisation
    await db.couponRedemption.create({
      data: { userId, couponId: coupon.id },
    })

    // Incrémenter le compteur
    await db.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    })

    // Récupérer l'utilisateur mis à jour pour la réponse
    const user = await db.user.findUnique({ where: { id: userId } })

    let message = "Code appliqué avec succès !"
    if (coupon.type === "premium_upgrade") {
      const days = coupon.value ? Math.round(coupon.value) : "illimité"
      message = `Premium activé ! (${days === "illimité" ? "illimité" : days + " jours"})`
    } else if (coupon.type === "discount") {
      message = `Code appliqué ! Réduction de ${coupon.value}% sur votre prochain paiement.`
    }

    return NextResponse.json({
      success: true,
      message,
      type: coupon.type,
      newRole: user?.role,
    })
  } catch (error: any) {
    console.error("Coupon redeem error:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}