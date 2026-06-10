import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const UPLOAD_ROOT = "/home/z/my-project/upload"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const filePath = path.join(UPLOAD_ROOT, ...segments)

  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(UPLOAD_ROOT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const ext = path.extname(resolved).toLowerCase()
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  }

  const contentType = mimeTypes[ext] || "application/octet-stream"
  const buffer = fs.readFileSync(resolved)

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  })
}
