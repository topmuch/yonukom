// ============================================================
// YonuKom — API VAT (TVA) — Déclaration mensuelle
// GET /api/accounting/vat?businessId=xxx&period=YYYY-MM
//
// Données utiles au remplissage de la déclaration mensuelle de TVA
// au Sénégal (régime du réel). Taux standard : 18%.
//
// Retourne :
//   - period
//   - vatCollected (TVA collectée / output VAT)
//   - vatDeductible (TVA déductible / input VAT)
//   - vatToPay (collectée - déductible ; si >0 → à verser, si <0 → crédit reportable)
//   - salesTotal (assiette HT des ventes)
//   - purchasesTotal (assiette HT des achats reçus)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VAT_RATE_SN = 0.18;

interface VatResponse {
  period: string;
  vatRate: number;
  salesTotal: number;
  purchasesTotal: number;
  vatCollected: number;
  vatDeductible: number;
  vatToPay: number;
  isCredit: boolean; // true si TVA déductible > collectée
  salesCount: number;
  purchasesCount: number;
  dueDate: string; // date limite de versement (20 du mois suivant)
}

function parsePeriod(period: string | null): { year: number; month: number } {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const [y, m] = period.split("-").map(Number);
  return { year: y, month: m };
}

function getMonthBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

// Calcule la date d'échéance = 20 du mois suivant
function computeDueDate(year: number, month: number): string {
  // month: 1-12 → mois suivant
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-20`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const periodParam = searchParams.get("period");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const { year, month } = parsePeriod(periodParam);
    const { start, end } = getMonthBounds(year, month);
    const periodStr = `${year}-${String(month).padStart(2, "0")}`;

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Commerce introuvable" },
        { status: 404 }
      );
    }

    // --- 1. Ventes du mois (assiette TVA collectée) ---
    const salesAgg = await db.order.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: {
        businessId,
        isCancelled: false,
        createdAt: { gte: start, lt: end },
      },
    });
    const salesTotal = salesAgg._sum.totalAmount || 0;
    const salesCount = salesAgg._count;

    // --- 2. Achats reçus dans le mois (assiette TVA déductible) ---
    const purchasesAgg = await db.purchase.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: {
        businessId,
        status: { in: ["received", "paid"] },
        receivedDate: { gte: start, lt: end },
      },
    });
    const purchasesTotal = purchasesAgg._sum.totalAmount || 0;
    const purchasesCount = purchasesAgg._count;

    // --- 3. Calculs TVA ---
    const vatCollected = Math.round(salesTotal * VAT_RATE_SN);
    const vatDeductible = Math.round(purchasesTotal * VAT_RATE_SN);
    const vatToPay = vatCollected - vatDeductible;

    const response: VatResponse = {
      period: periodStr,
      vatRate: VAT_RATE_SN,
      salesTotal,
      purchasesTotal,
      vatCollected,
      vatDeductible,
      vatToPay,
      isCredit: vatToPay < 0,
      salesCount,
      purchasesCount,
      dueDate: computeDueDate(year, month),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Accounting/VAT] error:", error);
    return NextResponse.json(
      { error: "Échec du calcul de la TVA" },
      { status: 500 }
    );
  }
}
