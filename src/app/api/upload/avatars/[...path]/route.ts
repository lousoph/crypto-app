import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const UPLOAD_DIR = "/home/z/my-project/upload"

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathParts } = await params
    // The route is /api/upload/avatars/[...path], so pathParts contains the file name(s) after /avatars/
    // We need to prepend "avatars" to correctly resolve the file path within UPLOAD_DIR
    const filePath = path.join(UPLOAD_DIR, "avatars", ...pathParts)

    // Security: ensure the resolved path is within UPLOAD_DIR
    const resolved = path.resolve(filePath)
    if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const buffer = fs.readFileSync(resolved)

    // Determine content type from extension
    const ext = path.extname(resolved).toLowerCase()
    const contentTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    }
    const contentType = contentTypes[ext] || "application/octet-stream"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
