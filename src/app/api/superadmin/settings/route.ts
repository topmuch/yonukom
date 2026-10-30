// ============================================================
// YonuKom — Superadmin API — Platform Settings (singleton)
// GET  → returns the singleton PlatformSetting (creates with defaults if missing)
// PUT  → updates the settings
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperadmin } from "@/lib/require-superadmin";

const ALLOWED_FIELDS = [
  "seoTitle",
  "seoDescription",
  "seoKeywords",
  "ogImageUrl",
  "smtpHost",
  "smtpPort",
  "smtpUser",
  "smtpPassword",
  "smtpFromEmail",
  "smtpFromName",
  "googleAnalyticsId",
  "facebookPixelId",
] as const;

// GET /api/superadmin/settings
export async function GET(request: NextRequest) {
  try {
    const forbidden = requireSuperadmin(request);
    if (forbidden) return forbidden;

    let setting = await db.platformSetting.findUnique({
      where: { id: "singleton" },
    });

    if (!setting) {
      // Create with defaults on first access
      setting = await db.platformSetting.create({
        data: { id: "singleton" },
      });
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error("[Superadmin] Failed to fetch platform settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform settings" },
      { status: 500 }
    );
  }
}

// PUT /api/superadmin/settings
export async function PUT(request: NextRequest) {
  try {
    const forbidden = requireSuperadmin(request);
    if (forbidden) return forbidden;

    const body = await request.json();

    // Build update payload with only allowed fields
    const updateData: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        // Empty string → null for optional fields (cleaner DB state)
        const value = typeof body[field] === "string" && body[field] === "" ? null : body[field];
        // Validate smtpPort is an integer if provided
        if (field === "smtpPort" && value !== null && value !== undefined) {
          const port = Number(value);
          if (Number.isNaN(port) || port < 1 || port > 65535) {
            return NextResponse.json(
              { error: "smtpPort doit être un entier valide entre 1 et 65535" },
              { status: 400 }
            );
          }
          updateData[field] = port;
          continue;
        }
        updateData[field] = value;
      }
    }

    // Upsert — ensure singleton always exists
    const setting = await db.platformSetting.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...updateData },
      update: updateData,
    });

    // Log to PlatformLog
    try {
      await db.platformLog.create({
        data: {
          level: "info",
          category: "user_action",
          message: `Superadmin updated platform settings: ${Object.keys(updateData).join(", ")}`,
          metadata: JSON.stringify({
            updatedFields: Object.keys(updateData),
          }),
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error("[Superadmin] Failed to update platform settings:", error);
    return NextResponse.json(
      { error: "Failed to update platform settings" },
      { status: 500 }
    );
  }
}
