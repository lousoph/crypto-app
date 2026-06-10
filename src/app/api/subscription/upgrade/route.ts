import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// POST /api/subscription/upgrade — Direct upgrade to Premium (simulated PayPal payment)
// Used when PayPal credentials are not configured or as a test payment mode
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const currentRole = (session.user as any).role

    if (currentRole === "admin") {
      return NextResponse.json({ error: "Les administrateurs ont déjà un accès illimité" }, { status: 400 })
    }
    if (currentRole === "user_premium") {
      return NextResponse.json({ error: "Vous êtes déjà Premium" }, { status: 400 })
    }

    // Upgrade user to Premium
    const user = await db.user.update({
      where: { id: userId },
      data: {
        role: "user_premium",
        stripeCustomerId: `direct_upgrade_${Date.now()}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Félicitations ! Votre compte Premium est maintenant actif.",
      role: user.role,
    })
  } catch (error: any) {
    console.error("Direct upgrade error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
