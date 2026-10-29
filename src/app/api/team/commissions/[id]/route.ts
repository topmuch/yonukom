// ============================================================
// YonuKom — API Team Commission (single) — mark as paid
// PATCH /api/team/commissions/[id]
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { businessId, status } = body as {
      businessId?: string;
      status?: string;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    const existing = await db.commission.findFirst({
      where: { id, businessId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Commission introuvable ou accès refusé" },
        { status: 404 }
      );
    }

    const updated = await db.commission.update({
      where: { id },
      data: {
        ...(status === "paid"
          ? { status: "paid", paidAt: new Date() }
          : status === "due"
            ? { status: "due", paidAt: null }
            : {}),
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        order: {
          select: { id: true, orderNumber: true, totalAmount: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Commission] PATCH error:", error);
    return NextResponse.json(
      { error: "Échec de la mise à jour de la commission" },
      { status: 500 }
    );
  }
}
