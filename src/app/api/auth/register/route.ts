import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        passwordHash: hashedPassword,
        role: "user_free",
      },
    })

    // Generate 6-digit verification code
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
    console.log(`[VERIFICATION] Code for ${email}: ${code}`)

    return NextResponse.json({ id: user.id, email: user.email, role: user.role, requiresVerification: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
