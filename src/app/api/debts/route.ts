// ============================================================
// YonuKom — API Dettes clients
// GET  /api/debts?businessId=xxx&status=yyy  → liste des dettes (avec client)
// POST /api/debts                            → crée une nouvelle dette
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface PaymentHistoryEntry {
  date: string;
  amount: number;
  method: string;
  reference?: string;
}

// GET /api/debts?businessId=xxx&status=yyy
// Retourne la liste des dettes du business, triée par date de dette décroissante.
// Le paramètre `status` est optionnel : "active" | "partial" | "paid".
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { businessId };
    if (status && ["active", "partial", "paid"].includes(status)) {
      where.status = status;
    }

    const debts = await db.debt.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            isB2B: true,
          },
        },
      },
      orderBy: { debtDate: "desc" },
    });

    // Calculer le total général + total restant à recouvrer
    const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
    const totalRemaining = debts.reduce(
      (sum, d) => sum + Math.max(0, d.amount - d.paidAmount),
      0
    );

    return NextResponse.json({
      debts,
      totalDebt,
      totalRemaining,
      count: debts.length,
    });
  } catch (error) {
    console.error("[Debts] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des dettes" },
      { status: 500 }
    );
  }
}

// POST /api/debts
// Body: { businessId, customerId, amount, debtDate, expectedPaymentDate?, notes?, orderId? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      customerId,
      amount,
      debtDate,
      expectedPaymentDate,
      notes,
      orderId,
    } = body as {
      businessId?: string;
      customerId?: string;
      amount?: number | string;
      debtDate?: string;
      expectedPaymentDate?: string | null;
      notes?: string | null;
      orderId?: string | null;
    };

    // --- Validation de base ---
    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }
    if (!customerId) {
      return NextResponse.json(
        { error: "customerId est obligatoire" },
        { status: 400 }
      );
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "amount doit être un entier positif (FCFA)" },
        { status: 400 }
      );
    }

    // Vérifier que le business existe
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: `Business introuvable pour businessId="${businessId}"` },
        { status: 400 }
      );
    }

    // Vérifier que le customer existe ET appartient à ce business
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: { id: true, businessId: true, name: true },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 400 }
      );
    }
    if (customer.businessId !== businessId) {
      return NextResponse.json(
        { error: "Accès refusé : ce client n'appartient pas à votre business" },
        { status: 403 }
      );
    }

    // Vérifier orderId si fourni
    if (orderId) {
      const order = await db.order.findUnique({
        where: { id: orderId },
        select: { id: true, businessId: true },
      });
      if (!order) {
        return NextResponse.json(
          { error: "Commande liée introuvable" },
          { status: 400 }
        );
      }
      if (order.businessId !== businessId) {
        return NextResponse.json(
          { error: "Commande liée n'appartient pas à votre business" },
          { status: 403 }
        );
      }
    }

    // Parser les dates (debtDate requis, expectedPaymentDate optionnel)
    const parsedDebtDate = debtDate ? new Date(debtDate) : new Date();
    if (isNaN(parsedDebtDate.getTime())) {
      return NextResponse.json(
        { error: "debtDate invalide" },
        { status: 400 }
      );
    }
    let parsedExpectedPaymentDate: Date | null = null;
    if (expectedPaymentDate) {
      const d = new Date(expectedPaymentDate);
      if (!isNaN(d.getTime())) {
        parsedExpectedPaymentDate = d;
      }
    }

    const debt = await db.debt.create({
      data: {
        businessId,
        customerId,
        amount: Math.floor(amountNum),
        paidAmount: 0,
        debtDate: parsedDebtDate,
        expectedPaymentDate: parsedExpectedPaymentDate,
        status: "active",
        notes: notes ? String(notes).slice(0, 1000) : null,
        orderId: orderId || null,
        paymentHistory: "[]",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            isB2B: true,
          },
        },
      },
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    console.error("[Debts] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la création de la dette" },
      { status: 500 }
    );
  }
}

// Helper exporté pour parser l'historique de paiements (utilisé par PATCH + GET /api/debts/[id])
export function parsePaymentHistory(raw: string | null | undefined): PaymentHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PaymentHistoryEntry[];
  } catch {
    return [];
  }
}

export function serializePaymentHistory(entries: PaymentHistoryEntry[]): string {
  return JSON.stringify(entries);
}
