// ============================================================
// YonuKom — API Notification Settings
// GET /api/notifications/settings?businessId=xxx — fetch or create default
// PUT /api/notifications/settings — upsert settings
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/notifications/settings?businessId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    let settings = await db.notificationSetting.findUnique({
      where: { businessId },
    });

    if (!settings) {
      // Créer avec les valeurs par défaut du schéma
      settings = await db.notificationSetting.create({
        data: { businessId },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[NotificationSettings] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des paramètres" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/settings — upsert
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      businessId,
      enableSaleReceipt,
      enableDebtReminders,
      debtReminderDays,
      enableStockAlerts,
      stockAlertThreshold,
      enableDailySummary,
      dailySummaryTime,
      ownerPhone,
    } = body as {
      businessId?: string;
      enableSaleReceipt?: boolean;
      enableDebtReminders?: boolean;
      debtReminderDays?: number;
      enableStockAlerts?: boolean;
      stockAlertThreshold?: number;
      enableDailySummary?: boolean;
      dailySummaryTime?: string;
      ownerPhone?: string;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    const data = {
      enableSaleReceipt: enableSaleReceipt ?? true,
      enableDebtReminders: enableDebtReminders ?? true,
      debtReminderDays: Number(debtReminderDays) || 7,
      enableStockAlerts: enableStockAlerts ?? true,
      stockAlertThreshold: Number(stockAlertThreshold) || 5,
      enableDailySummary: enableDailySummary ?? false,
      dailySummaryTime: dailySummaryTime || "20:00",
      ownerPhone: ownerPhone || null,
    };

    const settings = await db.notificationSetting.upsert({
      where: { businessId },
      create: { businessId, ...data },
      update: data,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[NotificationSettings] PUT error:", error);
    return NextResponse.json(
      { error: "Échec de la mise à jour des paramètres" },
      { status: 500 }
    );
  }
}
