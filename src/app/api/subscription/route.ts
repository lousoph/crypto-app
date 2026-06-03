import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// POST /api/subscription — Redirect to PayPal payment flow
export async function POST(req: NextRequest) {
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

    // Return info about available plans
    return NextResponse.json({
      plans: [
        { months: 1, price: 9.99, discount: 0 },
        { months: 3, price: 26.97, discount: 10 },
        { months: 6, price: 50.95, discount: 15 },
        { months: 12, price: 95.90, discount: 20 },
      ],
      message: "Utilisez /api/paypal/create-order pour créer une commande",
    })
  } catch (error: any) {
    console.error("Subscription API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/subscription — Cancel subscription (downgrade to free)
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const currentRole = (session.user as any).role

    if (currentRole !== "user_premium") {
      return NextResponse.json({ error: "Vous n'avez pas d'abonnement Premium" }, { status: 400 })
    }

    // Downgrade user to free
    await db.user.update({
      where: { id: userId },
      data: {
        role: "user_free",
        stripeCustomerId: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Votre abonnement Premium a été annulé. Vous êtes maintenant sur le plan Gratuit.",
    })
  } catch (error: any) {
    console.error("Cancel subscription error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
