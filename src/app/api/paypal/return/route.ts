import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com"
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ""
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ""

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
    throw new Error("Failed to get PayPal access token")
  }
  return data.access_token
}

// GET /api/paypal/return — Handle PayPal redirect after payment
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/?payment=error", req.url))
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.redirect(new URL("/?payment=error&reason=no_credentials", req.url))
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.redirect(new URL("/?payment=error&reason=not_logged_in", req.url))
    }

    const userId = (session.user as any).id
    const currentRole = (session.user as any).role

    if (currentRole === "user_premium" || currentRole === "admin") {
      return NextResponse.redirect(new URL("/?payment=already_premium", req.url))
    }

    const accessToken = await getAccessToken()
    const captureRes = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${token}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const captureData = await captureRes.json()

    if (!captureRes.ok || captureData?.status !== "COMPLETED") {
      return NextResponse.redirect(new URL("/?payment=error&reason=capture_failed", req.url))
    }

    await db.user.update({
      where: { id: userId },
      data: {
        role: "user_premium",
        stripeCustomerId: `paypal_${token}`,
      },
    })

    return NextResponse.redirect(new URL("/?payment=success", req.url))
  } catch (error: any) {
    console.error("PayPal return error:", error)
    return NextResponse.redirect(new URL("/?payment=error&reason=exception", req.url))
  }
}
