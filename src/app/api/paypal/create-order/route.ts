import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com"
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET

// Subscription pricing plans
const PLANS: Record<number, { months: number; discount: number; total: number; monthly: number; label: string }> = {
  1:  { months: 1,  discount: 0,   total: 9.99,  monthly: 9.99, label: "1 mois" },
  3:  { months: 3,  discount: 10,  total: 26.97, monthly: 8.99, label: "3 mois" },
  6:  { months: 6,  discount: 15,  total: 50.95, monthly: 8.49, label: "6 mois" },
  12: { months: 12, discount: 20,  total: 95.90, monthly: 7.99, label: "12 mois" },
}

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

// POST /api/paypal/create-order - Create a PayPal order for Premium subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const currentRole = (session.user as any).role
    if (currentRole === "admin") {
      return NextResponse.json({ error: "Les administrateurs ont déjà un accès illimité" }, { status: 400 })
    }
    if (currentRole === "user_premium") {
      return NextResponse.json({ error: "Vous êtes déjà Premium" }, { status: 400 })
    }

    const body = await req.json()
    const duration = body.duration || 1 // months

    const plan = PLANS[duration]
    if (!plan) {
      return NextResponse.json({ error: "Durée d'abonnement invalide" }, { status: 400 })
    }

    const accessToken = await getAccessToken()

    const description = duration === 1
      ? "CryptoFolio Premium — Abonnement 1 mois"
      : `CryptoFolio Premium — Abonnement ${plan.label} (-${plan.discount}%)`

    const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description,
            amount: {
              currency_code: "EUR",
              value: plan.total.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "CryptoFolio",
          locale: "fr-FR",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      }),
    })

    const orderData = await orderRes.json()

    if (!orderRes.ok) {
      console.error("PayPal create order error:", orderData)
      return NextResponse.json(
        { error: "Erreur lors de la création de la commande PayPal", details: orderData.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ orderID: orderData.id, duration })
  } catch (error: any) {
    console.error("PayPal create order exception:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
