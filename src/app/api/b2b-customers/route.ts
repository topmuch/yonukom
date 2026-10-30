// ============================================================
// YonuKom — API B2B Customers
// Retourne les clients B2B du commerce (filtré par businessId).
// Nouveau business = liste vide (pas de données démo).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/b2b-customers?businessId=xxx
// Si businessId absent ou "demo" → liste vide.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId || businessId === "demo") {
      return NextResponse.json([]);
    }

    const customers = await db.customer.findMany({
      where: { businessId, isB2B: true },
      orderBy: { name: "asc" },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            isCancelled: true,
          },
        },
      },
    });

    // Adapter au format attendu par l'UI (CreditDashboard, QuoteForm).
    const adapted = customers.map((c) => {
      const activeOrders = c.orders.filter(
        (o) => !o.isCancelled && o.status !== "cancelled"
      );
      const totalOrders = activeOrders.length;
      const outstandingAmount = activeOrders.reduce(
        (sum, o) => sum + Math.max(0, o.totalAmount - o.paidAmount),
        0
      );
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        isB2B: true,
        creditLimit: c.creditLimit ?? 0,
        paymentMethod: c.paymentMethod || "cash",
        totalOrders,
        outstandingAmount,
      };
    });

    return NextResponse.json(adapted);
  } catch (error) {
    console.error("[b2b-customers] GET error:", error);
    return NextResponse.json([]);
  }
}
