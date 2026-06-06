import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const UPLOAD_DIR = "/home/z/my-project/upload/avatars"

// GET /api/upload/avatars/[...path] — Serve uploaded avatar files
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: segments } = await params
    const filePath = path.join(UPLOAD_DIR, ...segments)

    // Security: ensure the resolved path is within UPLOAD_DIR
    const resolved = path.resolve(filePath)
    if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 })
    }

    const buffer = fs.readFileSync(resolved)

    // Determine content type from extension
    const ext = path.extname(resolved).toLowerCase()
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    }
    const contentType = mimeMap[ext] || "application/octet-stream"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
