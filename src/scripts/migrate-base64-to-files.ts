// ============================================================
// YonuKom — Migration: base64 product images → files on disk
//
// For each product whose `imageUrl` is a base64 data URL:
//   1. Decode the base64 to a binary buffer
//   2. Save it to /app/uploads/{businessId}/{productId}.jpg
//   3. Update the product's `imageUrl` to /api/uploads/{businessId}/{productId}.jpg
//
// Idempotent: products whose imageUrl already starts with "/api/uploads/"
// or "/uploads/" are skipped.
//
// Usage:
//   bun run src/scripts/migrate-base64-to-files.ts
//   # or: npx tsx src/scripts/migrate-base64-to-files.ts
// ============================================================

import fs from "fs";
import path from "path";
import { db } from "@/lib/db";

/**
 * Resolve the uploads root directory (must match /api/upload).
 */
function getUploadsRoot(): string {
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;
  if (process.env.NODE_ENV === "production") {
    return "/app/uploads";
  }
  return path.join(process.cwd(), ".uploads");
}

/**
 * Sanitize a string for use as a directory/file name segment.
 */
function sanitizeFilename(name: string): string {
  const base = path.basename(name);
  const cleaned = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  return cleaned || "file";
}

/**
 * Determine the file extension from the data URL MIME type.
 */
function extFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:(.*?);base64/);
  const mime = match ? match[1] : "image/jpeg";
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

/**
 * Check whether an imageUrl is a base64 data URL.
 */
function isBase64DataUrl(url: string | null | undefined): boolean {
  return !!url && url.startsWith("data:image/");
}

async function migrate(): Promise<void> {
  console.log("[migrate-base64-to-files] Démarrage...");

  // Fetch all products that have a non-null imageUrl
  const products = await db.product.findMany({
    where: { NOT: { imageUrl: null } },
    select: { id: true, businessId: true, imageUrl: true, name: true },
  });

  console.log(`[migrate-base64-to-files] ${products.length} produits à examiner`);

  const uploadsRoot = getUploadsRoot();
  fs.mkdirSync(uploadsRoot, { recursive: true });

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    const imageUrl = product.imageUrl;
    if (!imageUrl) {
      skipped++;
      continue;
    }

    // Skip already-migrated products (URL-based, not base64)
    if (
      imageUrl.startsWith("/api/uploads/") ||
      imageUrl.startsWith("/uploads/") ||
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      skipped++;
      continue;
    }

    if (!isBase64DataUrl(imageUrl)) {
      // Unknown format — skip silently but log
      console.warn(
        `[migrate] produit ${product.id} imageUrl non reconnu, ignoré:`,
        imageUrl.slice(0, 60)
      );
      skipped++;
      continue;
    }

    try {
      // Determine the business directory (use _shared if no businessId)
      const businessKey = sanitizeFilename(product.businessId || "_shared");
      const dir = path.join(uploadsRoot, businessKey);
      fs.mkdirSync(dir, { recursive: true });

      // Decode base64 payload
      const commaIdx = imageUrl.indexOf(",");
      if (commaIdx === -1) {
        console.warn(`[migrate] produit ${product.id} data URL malformée`);
        errors++;
        continue;
      }
      const base64Payload = imageUrl.slice(commaIdx + 1);
      const buffer = Buffer.from(base64Payload, "base64");

      const ext = extFromDataUrl(imageUrl);
      const safeProductId = sanitizeFilename(product.id);
      const filename = `${safeProductId}.${ext}`;
      const fullPath = path.join(dir, filename);

      fs.writeFileSync(fullPath, buffer);

      // Update DB row to point to the URL served by /api/uploads/[...path]
      const newUrl = `/api/uploads/${businessKey}/${filename}`;
      await db.product.update({
        where: { id: product.id },
        data: { imageUrl: newUrl },
      });

      migrated++;
      console.log(
        `[migrate] OK produit ${product.id} → ${newUrl} (${buffer.length} octets)`
      );
    } catch (err) {
      errors++;
      console.error(
        `[migrate] ERREUR produit ${product.id} (${product.name}):`,
        err
      );
    }
  }

  console.log(
    `[migrate-base64-to-files] Terminé. migrés=${migrated} ignorés=${skipped} erreurs=${errors}`
  );
}

migrate()
  .catch((err) => {
    console.error("[migrate-base64-to-files] Erreur fatale:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
