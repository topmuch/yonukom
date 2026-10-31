import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================
// YonuKom — API Rendez-vous by id
// PATCH /api/appointments/[id] — met à jour le statut
//   Body: { businessId, status: "confirmed"|"completed"|"cancelled"|"pending" }
// ============================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { businessId, status, notes } = body as {
      businessId?: string;
      status?: string;
      notes?: string;
    };

    if (!businessId) {
      return NextResponse.json({ error: "businessId requis" }, { status: 400 });
    }

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    // Vérifier que le RDV appartient bien au business (anti cross-tenant)
    const existing = await db.appointment.findFirst({
      where: { id, businessId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
    }

    const data: { status?: string; notes?: string | null } = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes.trim() || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucune mise à jour" }, { status: 400 });
    }

    const updated = await db.appointment.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/appointments/[id]] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
