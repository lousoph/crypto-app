import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis" }, { status: 400 })
    }

    // Find the verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token: code },
    })

    if (!verificationToken) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 })
    }

    if (verificationToken.identifier !== email) {
      return NextResponse.json({ error: "Code invalide pour cet email" }, { status: 400 })
    }

    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({ where: { token: code } })
      return NextResponse.json({ error: "Le code a expiré. Demandez un nouveau code." }, { status: 400 })
    }

    // Mark user as verified
    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    await db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    // Delete the used token
    await db.verificationToken.delete({ where: { token: code } })

    return NextResponse.json({ success: true, message: "Email vérifié avec succès" })
  } catch (error: any) {
    console.error("Verify error:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
