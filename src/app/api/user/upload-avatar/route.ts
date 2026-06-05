import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import fs from "fs"
import path from "path"

const UPLOAD_DIR = "/home/z/my-project/upload/avatars"
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("avatar") as File | null

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Type de fichier non autorisé. Utilisez JPEG, PNG, GIF ou WebP." }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Le fichier est trop volumineux (max 2 Mo)" }, { status: 400 })
    }

    // Determine extension
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    }
    const ext = extMap[file.type] || "jpg"

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Save file
    const filename = `${userId}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)
    fs.writeFileSync(filepath, buffer)

    // Also remove old avatar files with different extensions
    for (const oldExt of ["jpg", "png", "gif", "webp"]) {
      if (oldExt !== ext) {
        const oldPath = path.join(UPLOAD_DIR, `${userId}.${oldExt}`)
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath) } catch {}
        }
      }
    }

    // Update user in DB
    const avatarUrl = `/upload/avatars/${filename}`
    await db.user.update({
      where: { id: userId },
      data: { image: avatarUrl },
    })

    return NextResponse.json({ url: avatarUrl })
  } catch (error: any) {
    console.error("Upload avatar error:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
