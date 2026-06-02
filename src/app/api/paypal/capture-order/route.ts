import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com"
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET

// Generate PayPal access token
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  })
  const data = await res.json()
  if (!data.access_token) {
    throw new Error("Failed to get PayPal access token: " + JSON.stringify(data))
  }
  return data.access_token
}

// POST /api/paypal/capture-order - Capture a PayPal order and upgrade user to Premium
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

    const { orderID, duration } = await req.json()
    if (!orderID) {
      return NextResponse.json({ error: "orderID manquant" }, { status: 400 })
    }

    const accessToken = await getAccessToken()

    // Capture the PayPal order
    const captureRes = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const captureData = await captureRes.json()

    if (!captureRes.ok) {
      console.error("PayPal capture error:", captureData)
      return NextResponse.json(
        { error: "Le paiement PayPal a échoué", details: captureData.message },
        { status: 500 }
      )
    }

    // Verify the capture status
    const captureStatus = captureData?.status
    if (captureStatus !== "COMPLETED") {
      console.error("PayPal capture not completed:", captureData)
      return NextResponse.json(
        { error: "Le paiement n'a pas été complété", status: captureStatus },
        { status: 400 }
      )
    }

    // Calculate premium expiration date based on duration
    const months = duration || 1

    // Payment confirmed — upgrade user to Premium
    const user = await db.user.update({
      where: { id: userId },
      data: {
        role: "user_premium",
        stripeCustomerId: `paypal_${orderID}`, // Store PayPal order ID for reference
      },
    })

    return NextResponse.json({
      success: true,
      message: `Félicitations ! Votre compte Premium est actif pour ${months} mois.`,
      role: user.role,
      paypalOrderId: orderID,
      duration: months,
    })
  } catch (error: any) {
    console.error("PayPal capture exception:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
