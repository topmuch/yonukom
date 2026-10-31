// ============================================================
// YonuKom — API Team Payroll (Paie / Avances / Retenues)
// GET  /api/team/payroll?businessId=xxx&userId=xxx&period=YYYY-MM
// POST /api/team/payroll — crée une entrée de paie
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const userId = searchParams.get("userId");
    const period = searchParams.get("period");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const entries = await db.payrollEntry.findMany({
      where: {
        businessId,
        ...(userId ? { userId } : {}),
        ...(period ? { period } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("[Payroll] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des entrées de paie" },
      { status: 500 }
    );
  }
}

// POST /api/team/payroll
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { businessId, userId, type, amount, period, notes } = body as {
      businessId?: string;
      userId?: string;
      type?: string;
      amount?: number;
      period?: string;
      notes?: string;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }
    if (!userId) {
      return NextResponse.json(
        { error: "userId est obligatoire" },
        { status: 400 }
      );
    }

    const allowedTypes = ["advance", "deduction", "salary", "bonus"];
    if (!type || !allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: `type doit être parmi: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "amount doit être un nombre positif" },
        { status: 400 }
      );
    }

    // Période par défaut = mois courant
    const periodStr =
      typeof period === "string" && /^\d{4}-\d{2}$/.test(period)
        ? period
        : new Date().toISOString().slice(0, 7);

    // Vérifier ownership du user
    const user = await db.user.findFirst({
      where: { id: userId, businessId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable dans ce commerce" },
        { status: 404 }
      );
    }

    const entry = await db.payrollEntry.create({
      data: {
        businessId,
        userId,
        type,
        amount: Math.round(numericAmount),
        period: periodStr,
        notes: notes?.trim() || null,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[Payroll] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la création de l'entrée de paie" },
      { status: 500 }
    );
  }
}
