// ============================================================
// YonuKom — Upload API
// POST /api/upload — accepts a multipart form with a `file` field
// Saves the file to /app/uploads/{businessId}/{timestamp}-{filename}
// Returns { url: "/api/uploads/{businessId}/{timestamp}-{filename}" }
//
// In production (Coolify), /app/uploads is a persistent volume.
// In dev (local sandbox), falls back to ./.uploads at project root.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { getTokenFromRequest } from "@/lib/auth";

// --- Configuration ---
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB (compression sharp appliquée ensuite)
const COMPRESS_MAX_WIDTH = 1600; // largeur max après redimensionnement
const COMPRESS_QUALITY = 80; // qualité WebP

/**
 * Resolve the uploads root directory.
 * - Production (Coolify): `/app/uploads` (persistent volume mount).
 * - Development: `<project>/.uploads` so we don't pollute /public.
 */
function getUploadsRoot(): string {
  // Prefer env override if present
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;
  // Heuristic: if running inside the standalone server (NODE_ENV=production),
  // use the persistent volume path.
  if (process.env.NODE_ENV === "production") {
    return "/app/uploads";
  }
  // Dev fallback: project-local .uploads
  return path.join(process.cwd(), ".uploads");
}

/**
 * Sanitize a filename: keep ASCII alphanumerics, dash, underscore, dot.
 * Replace any other character with `-`. Lowercase.
 */
function sanitizeFilename(name: string): string {
  const base = path.basename(name);
  const cleaned = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  return cleaned || "file";
}

/**
 * Determine the file extension from the MIME type.
 */
function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export async function POST(request: NextRequest) {
  try {
    // Optional auth: prefer the JWT businessId; fall back to form field.
    const tokenPayload = getTokenFromRequest(request);

    const formData = await request.formData();
    const file = formData.get("file");
    const businessIdField = formData.get("businessId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier reçu (champ `file` manquant)" },
        { status: 400 }
      );
    }

    // Resolve businessId: JWT > form field > fallback dir
    const businessId =
      tokenPayload?.businessId ||
      (typeof businessIdField === "string" && businessIdField
        ? businessIdField
        : null) ||
      "_shared";

    // --- Validate MIME type ---
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Format non supporté. Utilisez JPG, PNG ou WEBP.",
        },
        { status: 415 }
      );
    }

    // --- Validate size ---
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} Mo)` },
        { status: 413 }
      );
    }

    // --- Build destination path ---
    const uploadsRoot = getUploadsRoot();
    const safeBusinessDir = sanitizeFilename(businessId);
    const dir = path.join(uploadsRoot, safeBusinessDir);
    fs.mkdirSync(dir, { recursive: true });

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const baseName = file.name ? sanitizeFilename(file.name) : "image";
    // Strip any existing extension from baseName — on sauvegarde toujours en .webp
    const baseNameNoExt = baseName.replace(/\.[^.]+$/, "");
    const filename = `${timestamp}-${randomSuffix}-${baseNameNoExt}.webp`;
    const fullPath = path.join(dir, filename);

    // --- Compression + optimisation via sharp ---
    // Toutes les images (jpg/png/webp/gif) sont converties en WebP :
    //  - redimensionnées à largeur max 1600px (sans agrandissement)
    //  - qualité 80 (bon compromis qualité/taille)
    //  - rotation automatique selon EXIF (photos phone en portrait)
    // Cela réduit drastiquement la taille stockée et standardise le format.
    try {
      const bytes = await file.arrayBuffer();
      const inputBuffer = Buffer.from(bytes);
      const compressed = await sharp(inputBuffer)
        .rotate() // respecte l'orientation EXIF
        .resize({
          width: COMPRESS_MAX_WIDTH,
          withoutEnlargement: true,
        })
        .webp({ quality: COMPRESS_QUALITY })
        .toBuffer();
      fs.writeFileSync(fullPath, compressed);
    } catch (compressErr) {
      // Si sharp échoue (format exotique), fallback : écriture brute du fichier
      // original avec son extension d'origine.
      console.error("[Upload] sharp compression failed, falling back to raw:", compressErr);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fallbackExt = extFromMime(file.type);
      const fallbackFilename = `${timestamp}-${randomSuffix}-${baseNameNoExt}.${fallbackExt}`;
      const fallbackPath = path.join(dir, fallbackFilename);
      fs.writeFileSync(fallbackPath, buffer);
      const fallbackUrl = `/api/uploads/${safeBusinessDir}/${fallbackFilename}`;
      return NextResponse.json({ url: fallbackUrl }, { status: 201 });
    }

    // Public URL served by /api/uploads/[...path]/route.ts
    const url = `/api/uploads/${safeBusinessDir}/${filename}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("[Upload] error:", error);
    return NextResponse.json(
      { error: "Échec de l'upload du fichier" },
      { status: 500 }
    );
  }
}
