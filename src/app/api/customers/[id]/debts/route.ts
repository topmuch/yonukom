// ============================================================
// YonuKom — API Customer Debts
// GET /api/customers/:id/debts — liste des dettes d'un client
//   (orders où totalAmount > paidAmount AND isCancelled = false)
// Retourne : { customer, debts: Order[], totalDebt, oldestDebtDays }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface DebtItem {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  createdAt: string;
  daysSinceIssue: number;
}

// GET /api/customers/:id/debts
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await db.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        businessId: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }

    // Récupérer toutes les commandes non annulées où il reste à payer
    const orders = await db.order.findMany({
      where: {
        customerId: id,
        isCancelled: false,
        // On filtre par "reste à payer" > 0 en mémoire
        // (Prisma ne supporte pas directement la comparaison de colonnes en SQLite sans raw SQL)
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subtotal: true,
        totalAmount: true,
        paidAmount: true,
        createdAt: true,
      },
    });

    // Filtre en mémoire : only those with remaining > 0
    const now = Date.now();
    const debts: DebtItem[] = orders
      .filter((o) => o.totalAmount - o.paidAmount > 0)
      .map((o) => {
        const remaining = o.totalAmount - o.paidAmount;
        const days = Math.floor(
          (now - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          subtotal: o.subtotal,
          totalAmount: o.totalAmount,
          paidAmount: o.paidAmount,
          remaining,
          createdAt: o.createdAt.toISOString(),
          daysSinceIssue: days,
        };
      });

    const totalDebt = debts.reduce((sum, d) => sum + d.remaining, 0);
    const oldestDebtDays =
      debts.length > 0 ? Math.max(...debts.map((d) => d.daysSinceIssue)) : 0;

    return NextResponse.json({
      customer,
      debts,
      totalDebt,
      oldestDebtDays,
      debtCount: debts.length,
    });
  } catch (error) {
    console.error("[Customers/:id/debts] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des dettes" },
      { status: 500 }
    );
  }
}
