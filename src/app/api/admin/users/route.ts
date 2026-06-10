import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

// GET /api/admin/users - List all users (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        suspended: true,
        createdAt: true,
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/admin/users - Update user (role, suspend, name, email)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { id, role, suspended, name, email, newPassword } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 })
      }
    }

    if (email) {
      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser && existingUser.id !== id) {
        return NextResponse.json({ error: "Cet email est déjà utilisé par un autre compte" }, { status: 409 })
      }
    }

    const user = await db.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(suspended !== undefined && { suspended }),
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(newPassword && { passwordHash: await bcrypt.hash(newPassword, 12) }),
      },
    })

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/users?id=xxx — Admin delete user
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })

    // Prevent admin from deleting their own account
    if (id === (session.user as any).id) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 })
    }

    // Cascade deletes handle: transactions, accounts, sessions, couponRedemptions
    // (all have onDelete: Cascade in the schema)
    // VerificationTokens are linked by email, not userId, so clean them separately
    const user = await db.user.findUnique({ where: { id }, select: { email: true } })
    if (user?.email) {
      await db.verificationToken.deleteMany({ where: { identifier: user.email } })
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}