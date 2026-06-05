import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      // Don't reveal whether user exists
      return NextResponse.json({ success: true })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Cet email est déjà vérifié" }, { status: 400 })
    }

    // Rate limit: check if a token was created less than 1 minute ago
    const recentToken = await db.verificationToken.findFirst({
      where: { identifier: email },
      orderBy: { expires: "desc" },
    })

    if (recentToken) {
      const tokenAge = Date.now() - (recentToken.expires.getTime() - 15 * 60 * 1000) // expires = createdAt + 15min
      if (tokenAge < 60 * 1000) {
        return NextResponse.json({ error: "Veuillez attendre 1 minute avant de renvoyer un code" }, { status: 429 })
      }
    }

    // Delete old tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Store verification token (expires in 15 minutes)
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires: new Date(Date.now() + 15 * 60 * 1000),
      },
    })

    // In production, send email here. For now, log it.
    // DEVELOPMENT: Return the verification code in the response so the UI can auto-fill it.
    // In production, remove verificationCode from the response and send via email service.
    console.log(`[VERIFICATION] Code for ${email}: ${code}`)

    return NextResponse.json({ success: true, verificationCode: code })
  } catch (error: any) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
