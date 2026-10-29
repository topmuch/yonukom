// ============================================================
// YonuKom — API Notification Logs
// GET /api/notifications/logs?businessId=xxx&type=xxx — liste les logs
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const type = searchParams.get("type");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const logs = await db.notificationLog.findMany({
      where: {
        businessId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[NotificationLogs] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des notifications" },
      { status: 500 }
    );
  }
}
