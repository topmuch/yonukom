// ============================================================
// YonuKom — Serve uploaded files
// GET /api/uploads/{businessId}/{filename}
// Reads the file from the uploads root and streams it back with
// the correct Content-Type.
//
// Path traversal is prevented by validating each path segment.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Resolve the uploads root directory.
 * Must match the directory used by /api/upload.
 */
function getUploadsRoot(): string {
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;
  if (process.env.NODE_ENV === "production") {
    return "/app/uploads";
  }
  return path.join(process.cwd(), ".uploads");
}

/**
 * Map a file extension to its MIME type.
 */
function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await context.params;

    // Reject empty path
    if (!segments || segments.length === 0) {
      return NextResponse.json(
        { error: "Chemin invalide" },
        { status: 400 }
      );
    }

    // --- Path traversal protection ---
    // Each segment must be a "safe" filename: no dotfiles, no slashes,
    // no backslashes, no null bytes, no "..".
    for (const seg of segments) {
      if (
        !seg ||
        seg.includes("..") ||
        seg.includes("/") ||
        seg.includes("\\") ||
        seg.includes("\0") ||
        seg.startsWith(".")
      ) {
        return NextResponse.json(
          { error: "Chemin invalide" },
          { status: 400 }
        );
      }
    }

    const uploadsRoot = getUploadsRoot();
    const relativePath = path.join(...segments);
    const absolutePath = path.resolve(uploadsRoot, relativePath);

    // Double-check the resolved path is still inside uploadsRoot
    const normalizedRoot = path.resolve(uploadsRoot);
    if (!absolutePath.startsWith(normalizedRoot + path.sep)) {
      return NextResponse.json(
        { error: "Chemin invalide" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      return NextResponse.json(
        { error: "Fichier introuvable" },
        { status: 404 }
      );
    }

    const ext = path.extname(absolutePath).slice(1);
    const mime = mimeFromExt(ext);

    // Read the file and return it with proper Content-Type.
    // For images we set a long cache lifetime (immutable, since the
    // filename includes a timestamp + random suffix).
    const data = fs.readFileSync(absolutePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(data.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[Uploads/serve] error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture du fichier" },
      { status: 500 }
    );
  }
}
