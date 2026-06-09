import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { newEmail, currentPassword } = await request.json()

    if (!newEmail) {
      return NextResponse.json({ error: 'Nouvel email requis' }, { status: 400 })
    }

    // Find user
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Verify current password (skip if OAuth-only user without password)
    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Mot de passe actuel requis pour cette action' }, { status: 400 })
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isValid) {
        return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
      }
    }

    // Check if email is already taken by another user
    const existingUser = await db.user.findUnique({ where: { email: newEmail } })
    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé par un autre compte' }, { status: 409 })
    }

    // Update email
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { email: newEmail },
    })

    return NextResponse.json({
      message: 'Email mis à jour avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    })
  } catch (error: any) {
    console.error('Update email error:', error)
    return NextResponse.json(
      { error: error.message || "Erreur lors de la mise à jour de l'email" },
      { status: 500 }
    )
  }
}
