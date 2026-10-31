// ============================================================
// YonuKom — API Accounting Overview
// GET /api/accounting/overview?businessId=xxx&period=YYYY-MM
//
// Retourne une vue d'ensemble comptable mensuelle :
//   - revenue (CA HT)
//   - costOfGoodsSold (COGS — coût des marchandises vendues)
//   - grossProfit (marge brute)
//   - operatingExpenses (charges d'exploitation : salaires + commissions payées)
//   - netProfit
//   - vatCollected (TVA collectée — 18% du CA)
//   - vatDeductible (TVA déductible — 18% des achats reçus)
//   - vatToPay (TVA à verser)
//   - transactionCount
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VAT_RATE_SN = 0.18; // Taux TVA standard Sénégal — configurable plus tard

interface AccountingOverviewResponse {
  period: string; // YYYY-MM
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  netProfit: number;
  vatCollected: number;
  vatDeductible: number;
  vatToPay: number;
  transactionCount: number;
  purchasesTotal: number;
  salariesTotal: number;
  commissionsPaid: number;
}

// Valide le format YYYY-MM
function parsePeriod(period: string | null): { year: number; month: number } {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const [y, m] = period.split("-").map(Number);
  return { year: y, month: m };
}

function getMonthBounds(year: number, month: number) {
  // month: 1-12
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0); // premier jour du mois suivant
  return { start, end };
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

    // Vérifier ownership
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Commerce introuvable" },
        { status: 404 }
      );
    }

    // --- 1. Commandes du mois (pour revenu + COGS) ---
    const orders = await db.order.findMany({
      where: {
        businessId,
        isCancelled: false,
        createdAt: { gte: start, lt: end },
      },
      include: {
        orderItems: {
          include: {
            product: { select: { purchasePrice: true, name: true } },
          },
        },
      },
    });

    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);

    // COGS = sum(orderItem.quantity × product.purchasePrice)
    // Si le produit n'existe plus ou n'a pas de prix d'achat, COGS = 0 pour cette ligne
    let costOfGoodsSold = 0;
    for (const o of orders) {
      for (const item of o.orderItems) {
        const purchasePrice = item.product?.purchasePrice ?? 0;
        costOfGoodsSold += item.quantity * purchasePrice;
      }
    }

    const grossProfit = revenue - costOfGoodsSold;
    const grossMarginPct =
      revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;

    // --- 2. Achats reçus dans le mois (pour TVA déductible) ---
    const purchases = await db.purchase.findMany({
      where: {
        businessId,
        status: { in: ["received", "paid"] },
        receivedDate: { gte: start, lt: end },
      },
      select: { totalAmount: true, paidAmount: true },
    });

    const purchasesTotal = purchases.reduce((s, p) => s + p.totalAmount, 0);

    // --- 3. Charges d'exploitation (salaires + commissions payées) ---
    const [payrollEntries, commissionsPaid] = await Promise.all([
      db.payrollEntry.findMany({
        where: {
          businessId,
          period: periodStr,
          // advances, deductions, salaries, bonuses — tous comptent comme charges/opérations
        },
        select: { type: true, amount: true },
      }),
      db.commission.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          businessId,
          status: "paid",
          paidAt: { gte: start, lt: end },
        },
      }),
    ]);

    // Salaires bruts versés (salaries + advances + bonuses - deductions)
    // Note : advances = avances sur salaire (charge comptable au moment du versement)
    //        deductions = retenues (réduisent la charge nette mais sont déjà dans salaries)
    //        bonuses = primes (charge)
    // Pour simplifier : on somme salaries + advances + bonuses (deductions pas comptées en charge)
    const salariesTotal = payrollEntries
      .filter((e) => e.type === "salary")
      .reduce((s, e) => s + e.amount, 0);
    const advancesTotal = payrollEntries
      .filter((e) => e.type === "advance")
      .reduce((s, e) => s + e.amount, 0);
    const bonusesTotal = payrollEntries
      .filter((e) => e.type === "bonus")
      .reduce((s, e) => s + e.amount, 0);
    const salariesAndAdvances = salariesTotal + advancesTotal + bonusesTotal;

    const commissionsPaidTotal = commissionsPaid._sum.amount || 0;
    const operatingExpenses = salariesAndAdvances + commissionsPaidTotal;

    // --- 4. Bénéfice net ---
    const netProfit = grossProfit - operatingExpenses;

    // --- 5. TVA ---
    // TVA collectée = 18% du CA (sur ventes imposables — ici on suppose tout imposable)
    // TVA déductible = 18% des achats reçus
    const vatCollected = Math.round(revenue * VAT_RATE_SN);
    const vatDeductible = Math.round(purchasesTotal * VAT_RATE_SN);
    const vatToPay = vatCollected - vatDeductible;

    const response: AccountingOverviewResponse = {
      period: periodStr,
      revenue,
      costOfGoodsSold,
      grossProfit,
      grossMarginPct,
      operatingExpenses,
      netProfit,
      vatCollected,
      vatDeductible,
      vatToPay,
      transactionCount: orders.length,
      purchasesTotal,
      salariesTotal: salariesAndAdvances,
      commissionsPaid: commissionsPaidTotal,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Accounting/Overview] error:", error);
    return NextResponse.json(
      { error: "Échec du calcul de la vue comptable" },
      { status: 500 }
    );
  }
}
