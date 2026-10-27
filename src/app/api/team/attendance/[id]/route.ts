// ============================================================
// YonuKom — API Team Attendance (single) — check-out
// PATCH /api/team/attendance/[id] — calcule workedMinutes au départ
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { businessId } = body as { businessId?: string };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier ownership
    const existing = await db.attendance.findFirst({
      where: { id, businessId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pointage introuvable ou accès refusé" },
        { status: 404 }
      );
    }

    if (!existing.checkInTime) {
      return NextResponse.json(
        { error: "Aucune heure d'arrivée enregistrée" },
        { status: 400 }
      );
    }

    if (existing.checkOutTime) {
      return NextResponse.json(
        { error: "Le départ a déjà été pointé" },
        { status: 400 }
      );
    }

    const now = new Date();
    const diffMs = now.getTime() - existing.checkInTime.getTime();
    const workedMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));

    const updated = await db.attendance.update({
      where: { id },
      data: {
        checkOutTime: now,
        workedMinutes,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Attendance] PATCH error:", error);
    return NextResponse.json(
      { error: "Échec du pointage de départ" },
      { status: 500 }
    );
  }
}
