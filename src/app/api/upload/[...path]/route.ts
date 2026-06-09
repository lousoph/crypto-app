import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Serve uploaded files (avatars, etc.)
// Accessible at /upload/:path* via next.config.ts rewrites
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Get the file path from the URL
    const { path: pathSegments } = await params
    const relativePath = pathSegments.join("/")
    
    // Security: prevent directory traversal
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "")
    if (safePath.startsWith("..") || safePath.includes("\0")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const filePath = path.join("/home/z/my-project/upload", safePath)

    // Check file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Determine content type
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
    }
    const contentType = mimeTypes[ext] || "application/octet-stream"

    // Read file and serve
    const buffer = fs.readFileSync(filePath)

    // Cache control — 1 day for images
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error: any) {
    console.error("Serve upload error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
