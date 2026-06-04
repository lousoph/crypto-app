import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function DELETE(request: Request) {
  try {
    const { userId, currentPassword } = await request.json()

    if (!userId || !currentPassword) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Verify current password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Ce compte utilise une authentification OAuth. Impossible de supprimer le compte.' },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Delete all user transactions first (due to foreign key constraints)
    await db.transaction.deleteMany({
      where: { userId },
    })

    // Delete user accounts (OAuth)
    await db.account.deleteMany({
      where: { userId },
    })

    // Delete user sessions
    await db.session.deleteMany({
      where: { userId },
    })

    // Delete the user
    await db.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({
      message: 'Compte supprimé avec succès',
    })
  } catch (error: any) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du compte' },
      { status: 500 }
    )
  }
}
