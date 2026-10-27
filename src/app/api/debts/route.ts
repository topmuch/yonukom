// ============================================================
// YonuKom — API Debts (synthèse tous les clients endettés)
// GET /api/debts?businessId=xxx
// Retourne la liste de tous les clients ayant au moins une dette,
// avec totalDette, detteCount, plusAncienneJours.
// Trié par totalDette décroissant.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface CustomerDebtSummary {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  isB2B: boolean;
  totalDebt: number;
  debtCount: number;
  oldestDebtDays: number;
  oldestDebtDate: string | null;
}

// GET /api/debts?businessId=xxx
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

    // 1. Tous les clients du business
    const customers = await db.customer.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        isB2B: true,
      },
      orderBy: { name: "asc" },
    });

    if (customers.length === 0) {
      return NextResponse.json({ customers: [], totalDebt: 0 });
    }

    // 2. Toutes les commandes non annulées de ces clients
    const customerIds = customers.map((c) => c.id);
    const orders = await db.order.findMany({
      where: {
        customerId: { in: customerIds },
        isCancelled: false,
      },
      select: {
        id: true,
        customerId: true,
        totalAmount: true,
        paidAmount: true,
        createdAt: true,
      },
    });

    // 3. Grouper par client et calculer la dette
    const now = Date.now();
    const debtMap = new Map<
      string,
      {
        totalDebt: number;
        debtCount: number;
        oldestCreatedAt: number | null;
      }
    >();

    for (const order of orders) {
      const remaining = order.totalAmount - order.paidAmount;
      if (remaining <= 0) continue;

      const existing = debtMap.get(order.customerId) || {
        totalDebt: 0,
        debtCount: 0,
        oldestCreatedAt: null as number | null,
      };

      existing.totalDebt += remaining;
      existing.debtCount += 1;

      const orderTime = new Date(order.createdAt).getTime();
      if (
        existing.oldestCreatedAt === null ||
        orderTime < existing.oldestCreatedAt
      ) {
        existing.oldestCreatedAt = orderTime;
      }

      debtMap.set(order.customerId, existing);
    }

    // 4. Construire la liste de synthèse (uniquement clients endettés)
    const summaries: CustomerDebtSummary[] = customers
      .map((c) => {
        const debt = debtMap.get(c.id);
        if (!debt || debt.totalDebt <= 0) return null;
        const oldestDebtDays =
          debt.oldestCreatedAt !== null
            ? Math.floor((now - debt.oldestCreatedAt) / (1000 * 60 * 60 * 24))
            : 0;
        return {
          id: c.id,
          name: c.name,
          phone: c.phone ?? null,
          email: c.email ?? null,
          address: c.address ?? null,
          isB2B: c.isB2B,
          totalDebt: debt.totalDebt,
          debtCount: debt.debtCount,
          oldestDebtDays,
          oldestDebtDate:
            debt.oldestCreatedAt !== null
              ? new Date(debt.oldestCreatedAt).toISOString()
              : null,
        };
      })
      .filter((s): s is CustomerDebtSummary => s !== null)
      .sort((a, b) => b.totalDebt - a.totalDebt);

    const grandTotalDebt = summaries.reduce(
      (sum, s) => sum + s.totalDebt,
      0
    );

    return NextResponse.json({
      customers: summaries,
      totalDebt: grandTotalDebt,
      count: summaries.length,
    });
  } catch (error) {
    console.error("[Debts] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des dettes clients" },
      { status: 500 }
    );
  }
}
